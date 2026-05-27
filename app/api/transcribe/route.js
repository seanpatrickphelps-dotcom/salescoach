import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  console.log('===== TRANSCRIBE ROUTE STARTED =====');
  console.log('ASSEMBLYAI_API_KEY exists:', !!process.env.ASSEMBLYAI_API_KEY);
  
  try {
    const { submissionId } = await request.json();
    console.log('Received submissionId:', submissionId);
    
    if (!submissionId) {
      return Response.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    // Update status to transcribing
    await supabase
      .from('submissions')
      .update({ status: 'transcribing' })
      .eq('id', submissionId);

    // Fetch the submission to get the audio URL
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error('Failed to fetch submission:', fetchError);
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    console.log('Audio URL:', submission.audio_url);

    // Build the webhook URL for AssemblyAI to call when done
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/webhook/assemblyai`;
    
    console.log('Webhook URL:', webhookUrl);
    console.log('Submitting to AssemblyAI...');
    
    const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': process.env.ASSEMBLYAI_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: submission.audio_url,
        speaker_labels: true,
        language_code: 'en_us',
        speech_models: ['universal-2'],
        webhook_url: webhookUrl
      })
    });

    const submitResult = await submitResponse.json();
    
    if (!submitResponse.ok) {
      console.error('AssemblyAI submit error:', submitResult);
      throw new Error(submitResult.error || 'Failed to submit for transcription');
    }

    const transcriptId = submitResult.id;
    console.log('AssemblyAI transcript ID:', transcriptId);

    // Save the transcript ID so the webhook can find this submission later
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        assemblyai_transcript_id: transcriptId 
      })
      .eq('id', submissionId);
    
    if (updateError) {
      console.error('Failed to save transcript ID:', updateError);
    }

    console.log('Transcript ID saved. Waiting for webhook callback...');

    // Return immediately. AssemblyAI will call our webhook when transcription is done.
    return Response.json({ 
      success: true, 
      message: 'Transcription started. Webhook will fire when complete.',
      transcriptId: transcriptId
    });

  } catch (err) {
    console.error('Transcribe route error:', err);
    
    // Try to update submission status to error
    try {
      const { submissionId } = await request.json().catch(() => ({}));
      if (submissionId) {
        await supabase
          .from('submissions')
          .update({ status: `error: ${err.message?.slice(0, 100) || 'transcription failed'}` })
          .eq('id', submissionId);
      }
    } catch (e) {
      // Silent fail on error logging
    }
    
    return Response.json({ 
      error: err.message || 'Transcription failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 30;
