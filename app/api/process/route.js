import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, outcome, audioUrl, fileName } = await request.json();

    if (!email || !audioUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Processing submission for:', email);
    console.log('Audio URL:', audioUrl);

    // Create submission record
    const { data: insertData, error: insertError } = await supabase
      .from('submissions')
      .insert({
        rep_email: email,
        audio_url: audioUrl,
        outcome: outcome,
        status: 'uploaded'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    console.log('Submission created:', insertData.id);

    // Trigger transcription and wait
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log('Triggering transcription at:', `${baseUrl}/api/transcribe`);
    
    try {
      const transcribeResponse = await fetch(`${baseUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: insertData.id })
      });
      const transcribeResult = await transcribeResponse.json();
      console.log('Transcribe response status:', transcribeResponse.status);
      console.log('Transcribe result:', JSON.stringify(transcribeResult).slice(0, 200));
    } catch (transcribeErr) {
      console.error('Transcribe call failed:', transcribeErr);
    }

    return Response.json({ 
      success: true, 
      submissionId: insertData.id 
    });

  } catch (err) {
    console.error('Process route error:', err);
    return Response.json({ 
      error: err.message || 'Processing failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 120;
