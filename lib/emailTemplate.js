export function generateCoachingEmail(feedback, repEmail, outcome) {
  const score = feedback.overall_score;
  const scoreColor = score >= 8 ? '#00C65E' : score >= 6 ? '#FF8200' : '#CA3A57';
  const scoreBg = score >= 8 ? '#f0fdf4' : score >= 6 ? '#fff7ed' : '#fef2f2';
  
  const categoryRows = feedback.categories.map(cat => {
    const catColor = cat.score >= 8 ? '#00C65E' : cat.score >= 6 ? '#FF8200' : '#CA3A57';
    return `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #DBE2E9; vertical-align: top;">
          <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; font-weight: 700; color: #000000; margin-bottom: 4px;">${cat.name}</div>
          <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #6b7280; line-height: 1.5;">${cat.note}</div>
        </td>
        <td style="padding: 14px 0 14px 16px; border-bottom: 1px solid #DBE2E9; text-align: right; vertical-align: top; white-space: nowrap;">
          <span style="font-family: 'Inter', -apple-system, sans-serif; color: ${catColor}; font-weight: 800; font-size: 24px;">${cat.score}</span><span style="font-family: 'Inter', -apple-system, sans-serif; color: #9ca3af; font-size: 14px; font-weight: 600;">/10</span>
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your coaching feedback</title>
</head>
<body style="margin: 0; padding: 0; background: #f5f5f7; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: #ffffff;">
          
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background: #004DE1; padding: 12px 14px; vertical-align: middle;" width="64">
                          <div style="color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-weight: 700; line-height: 1; letter-spacing: -0.3px;">College<br>Works</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <div style="color: #9ca3af; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800;">Coach</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="color: #9ca3af; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Today's Estimate</div>
              <h1 style="margin: 0; color: #000000; font-size: 36px; font-weight: 800; line-height: 1; letter-spacing: -1.5px;">${feedback.headline}</h1>
              <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-top: 12px;">Outcome: ${outcome}</div>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${scoreBg}; border: 2px solid ${scoreColor};">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <div style="color: ${scoreColor}; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Your Score</div>
                    <div style="line-height: 1;">
                      <span style="color: ${scoreColor}; font-size: 64px; font-weight: 800; letter-spacing: -2px;">${score.toFixed(1)}</span><span style="color: #9ca3af; font-size: 28px; font-weight: 700;"> / 10</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="border: 2px solid #00C65E; padding: 20px 22px; background: #f0fdf4;">
                <div style="color: #00C65E; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 10px;">What Worked</div>
                <div style="color: #000000; font-size: 15px; line-height: 1.6; font-weight: 500;">${feedback.what_worked}</div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <div style="border: 2px solid #FF8200; padding: 20px 22px; background: #fff7ed;">
                <div style="color: #FF8200; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 14px;">One Thing &mdash; ${feedback.one_thing.category}</div>
                
                <div style="color: #9ca3af; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 6px;">The Issue</div>
                <div style="color: #000000; font-size: 15px; line-height: 1.6; font-weight: 500; margin-bottom: 16px;">${feedback.one_thing.issue}</div>
                
                <div style="color: #9ca3af; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 6px;">The Fix</div>
                <div style="color: #000000; font-size: 15px; line-height: 1.6; font-weight: 500;">${feedback.one_thing.fix}</div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="color: #004DE1; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; margin-bottom: 16px;">How You Scored</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${categoryRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #004DE1;">
                <tr>
                  <td style="padding: 32px 28px; text-align: center;">
                    <div style="color: #ffffff; font-size: 18px; font-weight: 700; line-height: 1.4; margin-bottom: 12px;">${feedback.closing_message}</div>
                    <div style="color: rgba(255,255,255,0.6); font-size: 10px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800;">Coach Sean</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <div style="color: #1f2937; font-size: 14px; font-weight: 600; line-height: 1.5; margin-bottom: 24px;">
                Challenging? Yes. Worth it?<br>
                <span style="color: #FF8200; font-weight: 800;">Ask any of our 10,000+ alumni.</span>
              </div>
              
              <div style="border-top: 1px solid #DBE2E9; padding-top: 24px; color: #9ca3af; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800;">
                Success is in session.
              </div>
            </td>
          </tr>

        </table>

        <div style="max-width: 600px; margin: 0 auto; padding: 16px; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.5;">
          You're getting this because you submitted a recording at collegeworkscoach.com<br>
          Coach Sean &middot; College Works
        </div>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
