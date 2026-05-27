'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [outcome, setOutcome] = useState('Sold on the spot');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    
    if (!email || !file) {
      setErrorMsg('Need an email and a file.');
      return;
    }

    setStatus('uploading');

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          rep_email: email,
          audio_url: urlData.publicUrl,
          outcome: outcome,
          status: 'uploaded'
        });

      if (insertError) throw insertError;

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <main style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ color: '#f97316' }}>Got it.</h1>
        <p>Your recording is uploaded. Coaching feedback coming to {email} in about 10 minutes.</p>
        <button 
          onClick={() => {
            setStatus('idle');
            setFile(null);
            setEmail('');
          }}
          style={{ marginTop: '20px', padding: '12px 24px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Submit Another
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Sales Coach</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Upload your in-home estimate recording for AI coaching feedback.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
          Your Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sean@example.com"
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
          Recording File
        </label>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
          Outcome
        </label>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
        >
          <option>Sold on the spot</option>
          <option>Sold pending financing</option>
          <option>Callback / think about it</option>
          <option>Lost — price</option>
          <option>Lost — timing</option>
          <option>Lost — competitor</option>
          <option>Lost — other</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={status === 'uploading'}
        style={{ 
          width: '100%', 
          padding: '16px', 
          background: status === 'uploading' ? '#999' : '#f97316', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          fontSize: '16px', 
          fontWeight: '600', 
          cursor: status === 'uploading' ? 'wait' : 'pointer' 
        }}
      >
        {status === 'uploading' ? 'Uploading...' : 'Submit for Coaching'}
      </button>

      {errorMsg && (
        <p style={{ marginTop: '16px', color: '#dc2626', fontSize: '14px' }}>{errorMsg}</p>
      )}
    </main>
  );
}
