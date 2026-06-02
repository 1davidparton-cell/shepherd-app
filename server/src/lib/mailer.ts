import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: { user, pass },
  });
}

export interface HomeworkEmailOptions {
  toEmail: string;
  toDiscipleName: string;
  fromName: string;
  fromEmail: string;
  title: string;
  scriptureRef: string | null;
  instructions: string;
}

export async function sendHomeworkEmail(opts: HomeworkEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const transport = createTransport();
  if (!transport) {
    return { ok: false, error: 'SMTP not configured (check SMTP_HOST, SMTP_USER, SMTP_PASS in .env)' };
  }

  const APP_URL = process.env.APP_URL || 'https://shepherd-app.vercel.app';
  const smtpUser = process.env.SMTP_USER!;
  const scripture = opts.scriptureRef ? `\n\nScripture: ${opts.scriptureRef}` : '';

  const text = `Hi ${opts.toDiscipleName},

${opts.fromName} has assigned you new homework in Shepherd.

${opts.title}${scripture}

${opts.instructions}

Submit your response at: ${APP_URL}/portal/homework`.trim();

  const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2b2f38;">
  <p style="font-size:15px;line-height:1.7;">Hi ${opts.toDiscipleName},</p>
  <p style="font-size:15px;line-height:1.7;">${opts.fromName} has assigned you new homework in Shepherd.</p>
  <div style="background:#f5f1ea;border-left:3px solid #c9a84c;padding:18px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
    <p style="font-size:16px;font-weight:600;margin:0 0 6px;color:#1a2744;">${opts.title}</p>
    ${opts.scriptureRef ? `<p style="font-size:13px;color:#7a6e5f;margin:0 0 12px;font-style:italic;">${opts.scriptureRef}</p>` : ''}
    <p style="font-size:14.5px;line-height:1.75;margin:0;white-space:pre-wrap;">${opts.instructions}</p>
  </div>
  <a href="${APP_URL}/portal/homework" style="display:inline-block;background:#1a2744;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;">Open Shepherd →</a>
  <p style="font-size:13px;color:#7a6e5f;margin:24px 0 0;">Log in to Shepherd to view and submit your homework.</p>
</div>`.trim();

  try {
    await transport.sendMail({
      from: `"${opts.fromName} via Shepherd" <${smtpUser}>`,
      to: opts.toEmail,
      replyTo: opts.fromEmail,
      subject: `New Homework: ${opts.title}`,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[mailer] Failed to send:', msg);
    return { ok: false, error: msg };
  }
}
