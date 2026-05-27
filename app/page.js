'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [outcome, setOutcome] = useState('Sold on the spot');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    
    if (!email || !file) {
      setErrorMsg('We need your email and a recording to coach you.');
      return;
    }

    setStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);
      formData.append('outcome', outcome);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(`Something went wrong: ${err.message || 'please try again'}`);
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
          background: '#004DE1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: fontStack
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'white',
            padding: '56px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: '#FF8200',
              margin: '0 auto 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: 'white',
              fontWeight: '800'
            }}>✓</div>
            
            <h1 style={{ 
              color: '#000000', 
              fontSize: '40px',
              fontWeight: '800',
              marginBottom: '16px',
              letterSpacing: '-1px',
              lineHeight: '1'
            }}>
              Got it.
            </h1>
            
            <p style={{
              color: '#1f2937',
              fontSize: '17px',
              lineHeight: '1.5',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Your recording is in. Your coach is reviewing it now.
            </p>
            
            <p style={{
              color: '#6b7280',
              fontSize: '15px',
              lineHeight: '1.5',
              marginBottom: '36px'
            }}>
              Feedback heading to <strong style={{ color: '#004DE1' }}>{email}</strong> in about 10 minutes. Read it before your next estimate.
            </p>

            <button 
              onClick={() => {
                setStatus('idle');
                setFile(null);
                setEmail('');
              }}
              style={{ 
                background: '#FF8200', 
                color: 'white', 
                border: 'none', 
                padding: '16px 36px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.3px',
                textTransform: 'uppercase'
              }}
            >
              Submit Another
            </button>

            <div style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '2px solid #DBE2E9',
              fontSize: '11px',
              color: '#9ca3af',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: '700'
            }}>
              Success is in session.
            </div>
          </div>
        </main>
      </>
    );
  }

  // MAIN UPLOAD SCREEN
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <main style={{ 
        minHeight: '100vh',
        background: '#004DE1',
        fontFamily: fontStack
      }}>
        {/* Header Bar */}
        <header style={{
          padding: '24px 24px 0',
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.5px'
          }}>
            College Works
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: '700'
          }}>
            Coach
          </div>
        </header>

        {/* Hero Section */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '48px 24px 32px'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '44px',
            fontWeight: '800',
            lineHeight: '1',
            marginBottom: '20px',
            letterSpacing: '-1.5px'
          }}>
            Drop your estimate.<br />
            <span style={{ color: '#FF8200' }}>Get coached.</span>
          </h1>
          
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '17px',
            lineHeight: '1.5',
            fontWeight: '400',
            maxWidth: '440px'
          }}>
            Upload your in-home recording. Your coach reviews it against the Needs Satisfaction Selling Cycle and sends specific, actionable feedback.
          </p>
        </div>

        {/* Upload Card */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 24px 32px'
        }}>
          <div style={{
            background: 'white',
            padding: '36px 28px'
          }}>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                fontWeight: '800',
                color: '#004DE1',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Your Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@collegeworks.com"
                style={{ 
                  width: '100%', 
                  padding: '16px 18px', 
                  border: '2px solid #000000', 
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  color: '#000000',
                  background: 'white',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#004DE1'}
                onBlur={(e) => e.target.style.borderColor = '#000000'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                fontWeight: '800',
                color: '#004DE1',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Your Recording
              </label>
              <div style={{
                position: 'relative',
                border: `2px solid ${file ? '#00C65E' : '#000000'}`,
                padding: '28px 16px',
                textAlign: 'center',
                background: file ? '#f0fdf4' : 'white',
                transition: 'all 0.15s'
              }}>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ 
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}
                />
                {file ? (
                  <div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#00C65E',
                      fontWeight: '800',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}>
                      ✓ Ready
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#000000',
                      fontWeight: '600',
                      wordBreak: 'break-all',
                      lineHeight: '1.4'
                    }}>
                      {file.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '6px',
                      fontWeight: '500'
                    }}>
                      Tap to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      color: '#000000',
                      fontWeight: '700',
                      marginBottom: '6px'
                    }}>
                      Tap to choose your file
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      Voice memo, MP3, M4A, or video
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                fontWeight: '800',
                color: '#004DE1',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                How did it end?
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '16px 18px', 
                  border: '2px solid #000000', 
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  color: '#000000',
                  background: 'white',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath fill=\'%23004DE1\' d=\'M6 8L0 0h12z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 18px center',
                  paddingRight: '44px',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
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
                width: '100%', 
                padding: '20px', 
                background: status === 'uploading' ? '#9ca3af' : '#FF8200', 
                color: 'white', 
                border: 'none', 
                fontSize: '15px',
                fontWeight: '800',
                cursor: status === 'uploading' ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => {
                if (status !== 'uploading') e.target.style.transform = 'translateY(2px)';
              }}
              onMouseUp={(e) => e.target.style.transform = 'translateY(0)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {status === 'uploading' ? 'Uploading...' : 'Submit for Coaching'}
            </button>

            {errorMsg && (
              <div style={{ 
                marginTop: '20px', 
                padding: '14px 16px',
                background: '#fef2f2',
                border: '2px solid #CA3A57',
                color: '#991b1b', 
                fontSize: '14px',
                lineHeight: '1.4',
                fontWeight: '500'
              }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Trust Line */}
          <div style={{
            textAlign: 'center',
            color: 'white',
            fontSize: '15px',
            marginTop: '32px',
            lineHeight: '1.5',
            fontWeight: '600',
            maxWidth: '420px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Challenging? Yes. Worth it?<br />
            <span style={{ color: '#FF8200', fontWeight: '700' }}>Ask any of our 10,000+ alumni.</span>
          </div>

          {/* Footer Tagline */}
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            marginTop: '48px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: '700',
            paddingBottom: '32px'
          }}>
            Success is in session.
          </div>
        </div>
      </main>
    </>
  );
}
