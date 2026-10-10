import 'server-only';

import { env } from '@/lib/env';

/**
 * Send the one-time sign-in link.
 *
 * With RESEND_API_KEY set, the email goes out through Resend's HTTP API. Without
 * it, in development the link is printed to the server log so the app runs with
 * no external accounts; in production a missing key is an error, because a
 * student would otherwise wait for an email that never comes.
 */
export async function sendSignInEmail(params: { to: string; url: string }): Promise<void> {
  const { to, url } = params;

  if (!env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is not configured, so sign-in emails cannot be sent.');
    }
    console.warn(`\n  Sign-in link for ${to}:\n  ${url}\n`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject: 'Your RGPV Connect sign-in link',
      text: `Sign in to RGPV Connect:\n\n${url}\n\nThe link works once and expires in 15 minutes. If you did not ask for it, ignore this email.`,
      html: signInHtml(url),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend refused the sign-in email (${response.status}): ${detail.slice(0, 200)}`);
  }
}

function signInHtml(url: string): string {
  const safe = url.replace(/"/g, '&quot;');
  return `<!doctype html><html><body style="margin:0;background:#F6F6F3;font-family:Helvetica,Arial,sans-serif;color:#1B2622">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="100%" style="max-width:440px;background:#FFFFFF;border:1px solid #E6E9E6;border-radius:16px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px">
        <p style="margin:0 0 16px;font-size:15px;font-weight:700">RGPV Connect</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:21px">Tap the button to sign in. The link works once and expires in 15 minutes.</p>
        <a href="${safe}" style="display:inline-block;background:#0F8A6F;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:12px">Sign in to RGPV Connect</a>
        <p style="margin:20px 0 0;font-size:12px;line-height:18px;color:#5E6B66">If you did not ask for this, ignore this email. Nobody can sign in without the link.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}
