export function generateCoachingEmail(feedback, repEmail, outcome) {
  const score = feedback.overall_score;
  const scoreColor = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444';
  
  const categoryRows = feedback.categories.map(cat => {
    const catColor = cat.score >= 8 ? '#10b981' : cat.score >= 6 ? '#f59e0b' : '#ef4444';
    return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <strong style="color: #111827;">${cat.name}</strong>
          <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${cat.note}</div>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; vertical-align: top;">
          <span style="color: ${catColor}; font-weight: 700; font-size: 18px;">${cat.score}</span>
          <span style="color: #9ca3af; font-size: 13px;">/10</span>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px 30px;">
    
    <div style="margin-bottom: 32px;">
      <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Coach</div>
      <div style="font-size: 22px; font-weight: 700; color: #111827;">Today's estimate breakdown</div>
      <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Outcome: ${outcome}</div>
    </div>

    <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <div style="font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 8px;">Your Score</div>
      <div style="font-size: 56px; font-weight: 800; color: ${scoreColor}; line-height: 1;">${score.toFixed(1)}<span style="font-size: 24px; color: #d1d5db;"> / 10</span></div>
      <div style="font-size: 16px; color: #374151; margin-top: 12px; line-height: 1.4;">${feedback.headline}</div>
    </div>

    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
      <div style="font-size: 12px; color: #065f46; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px;">What Worked</div>
      <div style="font-size: 15px; color: #111827; line-height: 1.5;">${feedback.what_worked}</div>
    </div>

    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
      <div style="font-size: 12px; color: #9a3412; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px;">One Thing — ${feedback.one_thing.category}</div>
      <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; margin-top: 8px;">The issue</div>
      <div style="font-size: 15px; color: #111827; line-height: 1.5;">${feedback.one_thing.issue}</div>
      <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; margin-top: 12px;">The fix</div>
      <div style="font-size: 15px; color: #111827; line-height: 1.5;">${feedback.one_thing.fix}</div>
    </div>

    <div style="margin-bottom: 24px;">
      <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 12px;">Category Breakdown</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${categoryRows}
      </table>
    </div>

    <div style="background: #111827; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 16px; font-style: italic; line-height: 1.5;">"${feedback.closing_message}"</div>
      <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 12px;">— Coach</div>
    </div>

    <div style="text-align: center; font-size: 12px; color: #9ca3af; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Keep going. Tomorrow you're better than today.
    </div>

  </div>
</body>
</html>
  `;
}
