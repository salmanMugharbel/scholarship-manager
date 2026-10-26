# 🎓 Scholarship Manager

Track Master's scholarship deadlines, the documents each one needs, and your to-do list.
Built with Next.js, Tailwind CSS and Supabase; deployed on Vercel.

## Features

- **Scholarship cards** with deadline countdown (red < 7 days, orange < 30), status, funding and document progress — click a card for full details
- **Add manually** or **import from AI**: copy the prompt from the *AI Prompt* tab, paste the AI's JSON reply into *Import*
- **To-do list**: every document needed across all scholarships, listed once, sorted by the nearest deadline that needs it, with status and file upload
- **Other tasks** (e.g. "email professor"), optionally linked to a scholarship
- Single-user password lock (one password, remembered per device); data and files stay private via Row Level Security

## Setup

### 1. Supabase

1. In the Supabase dashboard open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
2. **Authentication → Users → Add user → Create new user**: enter your email and the password you want for the site, and tick **Auto Confirm User**.
3. **Authentication → Sign In / Providers**: turn off **Allow new users to sign up**, so nobody else can create an account.

### 2. Run locally

```bash
cp .env.example .env.local   # then fill in the Supabase URL, publishable key and OWNER_EMAIL
npm install
npm run dev
```

Open http://localhost:3000.

### 3. Deploy on Vercel

1. On [vercel.com](https://vercel.com) → **Add New → Project** → import this GitHub repo.
2. Under **Environment Variables** add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `OWNER_EMAIL` (the email of the user you created in step 1.2)
3. Click **Deploy**. Every push to `main` redeploys automatically.

> Never put the Supabase **secret** key in this project — the publishable key plus Row Level Security is all the app needs.
