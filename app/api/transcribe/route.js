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

    // Submit the audio URL to AssemblyAI for transcription
    console.log('Submitting to AssemblyAI...');
    
    const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': process.env.ASSEMBLYAI_API_KEY,
        'content-type': 'application/json'
      },
body: JSON.stringify({
        audio_url: submission.audio_url,
        speaker_labels: true,  // Enable speaker diarization
        language_code: 'en_us',
        speech_model: 'universal-2'
      })
    });

    const submitResult = await submitResponse.json();
    
    if (!submitResponse.ok) {
      console.error('AssemblyAI submit error:', submitResult);
      throw new Error(submitResult.error || 'Failed to submit for transcription');
    }

    const transcriptId = submitResult.id;
    console.log('AssemblyAI transcript ID:', transcriptId);

    // Poll for transcription completion
    let transcript = null;
    let pollAttempts = 0;
    const maxPollAttempts = 60;  // Max ~5 minutes (60 attempts * 5 seconds)
    
    while (pollAttempts < maxPollAttempts) {
      pollAttempts++;
      
      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'authorization': process.env.ASSEMBLYAI_API_KEY
        }
      });
      
      const pollResult = await pollResponse.json();
      console.log(`Poll attempt ${pollAttempts}: status = ${pollResult.status}`);
      
      if (pollResult.status === 'completed') {
        transcript = pollResult;
        break;
      } else if (pollResult.status === 'error') {
        console.error('AssemblyAI transcription error:', pollResult.error);
        throw new Error(`Transcription failed: ${pollResult.error}`);
      }
      // Otherwise still 'queued' or 'processing', keep polling
    }

    if (!transcript) {
      throw new Error('Transcription timed out after 5 minutes');
    }

    // Format the transcript with speaker labels
    let formattedTranscript = '';
    
    if (transcript.utterances && transcript.utterances.length > 0) {
      // Use speaker-labeled transcript
      formattedTranscript = transcript.utterances
        .map(u => `Speaker ${u.speaker}: ${u.text}`)
        .join('\n\n');
    } else {
      // Fallback to plain text if no utterances
      formattedTranscript = transcript.text || '';
    }

    console.log('Transcript length:', formattedTranscript.length);
    console.log('Transcript preview:', formattedTranscript.slice(0, 300));

    // Save the transcript
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        transcript: formattedTranscript,
        status: 'transcribed'
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to save transcript:', updateError);
      throw new Error('Failed to save transcript');
    }

    console.log('Transcript saved successfully');

    // Trigger the evaluate route and wait for it
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log('Triggering evaluation at:', `${baseUrl}/api/evaluate`);
    
    try {
      const evaluateResponse = await fetch(`${baseUrl}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submissionId })
      });
      const evaluateResult = await evaluateResponse.json();
      console.log('Evaluate response status:', evaluateResponse.status);
      console.log('Evaluate result:', JSON.stringify(evaluateResult).slice(0, 200));
    } catch (evaluateErr) {
      console.error('Evaluate call failed:', evaluateErr);
    }

    return Response.json({ 
      success: true, 
      transcript: formattedTranscript.slice(0, 500),
      submissionId: submissionId 
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

export const maxDuration = 300;
