import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email');
    const outcome = formData.get('outcome');

    if (!file || !email) {
      return Response.json({ error: 'Missing file or email' }, { status: 400 });
    }

    console.log('Upload received from:', email);
    console.log('File name:', file.name);
    console.log('File size:', file.size);

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${safeName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(fileName, buffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    console.log('File uploaded to storage:', fileName);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName);

    // Create submission record
    const { data: insertData, error: insertError } = await supabase
      .from('submissions')
      .insert({
        rep_email: email,
        audio_url: urlData.publicUrl,
        outcome: outcome,
        status: 'uploaded'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    console.log('Submission record created:', insertData.id);

    // Trigger transcription and wait for it
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
    console.error('Upload route error:', err);
    return Response.json({ 
      error: err.message || 'Upload failed' 
    }, { status: 500 });
  }
}

export const maxDuration = 120;
