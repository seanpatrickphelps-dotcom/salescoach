'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Compress audio to MP3 (much smaller than WAV, fits Whisper's 25MB limit)
async function compressAudio(file) {
  return new Promise(async (resolve, reject) => {
    try {
      // Dynamically import lamejs (only needed when compression is required)
      const lamejs = await import('@breezystack/lamejs');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Downsample to mono 16kHz
      const targetSampleRate = 16000;
      const offlineContext = new OfflineAudioContext(
        1, // mono
        Math.ceil(audioBuffer.duration * targetSampleRate),
        targetSampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      // Encode to MP3 at 32kbps (plenty for speech recognition)
      const channelData = renderedBuffer.getChannelData(0);
      
      // Convert Float32 to Int16 (what lamejs needs)
      const samples = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
      
      // mp3encoder: (channels, sampleRate, kbps)
      const mp3encoder = new lamejs.Mp3Encoder(1, targetSampleRate, 32);
      const mp3Data = [];
      const blockSize = 1152; // standard MP3 frame size
      
      for (let i = 0; i < samples.length; i += blockSize) {
        const sampleChunk = samples.subarray(i, i + blockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
      
      // Finalize
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      
      const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
      const compressedFile = new File([mp3Blob], 'compressed.mp3', { type: 'audio/mpeg' });
      
      resolve(compressedFile);
    } catch (err) {
      reject(err);
    }
  });
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [outcome, setOutcome] = useState('Sold on the spot');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    
    if (!email || !file) {
      setErrorMsg('We need your email and a recording to coach you.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('That email looks off. Double check the format (you@collegeworks.com).');
      return;
    }

    setStatus('uploading');
    setStatusMsg('Uploading...');

    try {
      // Sanitize filename
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const fileName = `${Date.now()}-${safeName.replace(/\.[^.]+$/, '')}.mp3`;
      
      console.log('Original file:', file.name, 'Size:', file.size);

      let uploadFile = file;
      const TWENTY_FIVE_MB = 25 * 1024 * 1024;

      // Compress audio if larger than 25MB (Whisper's hard limit)
      // Also compress if not already mp3, to ensure consistent format
      if (file.size > TWENTY_FIVE_MB) {
        console.log('File over 25MB, compressing to MP3...');
        setStatusMsg('Compressing recording...');
        
        try {
          uploadFile = await compressAudio(file);
          console.log('Compressed file size:', uploadFile.size);
          console.log('Compression ratio:', ((1 - uploadFile.size / file.size) * 100).toFixed(1) + '%');
          setStatusMsg('Uploading...');
        } catch (compressErr) {
          console.error('Compression failed:', compressErr);
          throw new Error('Recording could not be compressed. Try a shorter recording.');
        }
      }

      // Upload DIRECTLY to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, uploadFile, {
          contentType: uploadFile.type || 'audio/mpeg',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded to storage');
      setStatusMsg('Processing...');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      // Create submission record AND trigger processing
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          outcome,
          audioUrl: urlData.publicUrl,
          fileName: fileName
        })
      });

      // Read response as text first to safely handle non-JSON errors
      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Server error. Please try again or try a smaller file.');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setStatusMsg('');
      
      let userMessage = err.message || 'please try again';
      
      // Handle common errors with friendly messages
      if (userMessage.toLowerCase().includes('string did not match') || 
          userMessage.toLowerCase().includes('expected pattern')) {
        userMessage = 'Your recording is stored in the cloud. Save it to your phone first, then upload. Or record directly with Voice Memos.';
      } else if (userMessage.toLowerCase().includes('too large') ||
                 userMessage.toLowerCase().includes('entity')) {
        userMessage = 'File is too large. Try a shorter recording.';
      }
      
      setErrorMsg(userMessage);
      console.error('Full error:', err);
    }
  };

  const fontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  // SUCCESS SCREEN
  if (status === 'success') {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <main style={{ 
          minHeight: '100vh',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: fontStack
        }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
              <img src="/cwp-logo.png" alt="College Works" style={{ width: '88px', height: '88px', display: 'block' }} />
            </div>

            <div style={{
              width: '64px',
              height: '64px',
              background: '#FF8200',
              margin: '0 auto 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: '800'
            }}>✓</div>
            
            <h1 style={{ 
              color: '#000000', 
              fontSize: '44px',
              fontWeight: '800',
              marginBottom: '16px',
              letterSpacing: '-1.5px',
              lineHeight: '1'
            }}>Got it.</h1>
            
            <p style={{ color: '#1f2937', fontSize: '17px', lineHeight: '1.5', marginBottom: '8px', fontWeight: '500' }}>
              Your recording is in. Your coach is reviewing it now.
            </p>
            
            <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.5', marginBottom: '36px' }}>
              Feedback heading to <strong style={{ color: '#004DE1' }}>{email}</strong> in 2 to 10 minutes depending on recording length. Read it before your next estimate.
            </p>

            <button 
              onClick={() => {
                setStatus('idle');
                setFile(null);
                setEmail('');
                setStatusMsg('');
              }}
              style={{ 
                background: '#FF8200', color: 'white', border: 'none', 
                padding: '18px 40px', fontSize: '13px', fontWeight: '800',
                cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '2px', textTransform: 'uppercase'
              }}
            >Submit Another</button>

            <div style={{
              marginTop: '64px', fontSize: '11px', color: '#9ca3af',
              letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700'
            }}>Success is in session.</div>
          </div>
        </main>
      </>
    );
  }

  // MAIN UPLOAD SCREEN
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <main style={{ minHeight: '100vh', background: 'white', fontFamily: fontStack }}>
        <header style={{
          padding: '24px', maxWidth: '600px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <img src="/cwp-logo.png" alt="College Works" style={{ width: '64px', height: '64px', display: 'block' }} />
          <div style={{
            color: '#9ca3af', fontSize: '11px', letterSpacing: '3px',
            textTransform: 'uppercase', fontWeight: '800'
          }}>Coach</div>
        </header>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px 32px' }}>
          <h1 style={{
            color: '#000000', fontSize: '52px', fontWeight: '800',
            lineHeight: '0.95', marginBottom: '20px', letterSpacing: '-2px'
          }}>
            Drop your estimate.<br />
            <span style={{ color: '#004DE1' }}>Get coached.</span>
          </h1>
          
          <p style={{
            color: '#4b5563', fontSize: '17px', lineHeight: '1.5',
            fontWeight: '400', maxWidth: '480px'
          }}>
            Upload your in-home recording. Your coach reviews it against the Needs Satisfaction Selling Cycle and sends specific, actionable feedback.
          </p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{ background: 'white', border: '2px solid #000000', padding: '36px 28px' }}>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#004DE1', marginBottom: '10px',
                textTransform: 'uppercase', letterSpacing: '2px'
              }}>Your Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@collegeworks.com"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                inputMode="email"
                spellCheck="false"
                style={{ 
                  width: '100%', padding: '16px 18px', border: '2px solid #DBE2E9', 
                  fontSize: '16px', fontFamily: 'inherit', fontWeight: '500',
                  color: '#000000', background: 'white', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#004DE1'}
                onBlur={(e) => e.target.style.borderColor = '#DBE2E9'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#004DE1', marginBottom: '10px',
                textTransform: 'uppercase', letterSpacing: '2px'
              }}>Your Recording</label>
              <div style={{
                position: 'relative',
                border: `2px solid ${file ? '#00C65E' : '#DBE2E9'}`,
                padding: '28px 16px', textAlign: 'center',
                background: file ? '#f0fdf4' : 'white', transition: 'all 0.15s'
              }}>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ 
                    position: 'absolute', inset: 0, opacity: 0,
                    cursor: 'pointer', width: '100%', height: '100%'
                  }}
                />
                {file ? (
                  <div>
                    <div style={{ 
                      fontSize: '11px', color: '#00C65E', fontWeight: '800',
                      marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px'
                    }}>✓ Ready</div>
                    <div style={{ 
                      fontSize: '15px', color: '#000000', fontWeight: '600',
                      wordBreak: 'break-all', lineHeight: '1.4'
                    }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', fontWeight: '500' }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB · Tap to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '16px', color: '#000000', fontWeight: '700', marginBottom: '6px' }}>
                      Tap to choose your file
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                      Voice memo, MP3, M4A, or video
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', fontSize: '11px', fontWeight: '800',
                color: '#004DE1', marginBottom: '10px',
                textTransform: 'uppercase', letterSpacing: '2px'
              }}>How did it end?</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                style={{ 
                  width: '100%', padding: '16px 18px', border: '2px solid #DBE2E9', 
                  fontSize: '16px', fontFamily: 'inherit', fontWeight: '500',
                  color: '#000000', background: 'white', outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath fill=\'%23004DE1\' d=\'M6 8L0 0h12z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 18px center',
                  paddingRight: '44px', boxSizing: 'border-box', cursor: 'pointer'
                }}
              >
                <option>Sold on the spot</option>
                <option>Sold pending financing</option>
                <option>Callback / think about it</option>
                <option>Lost: price</option>
                <option>Lost: timing</option>
                <option>Lost: competitor</option>
                <option>Lost: other</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={status === 'uploading'}
              style={{ 
                width: '100%', padding: '20px', 
                background: status === 'uploading' ? '#9ca3af' : '#FF8200', 
                color: 'white', border: 'none', fontSize: '14px', fontWeight: '800',
                cursor: status === 'uploading' ? 'wait' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '2px',
                textTransform: 'uppercase', transition: 'transform 0.1s'
              }}
            >
              {status === 'uploading' ? (statusMsg || 'Uploading...') : 'Submit for Coaching'}
            </button>

            {errorMsg && (
              <div style={{ 
                marginTop: '20px', padding: '14px 16px',
                background: '#fef2f2', border: '2px solid #CA3A57',
                color: '#991b1b', fontSize: '14px', lineHeight: '1.4', fontWeight: '500'
              }}>{errorMsg}</div>
            )}

            {status === 'uploading' && statusMsg === 'Compressing recording...' && (
              <div style={{ 
                marginTop: '20px', padding: '14px 16px',
                background: '#eff6ff', border: '2px solid #004DE1',
                color: '#004DE1', fontSize: '14px', lineHeight: '1.4', fontWeight: '600'
              }}>
                Large recording detected. Compressing for transcription. This takes about 30-60 seconds depending on length.
              </div>
            )}
          </div>

          <div style={{
            textAlign: 'center', color: '#1f2937', fontSize: '15px',
            marginTop: '36px', lineHeight: '1.5', fontWeight: '600',
            maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto'
          }}>
            Challenging? Yes. Worth it?<br />
            <span style={{ color: '#FF8200', fontWeight: '800' }}>Ask any of our 10,000+ alumni.</span>
          </div>

          <div style={{
            textAlign: 'center', color: '#9ca3af', fontSize: '11px',
            marginTop: '48px', letterSpacing: '3px', textTransform: 'uppercase',
            fontWeight: '700', paddingBottom: '32px'
          }}>Success is in session.</div>
        </div>
      </main>
    </>
  );
}
