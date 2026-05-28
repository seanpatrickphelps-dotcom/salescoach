import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { COACHING_SYSTEM_PROMPT } from '../../../lib/coachingPrompt';
import { generateCoachingEmail } from '../../../lib/emailTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Load all knowledge files from /knowledge folder at runtime
function loadKnowledgeBase() {
  try {
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    
    if (!fs.existsSync(knowledgeDir)) {
      console.log('Knowledge directory not found, proceeding without it');
      return '';
    }
    
    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
    console.log('Loading knowledge files:', files);
    
    const contents = files.map(file => {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = file.replace('.md', '').toUpperCase();
      return `===== ${fileName} =====\n${content}\n\n`;
    }).join('');
    
    console.log('Knowledge base loaded, total length:', contents.length);
    return contents;
  } catch (err) {
    console.error('Error loading knowledge base:', err);
    return '';
  }
}

export async function POST(request) {
  console.log('===== EVALUATE ROUTE STARTED =====');
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length);
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

  try {
    const { submissionId } = await request.json();
    console.log('Received submissionId:', submissionId);
    
    if (!submissionId) {
      return Response.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    // Fetch the submission FIRST to check current status
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error('Failed to fetch submission:', fetchError);
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    // IDEMPOTENCY CHECK: Already completed? Don't re-evaluate or re-send email.
    if (submission.status === 'completed') {
      console.log('Submission already completed. Skipping duplicate evaluation.');
      return Response.json({ 
        success: true, 
        message: 'Already completed, skipping duplicate evaluation' 
      });
    }

    // ATOMIC UPDATE: Set status to 'evaluating' only if not already evaluating/completed
    // This prevents race conditions when multiple webhooks trigger evaluation simultaneously
    const { data: lockData, error: lockError } = await supabase
      .from('submissions')
      .update({ status: 'evaluating' })
      .eq('id', submissionId)
      .eq('status', 'transcribed')  // Only proceed if status is exactly 'transcribed'
      .select();
    
    if (lockError) {
      console.error('Failed to lock submission:', lockError);
      throw new Error('Failed to lock submission for evaluation');
    }
    
    // If no rows updated, another process already claimed this submission
    if (!lockData || lockData.length === 0) {
      console.log('Another evaluation already in progress for this submission. Skipping.');
      return Response.json({ 
        success: true, 
        message: 'Already being evaluated' 
      });
    }

    console.log('Evaluating submission:', submissionId);
    console.log('Transcript length:', submission.transcript?.length || 0);

    if (!submission.transcript) {
      throw new Error('No transcript available for evaluation');
    }

    // Load the knowledge base
    const knowledgeBase = loadKnowledgeBase();

    // Build the user message with full context
    const userMessage = `${knowledgeBase ? `===== COLLEGE WORKS KNOWLEDGE BASE =====\n\n${knowledgeBase}\n\n` : ''}===== APPOINTMENT TO EVALUATE =====

OUTCOME REPORTED BY REP: ${submission.outcome}

TRANSCRIPT:
${submission.transcript}

===== END OF APPOINTMENT =====

Now evaluate this appointment against the College Works methodology and return your coaching feedback as JSON per the format specified in your instructions.`;

    // Call Claude
    console.log('Calling Claude for evaluation...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: COACHING_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    const responseText = message.content[0].text;
    console.log('Claude response received, length:', responseText.length);

    // Parse the JSON response
    let feedback;
    try {
      // Strip any markdown code fences if Claude added them
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      feedback = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', parseErr);
      console.error('Response was:', responseText.slice(0, 500));
      throw new Error('Claude returned invalid JSON');
    }

    // Validate required fields
    if (!feedback.overall_score || !feedback.headline || !feedback.categories) {
      console.error('Feedback missing required fields:', Object.keys(feedback));
      throw new Error('Feedback response is incomplete');
    }

    // Save the feedback to the database
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'completed',
        feedback: feedback,
        overall_score: feedback.overall_score
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to save feedback:', updateError);
      throw new Error('Failed to save feedback to database');
    }

    console.log('Evaluation saved successfully');

    // Send the coaching email
    try {
      // Clean the email address defensively
      const cleanEmail = (submission.rep_email || '')
        .trim()
        .toLowerCase()
        .replace(/[<>]/g, '')
        .replace(/^.*?([\w.-]+@[\w.-]+\.\w+).*$/, '$1');
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(cleanEmail)) {
        console.error('Invalid email in submission:', submission.rep_email);
        throw new Error(`Invalid email format: ${submission.rep_email}`);
      }
      
      console.log('Sending coaching email to:', cleanEmail);
      
      const emailHtml = generateCoachingEmail(feedback, cleanEmail, submission.outcome);
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Coach Sean <sean@collegeworkscoach.com>',
        to: cleanEmail,
        subject: `Today's estimate breakdown - ${feedback.overall_score.toFixed(1)}/10`,
        html: emailHtml,
      });

      if (emailError) {
        console.error('Email send error:', emailError);
      } else {
        console.log('Email sent successfully, ID:', emailData?.id);
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      // Don't throw. Feedback is already saved, email failure shouldn't block success.
    }

    return Response.json({ 
      success: true, 
      feedback: feedback,
      submissionId: submissionId 
    });

  } catch (err) {
    console.error('Evaluate route error:', err);
    
    // Try to update submission status to error
    try {
      const { submissionId } = await request.json().catch(() => ({}));
      if (submissionId) {
        await supabase
          .from('submissions')
          .update({ status: `error: ${err.message?.slice(0, 100) || 'evaluation failed'}` })
          .eq('id', submissionId);
      }
    } catch (e) {
      // Silent fail on error logging
    }
    
    return Response.json({ 
      error: err.message || 'Evaluation failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 120;
