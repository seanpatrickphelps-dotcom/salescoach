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
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], 'recording.mp3', { type: audioBlob.type });

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
    return Response.json({ 
      error: err.message || 'Transcription failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 60;
