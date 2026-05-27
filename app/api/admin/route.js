import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { password } = await request.json();

    // Check password
    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Fetch all submissions
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Failed to fetch submissions:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Calculate metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const completed = submissions.filter(s => s.status === 'completed');
    const errored = submissions.filter(s => s.status?.startsWith('error'));
    const last7Days = submissions.filter(s => new Date(s.created_at) > sevenDaysAgo);
    const last24Hours = submissions.filter(s => new Date(s.created_at) > oneDayAgo);
    
    const avgScore = completed.length > 0
      ? (completed.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completed.length).toFixed(1)
      : null;

    const metrics = {
      total: submissions.length,
      completed: completed.length,
      errored: errored.length,
      inProgress: submissions.length - completed.length - errored.length,
      last7Days: last7Days.length,
      last24Hours: last24Hours.length,
      avgScore: avgScore
    };

    return Response.json({
      success: true,
      metrics,
      submissions
    });

  } catch (err) {
    console.error('Admin route error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export const maxDuration = 30;
