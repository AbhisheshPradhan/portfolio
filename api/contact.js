// Vercel serverless function — receives the contact form, drops obvious bot
// submissions (honeypot + timing), then sends the email via Resend.
//
// Required environment variable (Vercel dashboard → Project → Settings → Environment Variables):
//   RESEND_API_KEY  — create at https://resend.com/api-keys
//
// The API key lives only here on the server. Never put it in index.html.

const TO = "pradhan.abhishesh@gmail.com";
// 'onboarding@resend.dev' works out of the box but only delivers to YOUR OWN
// Resend account email. Once you verify your domain in Resend, switch to e.g.:
// const FROM = 'Portfolio <contact@abhisheshpradhan.com>';
const FROM = "Portfolio <onboarding@resend.dev>";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const {
		name = "",
		email = "",
		message = "",
		company = "",
		ts = "",
	} = req.body || {};

	// Bot traps: the honeypot ("company") is hidden from real users, and a real
	// submit always carries a render timestamp set by the page's JS (a direct
	// POST won't). Either signal means a bot — return a fake success so it
	// doesn't retry. The sub-2-second timing check runs client-side, where the
	// clock is consistent; comparing a client timestamp to the server clock
	// here would misfire on devices with skewed clocks and drop real messages.
	if (company || !ts) {
		return res.status(200).json({ ok: true });
	}

	if (!name.trim() || !email.trim() || !message.trim()) {
		return res.status(400).json({ error: "Missing fields" });
	}
	if (name.length > 200 || email.length > 200 || message.length > 5000) {
		return res.status(400).json({ error: "Input too long" });
	}

	// Send the email via Resend
	const esc = (s) =>
		s.replace(
			/[&<>"']/g,
			(c) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				})[c],
		);

	const send = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: FROM,
			to: [TO],
			reply_to: email,
			subject: `Portfolio contact — ${name}`,
			html: `<p><b>${esc(name)}</b> (${esc(email)}) sent a message via your portfolio:</p>
             <p>${esc(message).replace(/\n/g, "<br>")}</p>`,
		}),
	});

	if (!send.ok) {
		return res.status(502).json({ error: "Email delivery failed" });
	}

	return res.status(200).json({ ok: true });
}
