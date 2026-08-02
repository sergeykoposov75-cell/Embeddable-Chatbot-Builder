# Video Demo Script (screen share + voiceover)

**Length target:** ~3–4 minutes.

## Tools
- OBS Studio or built-in OS screen recorder (Win+G on Windows)
- Optional: Loom / Screen Studio for webcam overlay
- Stripe test mode already enabled (or mock billing mode)

---

## 0. Preparation (before recording)

1. Start the app: `npm run dev`
2. Sign up TWO accounts (or one) — one fresh account to demo signup in-video
3. Have a test PDF/DOCX/TXT ready on the desktop
4. Have a test website with the embed iframe already pasted (e.g. a simple `index.html`)
5. Create a Stripe price for Pro ($19/mo) and set `STRIPE_PRO_PRICE_ID` (or keep mock mode)

---

## 1. Landing page (0:00–0:25)

Voiceover: *"ChatbotBuilder turns your documents into an AI chatbot you can embed on any website."*

- Show the landing page: hero, features (Upload, AI answers, Embed anywhere), pricing tiers (Free / Pro / Business)
- Scroll down to pricing

## 2. Registration & login (0:25–1:00)

- Click **Get Started** → go to `/signup`
- Enter email + password → **Create Account**
- *Cut/mention:* "confirm your email, then log in" (skip the inbox wait, or use a test email provider)
- Log in at `/login`
- Land on the dashboard

## 3. Upload documents (1:00–1:40)

- Go to **Upload** (sidebar)
- Drag & drop the PDF
- *Cut while processing* or briefly show "Uploading and processing..."
- Go to **Documents** → show status "Ready"

## 4. Create a chatbot & chat (1:40–2:30)

- Go to **New Chatbot**
- Name it (e.g. "My Support Bot"), pick the uploaded document
- Click **Create Chatbot**
- Ask a question in the chat that has the answer in the document
- Show the AI reply, the typing indicator

## 5. Embed the widget (2:30–3:10)

- In the sidebar hover the bot → click the `</>` icon → **Embed** page
- Click **Publish**
- Copy the iframe code
- Open the test website (`index.html`) in the browser, paste the iframe, save, reload
- Show the floating button in the bottom-right corner
- Click it → chat with the bot from the test site (public API, no login)

## 6. Billing / payment (3:10–3:45)

- Go to **Billing** in the dashboard
- Click **Upgrade** on the Pro plan
- If Stripe is configured: show Stripe Checkout, enter test card `4242 4242 4242 4242`
- After redirect back → show "Active — pro plan" banner with usage (x/5 bots, x/50 docs)

## Outro (3:45–4:00)

- *"That's ChatbotBuilder — build, chat, and embed your AI support bot in minutes. Links in the description."*

---

## Tips

- Record in 1080p, mute microphone noise, speak slowly
- Use browser zoom (Ctrl + +) so text is readable
- If Mistral embedding is slow on upload, record the upload, then edit out the waiting
- Do the Stripe payment in a separate take if it fails; edit it in
