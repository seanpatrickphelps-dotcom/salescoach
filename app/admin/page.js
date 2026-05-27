'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filter, setFilter] = useState('all');

  const fontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      setData(result);
      setAuthenticated(true);
      sessionStorage.setItem('cwp_admin_pw', password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-login if password is in session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('cwp_admin_pw');
    if (saved) {
      setPassword(saved);
      // Auto-login
      fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: saved })
      })
        .then(r => r.json())
        .then(result => {
          if (result.success) {
            setData(result);
            setAuthenticated(true);
          } else {
            sessionStorage.removeItem('cwp_admin_pw');
          }
        });
    }
  }, []);

  // Refresh data
  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('cwp_admin_pw');
    setAuthenticated(false);
    setPassword('');
    setData(null);
  };

  // LOGIN SCREEN
  if (!authenticated) {
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
            maxWidth: '400px',
            width: '100%',
            background: 'white',
            padding: '40px 32px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <img src="/cwp-logo.png" alt="College Works" style={{ width: '72px', height: '72px' }} />
            </div>

            <h1 style={{
              color: '#000000',
              fontSize: '32px',
              fontWeight: '800',
              marginBottom: '8px',
              letterSpacing: '-1px'
            }}>Admin Access.</h1>

            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '32px'
            }}>Enter the admin password to continue.</p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '16px 18px',
                border: '2px solid #DBE2E9',
                fontSize: '16px',
                fontFamily: 'inherit',
                fontWeight: '500',
                color: '#000000',
                background: 'white',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px'
              }}
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#9ca3af' : '#FF8200',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '800',
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            >
              {loading ? 'Checking...' : 'Sign In'}
            </button>

            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fef2f2',
                border: '2px solid #CA3A57',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '500'
              }}>{error}</div>
            )}
          </div>
        </main>
      </>
    );
  }

  // DETAIL VIEW (when a submission is clicked)
  if (selectedSubmission) {
    const s = selectedSubmission;
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <main style={{
          minHeight: '100vh',
          background: '#f5f5f7',
          padding: '24px',
          fontFamily: fontStack
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <button
              onClick={() => setSelectedSubmission(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#004DE1',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '24px',
                fontFamily: 'inherit',
                padding: 0
              }}
            >← Back to submissions</button>

            <div style={{ background: 'white', padding: '32px', marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                fontWeight: '800',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>Submission Details</div>
              
              <h1 style={{
                color: '#000000',
                fontSize: '28px',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '20px',
                letterSpacing: '-0.5px'
              }}>{s.feedback?.headline || 'No headline yet'}</h1>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '14px' }}>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Rep</div>
                  <div style={{ color: '#000', fontWeight: '600' }}>{s.rep_email}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Score</div>
                  <div style={{ color: '#004DE1', fontWeight: '800', fontSize: '18px' }}>{s.overall_score ? `${s.overall_score.toFixed(1)} / 10` : '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Outcome</div>
                  <div style={{ color: '#000', fontWeight: '600' }}>{s.outcome}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Status</div>
                  <div style={{ color: s.status === 'completed' ? '#00C65E' : s.status?.startsWith('error') ? '#CA3A57' : '#FF8200', fontWeight: '700' }}>{s.status}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Submitted</div>
                  <div style={{ color: '#000', fontWeight: '600' }}>{new Date(s.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Audio</div>
                  <a href={s.audio_url} target="_blank" rel="noopener" style={{ color: '#004DE1', fontWeight: '700', textDecoration: 'underline' }}>Listen →</a>
                </div>
              </div>
            </div>

            {s.feedback && (
              <>
                <div style={{ background: 'white', padding: '32px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#00C65E', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>What Worked</div>
                  <div style={{ color: '#1f2937', fontSize: '15px', lineHeight: '1.6' }}>{s.feedback.what_worked}</div>
                </div>

                {s.feedback.one_thing && (
                  <div style={{ background: 'white', padding: '32px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: '#FF8200', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Focus: {s.feedback.one_thing.category}</div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '16px', marginBottom: '6px' }}>The Issue</div>
                    <div style={{ color: '#1f2937', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>{s.feedback.one_thing.issue}</div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>The Fix</div>
                    <div style={{ color: '#1f2937', fontSize: '15px', lineHeight: '1.6' }}>{s.feedback.one_thing.fix}</div>
                  </div>
                )}

                {s.feedback.categories && (
                  <div style={{ background: 'white', padding: '32px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: '#004DE1', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Category Scores</div>
                    {s.feedback.categories.map((cat, i) => {
                      const catColor = cat.score >= 8 ? '#00C65E' : cat.score >= 6 ? '#FF8200' : '#CA3A57';
                      return (
                        <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #DBE2E9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', color: '#000', fontSize: '14px', marginBottom: '4px' }}>{cat.name}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>{cat.note}</div>
                          </div>
                          <div style={{ color: catColor, fontWeight: '800', fontSize: '20px', whiteSpace: 'nowrap' }}>{cat.score}<span style={{ fontSize: '12px', color: '#9ca3af' }}>/10</span></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {s.transcript && (
              <div style={{ background: 'white', padding: '32px' }}>
                <div style={{ fontSize: '11px', color: '#004DE1', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Transcript</div>
                <div style={{ color: '#1f2937', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }}>{s.transcript}</div>
              </div>
            )}

          </div>
        </main>
      </>
    );
  }

  // MAIN DASHBOARD VIEW
  const filteredSubmissions = data?.submissions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'errors') return s.status?.startsWith('error');
    if (filter === 'in_progress') return s.status !== 'completed' && !s.status?.startsWith('error');
    return true;
  }) || [];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <main style={{
        minHeight: '100vh',
        background: '#f5f5f7',
        fontFamily: fontStack
      }}>
        <header style={{
          background: 'white',
          padding: '20px 24px',
          borderBottom: '1px solid #DBE2E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/cwp-logo.png" alt="College Works" style={{ width: '40px', height: '40px' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#000', letterSpacing: '-0.3px' }}>Coach Dashboard</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>Admin View</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={refresh} disabled={loading} style={{ background: 'white', border: '2px solid #004DE1', color: '#004DE1', padding: '10px 18px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={logout} style={{ background: 'white', border: '2px solid #DBE2E9', color: '#6b7280', padding: '10px 18px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Logout
            </button>
          </div>
        </header>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <MetricCard label="Total Submissions" value={data?.metrics.total || 0} color="#004DE1" />
            <MetricCard label="Avg Score" value={data?.metrics.avgScore || '-'} suffix={data?.metrics.avgScore ? '/10' : ''} color="#FF8200" />
            <MetricCard label="Last 24 Hours" value={data?.metrics.last24Hours || 0} color="#00C65E" />
            <MetricCard label="Last 7 Days" value={data?.metrics.last7Days || 0} color="#004DE1" />
            <MetricCard label="Completed" value={data?.metrics.completed || 0} color="#00C65E" />
            <MetricCard label="In Progress" value={data?.metrics.inProgress || 0} color="#FF8200" />
            <MetricCard label="Errors" value={data?.metrics.errored || 0} color="#CA3A57" />
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['all', 'completed', 'in_progress', 'errors'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? '#004DE1' : 'white',
                  color: filter === f ? 'white' : '#004DE1',
                  border: '2px solid #004DE1',
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase'
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Submissions Table */}
          <div style={{ background: 'white', overflow: 'hidden' }}>
            {filteredSubmissions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>No submissions match this filter.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#004DE1' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Rep</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Outcome</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Score</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'white', fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((s, i) => {
                    const scoreColor = s.overall_score >= 8 ? '#00C65E' : s.overall_score >= 6 ? '#FF8200' : s.overall_score ? '#CA3A57' : '#9ca3af';
                    const statusColor = s.status === 'completed' ? '#00C65E' : s.status?.startsWith('error') ? '#CA3A57' : '#FF8200';
                    return (
                      <tr 
                        key={s.id}
                        onClick={() => setSelectedSubmission(s)}
                        style={{
                          background: i % 2 === 0 ? 'white' : '#fafbfc',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafbfc'}
                      >
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#000', fontWeight: '500' }}>{s.rep_email}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563' }}>{s.outcome}</td>
                        <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: '800', color: scoreColor }}>{s.overall_score ? s.overall_score.toFixed(1) : '-'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: statusColor }}>{s.status}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>
    </>
  );
}

function MetricCard({ label, value, color, suffix }) {
  return (
    <div style={{ background: 'white', padding: '20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: '800', color: color, lineHeight: '1', letterSpacing: '-1px' }}>{value}{suffix && <span style={{ fontSize: '16px', color: '#9ca3af', fontWeight: '600' }}>{suffix}</span>}</div>
    </div>
  );
}
