import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

    // Download the audio file from Supabase Storage
    const audioResponse = await fetch(submission.audio_url);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    
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

    // Create the file with proper extension and type
    const mimeTypeMap = {
      'm4a': 'audio/mp4',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'mp4': 'audio/mp4',
      'ogg': 'audio/ogg',
      'oga': 'audio/ogg',
      'flac': 'audio/flac',
      'mpga': 'audio/mpeg',
      'mpeg': 'audio/mpeg'
    };
    
    const properMimeType = mimeTypeMap[fileExtension] || 'audio/mpeg';
    const audioFile = new File(
      [audioBlob], 
      `recording.${fileExtension}`, 
      { type: properMimeType }
    );

    console.log('Sending to Whisper as:', audioFile.name, audioFile.type);

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

export const maxDuration = 60;
