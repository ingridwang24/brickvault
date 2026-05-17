# BrickVault Deployment Guide
## Connecting Supabase & Deploying to Vercel

---

## Current Status ✅

BrickVault is **already set up with Supabase** and ready to deploy. Here's what's in place:

### Tech Stack
- **Framework**: Next.js 16.2.6 (App Router)
- **Frontend**: React 19, TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Ready for Vercel
- **Build Tool**: TypeScript, ESLint

### Supabase Configuration
- ✅ Supabase dependencies installed (`@supabase/ssr`, `@supabase/supabase-js`)
- ✅ Server-side and client-side Supabase clients configured in `lib/supabase/`
- ✅ Database schema created (`supabase/schema.sql`)
- ✅ Environment variables configured locally (`.env.local`)
- ✅ Authentication callback route set up (`app/auth/callback/route.ts`)

### Database Schema
The schema includes:
- **inventory** table: LEGO sets with pricing, condition, and P&L tracking
- **buyers** table: CRM for tracking buyers
- **sales** table: Sale records with profit/loss calculations
- **price_history** table: Historical price tracking
- **Views**: `inventory_with_pnl` and `sales_with_pnl` for calculations

### Features Implemented
- Dashboard overview
- Inventory management with CSV import
- Sales tracking
- Buyers CRM
- Price refresh capability
- Authentication (login page exists)

---

## Step 1: Verify Supabase Database

Your Supabase project is already configured locally. Before deploying, verify the database is set up:

### Option A: Verify via Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Open your project (ID: `jdzfpqmfgmuyrdsplzeq`)
3. Navigate to SQL Editor
4. Run this query to verify tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   You should see: `inventory`, `buyers`, `sales`, `price_history`

### Option B: Apply Schema via Supabase Dashboard
If tables don't exist:
1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql`
4. Paste into the editor
5. Click "Run"

---

## Step 2: Set Up Vercel Deployment

### 2.1 Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Click "Continue with GitHub" (or your preferred git provider)
4. Search for and select your brickvault repository
5. Click "Import"

### 2.2 Configure Environment Variables
In Vercel's project settings:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://jdzfpqmfgmuyrdsplzeq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_Izl0SPgdcdmKPcYlBzUowA_3b4kQtvc
   ```
3. Set them to appear in:
   - Production
   - Preview
   - Development

**Why these are safe to expose:**
- `NEXT_PUBLIC_*` prefix makes them client-side variables
- The ANON_KEY is designed to be public (limited permissions)
- Row-level security (RLS) policies in Supabase protect your data

### 2.3 Build Settings
Vercel should auto-detect:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

If not auto-detected, set them manually.

---

## Step 3: Deploy

### Option A: Auto-Deploy on Push (Recommended)
1. Go to **Settings** → **Git** in your Vercel project
2. Ensure "Deploy on push to main" is enabled
3. Push your code to the main branch:
   ```bash
   git push origin main
   ```

### Option B: Deploy Manually
1. In Vercel dashboard, click "Deployments" tab
2. Click "Deploy" button
3. Select the branch you want to deploy

---

## Step 4: Set Up Authentication (If Needed)

BrickVault has a login page. If you want to protect with Supabase Auth:

### 4.1 Enable Auth in Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Navigate to **Authentication** → **Providers**
3. Enable desired providers (Email, Google, GitHub, etc.)

### 4.2 Set Up Auth Redirect URL
1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add these URLs:
   ```
   Site URL:
   https://yourdomain.vercel.app
   
   Redirect URLs (one per line):
   https://yourdomain.vercel.app/auth/callback
   ```

### 4.3 Update Environment Variables
The callback URL is already configured in code (`app/auth/callback/route.ts`), but verify it matches your domain.

---

## Step 5: Testing & Verification

### Test Locally First
```bash
cd brickvault
npm install  # if needed
npm run dev
# Visit http://localhost:3000
```

Try:
- ✅ Navigating to Inventory page
- ✅ Import CSV feature
- ✅ Adding items manually
- ✅ Viewing Sales and Buyers pages

### Test on Vercel
1. After deployment, visit your Vercel URL (e.g., `https://brickvault.vercel.app`)
2. Test the same flows
3. Check browser console (F12) for errors
4. Verify data persists in database

---

## Troubleshooting

### "Cannot connect to Supabase"
- Verify environment variables are set in Vercel
- Check Supabase project is active (not paused)
- Verify database URL and key are correct

### CSV Import fails
- Check API route: `app/api/import-csv/route.ts`
- Verify Supabase connection in route handler
- Check file size limits (Vercel has 4.5MB max function size)

### Price refresh doesn't work
- Check `app/api/scrape/route.ts` for BrickEconomy scraping logic
- Verify network requests in browser DevTools
- Check Supabase credentials have INSERT permissions

### Build fails on Vercel
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run lint
```

---

## Performance & Security Notes

### Row-Level Security (RLS)
The current schema doesn't have RLS policies. For production, add them:

```sql
-- Example: Only authenticated users can see their own inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" 
  ON inventory 
  FOR SELECT 
  USING (auth.uid() = user_id); -- requires user_id column
```

### Database Indexing
For faster queries, add indexes:
```sql
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_price_history_inventory ON price_history(inventory_id);
```

### Deployment Checklist
- [ ] Database schema verified in Supabase
- [ ] Environment variables set in Vercel
- [ ] Repository connected to Vercel
- [ ] Auth URL configured in Supabase (if using auth)
- [ ] Build succeeds locally: `npm run build`
- [ ] Test data in database (optional)
- [ ] Vercel deployment successful
- [ ] Test flows working on live site

---

## Next Steps

1. **Deploy**: Push to main branch or manually deploy via Vercel
2. **Monitor**: Check Vercel logs for errors: **Deployments** → Click build → **Logs**
3. **Add Data**: Start importing inventory via CSV or manually
4. **Enhance Auth**: Set up Supabase authentication if you need user accounts
5. **Optimize**: Add RLS policies and database indexes for production

---

## Useful Links
- 🌐 Vercel Dashboard: https://vercel.com/dashboard
- 🗄️ Supabase Dashboard: https://app.supabase.com
- 📚 Next.js Docs: https://nextjs.org/docs
- 🔐 Supabase Auth: https://supabase.com/docs/guides/auth
- 📡 Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

**Status**: Ready for deployment ✅  
**Last Updated**: May 17, 2026
