import { createClient } from '@supabase/supabase-js';
import OpenAI, { toFile } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return Response.json({ error: 'No submission ID provided' }, { status: 400 });
    }

    // Get the submission record
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update status to transcribing
    await supabase
      .from('submissions')
      .update({ status: 'transcribing' })
      .eq('id', submissionId);

    // Extract the file path from the audio URL
    const audioUrlObj = new URL(submission.audio_url);
    const pathParts = audioUrlObj.pathname.split('/');
    const recordingsIndex = pathParts.indexOf('recordings');
    const filePath = pathParts.slice(recordingsIndex + 1).join('/');
    
    console.log('File path for download:', filePath);

    // Download the file directly from Supabase Storage using the service role key
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('recordings')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download audio: ${downloadError?.message || 'unknown'}`);
    }

    const audioBlob = fileData;
    
    // Determine the file extension from URL
    const urlPath = submission.audio_url.split('?')[0];
    const lastDotIndex = urlPath.lastIndexOf('.');
    let fileExtension = 'mp3';
    
    if (lastDotIndex !== -1) {
      const detectedExt = urlPath.substring(lastDotIndex + 1).toLowerCase();
      const supportedExtensions = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
      if (supportedExtensions.includes(detectedExt)) {
        fileExtension = detectedExt;
      }
    }

    console.log('Audio URL:', submission.audio_url);
    console.log('Detected extension:', fileExtension);
    console.log('Blob type:', audioBlob.type);
    console.log('Blob size:', audioBlob.size);

    // Convert blob to ArrayBuffer then Buffer (Node-compatible)
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Buffer length:', buffer.length);
    console.log('Sending to Whisper as: recording.' + fileExtension);

    // Use OpenAI's toFile helper which properly formats for the API
    const audioFile = await toFile(buffer, `recording.${fileExtension}`);

    // Send to Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    // Save transcript to database
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        transcript: transcription.text,
        status: 'transcribed'
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    // Trigger evaluation and wait for it to complete
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log('Triggering evaluation at:', `${baseUrl}/api/evaluate`);
    
    try {
      const evalResponse = await fetch(`${baseUrl}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      });
      const evalResult = await evalResponse.json();
      console.log('Evaluation response status:', evalResponse.status);
      console.log('Evaluation result:', JSON.stringify(evalResult).slice(0, 200));
    } catch (evalErr) {
      console.error('Evaluate call failed:', evalErr);
    }

    return Response.json({ 
      success: true, 
      transcript: transcription.text 
    });

  } catch (err) {
    console.error('Transcription error:', err);
    
    // Update status to error so we can see it failed
    if (request) {
      try {
        const body = await request.clone().json();
        if (body.submissionId) {
          await supabase
            .from('submissions')
            .update({ status: 'error: ' + (err.message || 'unknown').slice(0, 200) })
            .eq('id', body.submissionId);
        }
      } catch (e) {
        // ignore
      }
    }
    
    return Response.json({ 
      error: err.message || 'Transcription failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 120;
