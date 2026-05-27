import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  console.log('===== ASSEMBLYAI WEBHOOK RECEIVED =====');
  
  try {
    // Get the transcript ID from the webhook payload
    const payload = await request.json();
    console.log('Webhook payload:', JSON.stringify(payload).slice(0, 300));
    
    const transcriptId = payload.transcript_id;
    const status = payload.status;
    
    if (!transcriptId) {
      console.error('No transcript_id in webhook payload');
      return Response.json({ error: 'Missing transcript_id' }, { status: 400 });
    }
    
    console.log('Transcript ID:', transcriptId, 'Status:', status);
    
    // Find the submission with this transcript ID
    const { data: submissions, error: findError } = await supabase
      .from('submissions')
      .select('*')
      .eq('assemblyai_transcript_id', transcriptId)
      .limit(1);
    
    if (findError || !submissions || submissions.length === 0) {
      console.error('Could not find submission for transcript:', transcriptId);
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    const submission = submissions[0];
    console.log('Found submission:', submission.id);
    
    // Handle error status
    if (status === 'error') {
      console.error('AssemblyAI reported error');
      await supabase
        .from('submissions')
        .update({ status: 'error: transcription failed' })
        .eq('id', submission.id);
      return Response.json({ success: true });
    }
    
    // Fetch the full transcript from AssemblyAI
    console.log('Fetching transcript from AssemblyAI...');
    const transcriptResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'authorization': process.env.ASSEMBLYAI_API_KEY
      }
    });
    
    const transcriptData = await transcriptResponse.json();
    
    if (transcriptData.status !== 'completed') {
      console.error('Transcript status is not completed:', transcriptData.status);
      return Response.json({ error: 'Transcript not ready' }, { status: 400 });
    }
    
    // Format the transcript with speaker labels
    let formattedTranscript = '';
    
    if (transcriptData.utterances && transcriptData.utterances.length > 0) {
      formattedTranscript = transcriptData.utterances
        .map(u => `Speaker ${u.speaker}: ${u.text}`)
        .join('\n\n');
    } else {
      formattedTranscript = transcriptData.text || '';
    }
    
    console.log('Transcript length:', formattedTranscript.length);
    
    // Save the transcript
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        transcript: formattedTranscript,
        status: 'transcribed'
      })
      .eq('id', submission.id);
    
    if (updateError) {
      console.error('Failed to save transcript:', updateError);
      throw new Error('Failed to save transcript');
    }
    
    console.log('Transcript saved successfully');
    
    // Trigger evaluation
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log('Triggering evaluation...');
    
    try {
      const evaluateResponse = await fetch(`${baseUrl}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id })
      });
      const evaluateResult = await evaluateResponse.json();
      console.log('Evaluate response status:', evaluateResponse.status);
    } catch (evaluateErr) {
      console.error('Evaluate call failed:', evaluateErr);
    }
    
    return Response.json({ success: true });
    
  } catch (err) {
    console.error('Webhook error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export const maxDuration = 60;
