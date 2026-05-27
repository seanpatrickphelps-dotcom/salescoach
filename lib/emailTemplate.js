export function generateCoachingEmail(feedback, repEmail, outcome) {
  const score = feedback.overall_score;
  const scoreColor = score >= 8 ? '#00C65E' : score >= 6 ? '#FF8200' : '#CA3A57';
  
  const categoryRows = feedback.categories.map(cat => {
    const catColor = cat.score >= 8 ? '#00C65E' : cat.score >= 6 ? '#FF8200' : '#CA3A57';
    return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #DBE2E9; vertical-align: top;">
          <div style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 700; color: #000000; margin-bottom: 4px;">${cat.name}</div>
          <div style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #4b5563; line-height: 1.5;">${cat.note}</div>
        </td>
        <td style="padding: 16px 0 16px 20px; border-bottom: 1px solid #DBE2E9; text-align: right; vertical-align: top; white-space: nowrap;">
          <span style="font-family: 'Inter', Arial, sans-serif; color: ${catColor}; font-weight: 800; font-size: 22px;">${cat.score}</span><span style="font-family: 'Inter', Arial, sans-serif; color: #9ca3af; font-size: 13px; font-weight: 600;">/10</span>
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today's coaching session</title>
</head>
<body style="margin: 0; padding: 0; background: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 16px 20px 16px;">
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">
          
          <!-- Logo Centered -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://collegeworkscoach.com/cwp-logo.png" alt="College Works" width="72" height="72" style="display: block; width: 72px; height: 72px;" />
            </td>
          </tr>

          <!-- Blue Hero Block with Headline -->
          <tr>
            <td style="background: #004DE1; padding: 48px 36px;">
              <div style="font-family: 'Inter', Arial, sans-serif; color: rgba(255,255,255,0.75); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-bottom: 16px;">Today's Estimate</div>
              <h1 style="margin: 0; color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 32px; font-weight: 800; line-height: 1.1; letter-spacing: -1px;">${feedback.headline}</h1>
              <div style="margin-top: 20px; font-family: 'Inter', Arial, sans-serif; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;">Outcome: ${outcome}</div>
            </td>
          </tr>

          <!-- Score Section -->
          <tr>
            <td align="center" style="padding: 48px 8px 0 8px;">
              <div style="font-family: 'Inter', Arial, sans-serif; color: #9ca3af; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 12px;">Your Score</div>
              <div style="line-height: 1;">
                <span style="font-family: 'Inter', Arial, sans-serif; color: ${scoreColor}; font-size: 72px; font-weight: 800; letter-spacing: -3px;">${score.toFixed(1)}</span><span style="font-family: 'Inter', Arial, sans-serif; color: #9ca3af; font-size: 28px; font-weight: 700;"> / 10</span>
              </div>
            </td>
          </tr>

          <!-- Hairline Divider -->
          <tr>
            <td style="padding: 48px 8px 0 8px;">
              <div style="height: 1px; background: #DBE2E9; width: 100%;"></div>
            </td>
          </tr>

          <!-- What Worked -->
          <tr>
            <td style="padding: 40px 8px 0 8px;">
              <h2 style="margin: 0 0 16px 0; font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">What worked.</h2>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: #1f2937; line-height: 1.65;">
                ${feedback.what_worked}
              </p>
            </td>
          </tr>

          <!-- Hairline Divider -->
          <tr>
            <td style="padding: 40px 8px 0 8px;">
              <div style="height: 1px; background: #DBE2E9; width: 100%;"></div>
            </td>
          </tr>

          <!-- Your Focus -->
          <tr>
            <td style="padding: 40px 8px 0 8px;">
              <h2 style="margin: 0 0 8px 0; font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">Your focus.</h2>
              <div style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #FF8200; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">${feedback.one_thing.category}</div>
              
              <div style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #9ca3af; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">The issue</div>
              <p style="margin: 0 0 24px 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: #1f2937; line-height: 1.65;">
                ${feedback.one_thing.issue}
              </p>
              
              <div style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #9ca3af; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">The fix</div>
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: #1f2937; line-height: 1.65;">
                ${feedback.one_thing.fix}
              </p>
            </td>
          </tr>

          <!-- Hairline Divider -->
          <tr>
            <td style="padding: 40px 8px 0 8px;">
              <div style="height: 1px; background: #DBE2E9; width: 100%;"></div>
            </td>
          </tr>

          <!-- How You Scored -->
          <tr>
            <td style="padding: 40px 8px 0 8px;">
              <h2 style="margin: 0 0 24px 0; font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">How you scored.</h2>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${categoryRows}
              </table>
            </td>
          </tr>

          <!-- Closing Message -->
          <tr>
            <td style="padding: 48px 8px 0 8px;">
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 18px; color: #000000; line-height: 1.5; font-weight: 600;">
                ${feedback.closing_message}
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 32px 8px 0 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #004DE1; padding: 16px 32px;">
                    <a href="https://collegeworkscoach.com" style="font-family: 'Inter', Arial, sans-serif; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 0.3px;">Submit your next estimate</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hairline Divider -->
          <tr>
            <td style="padding: 56px 8px 0 8px;">
              <div style="height: 1px; background: #DBE2E9; width: 100%;"></div>
            </td>
          </tr>

          <!-- Signature Block -->
          <tr>
            <td style="padding: 32px 8px 0 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="76" style="vertical-align: top;">
                    <img src="https://collegeworkscoach.com/cwp-logo.png" alt="College Works" width="60" height="60" style="display: block; width: 60px; height: 60px;" />
                  </td>
                  <td style="vertical-align: top; padding-left: 4px;">
                    <div style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 800; color: #000000; margin-bottom: 2px;">Sean Phelps</div>
                    <div style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #4b5563; margin-bottom: 6px;">President, College Works</div>
                    <a href="mailto:sean@collegeworkscoach.com" style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #004DE1; text-decoration: none;">sean@collegeworkscoach.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Anchor Line -->
          <tr>
            <td align="center" style="padding: 56px 8px 0 8px;">
              <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #1f2937; font-weight: 600; line-height: 1.5;">
                Challenging? Yes. Worth it?<br>
                <span style="color: #FF8200; font-weight: 800;">Ask any of our 10,000+ alumni.</span>
              </p>
            </td>
          </tr>

          <!-- Success is in session footer -->
          <tr>
            <td align="center" style="padding: 32px 8px 8px 8px;">
              <div style="font-family: 'Inter', Arial, sans-serif; color: #9ca3af; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800;">Success is in session.</div>
            </td>
          </tr>

          <!-- Fine print -->
          <tr>
            <td align="center" style="padding: 32px 8px 16px 8px;">
              <div style="font-family: 'Inter', Arial, sans-serif; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                College Works &nbsp;|&nbsp; 1682 Langley Ave, Irvine, CA 92614 &nbsp;|&nbsp; collegeworks.com<br>
                You're getting this because you submitted a recording at collegeworkscoach.com
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
