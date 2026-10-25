# 🎓 Scholarship Manager

Track Master's scholarship deadlines, the documents each one needs, and your to-do list.
Built with Next.js, Tailwind CSS and Supabase; deployed on Vercel.

## Features

- **Scholarship cards** with deadline countdown (red < 7 days, orange < 30), status, funding and document progress — click a card for full details
- **Add manually** or **import from AI**: copy the prompt from the *AI Prompt* tab, paste the AI's JSON reply into *Import*
- **To-do list**: every document needed across all scholarships, listed once, sorted by the nearest deadline that needs it, with status and file upload
- **Other tasks** (e.g. "email professor"), optionally linked to a scholarship
- Magic-link email login; each user only sees their own data (Row Level Security)

## Setup

### 1. Supabase

1. In the Supabase dashboard open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
2. Go to **Authentication → URL Configuration**:
   - **Site URL**: your Vercel URL (e.g. `https://scholarship-manager.vercel.app`), or `http://localhost:3000` until you deploy
   - **Redirect URLs**: add `http://localhost:3000/**` and `https://<your-vercel-url>/**`

### 2. Run locally

```bash
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm install
npm run dev
```

Open http://localhost:3000.

### 3. Deploy on Vercel

1. On [vercel.com](https://vercel.com) → **Add New → Project** → import this GitHub repo.
2. Under **Environment Variables** add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Click **Deploy**. Every push to `main` redeploys automatically.
4. Add the Vercel URL to Supabase's Site URL / Redirect URLs (step 1.2).

> Never put the Supabase **secret** key in this project — the publishable key plus Row Level Security is all the app needs.
