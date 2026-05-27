import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { COACHING_SYSTEM_PROMPT } from '../../../lib/coachingPrompt';
import { Resend } from 'resend';
import { generateCoachingEmail } from '../../../lib/emailTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  console.log('===== EVALUATE ROUTE STARTED =====');
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  
  try {
    const { submissionId } = await request.json();
    console.log('Received submissionId:', submissionId);

    if (!submissionId) {
      return Response.json({ error: 'No submission ID provided' }, { status: 400 });
    }

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!submission.transcript) {
      return Response.json({ error: 'No transcript to evaluate' }, { status: 400 });
    }

    // Update status to evaluating
    await supabase
      .from('submissions')
      .update({ status: 'evaluating' })
      .eq('id', submissionId);

    console.log('Evaluating submission:', submissionId);
    console.log('Transcript length:', submission.transcript.length);

    // Send to Claude
    const userMessage = `Outcome: ${submission.outcome}\n\nTRANSCRIPT:\n${submission.transcript}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: COACHING_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    const responseText = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    console.log('Claude response received, length:', responseText.length);

    // Parse the JSON response
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    let feedback;
    try {
      feedback = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Claude returned invalid JSON');
    }

    // Save feedback to database
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        feedback: feedback,
        overall_score: feedback.overall_score,
        status: 'completed'
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    console.log('Evaluation saved successfully');

    // Send coaching email
    try {
      const emailHtml = generateCoachingEmail(feedback, submission.rep_email, submission.outcome);
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Coach <onboarding@resend.dev>',
        to: submission.rep_email,
        subject: `Today's estimate breakdown — ${feedback.overall_score.toFixed(1)}/10`,
        html: emailHtml,
      });

      if (emailError) {
        console.error('Email send error:', emailError);
      } else {
        console.log('Email sent successfully, ID:', emailData?.id);
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
    }

    return Response.json({ 
      success: true, 
      feedback: feedback 
    });

  } catch (err) {
    console.error('Evaluation error:', err);

    try {
      const body = await request.clone().json();
      if (body.submissionId) {
        await supabase
          .from('submissions')
          .update({ status: 'error: eval - ' + (err.message || 'unknown').slice(0, 150) })
          .eq('id', body.submissionId);
      }
    } catch (e) {}

    return Response.json({ 
      error: err.message || 'Evaluation failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 60;
