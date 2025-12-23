# Deployment Guide: Vercel + TiDB Cloud

This guide walks you through deploying InsightInk to Vercel with TiDB Cloud as your database.

## Prerequisites

- [x] TiDB Cloud account with Serverless cluster created
- [ ] Vercel account (free tier available)
- [ ] GitHub account (for Vercel integration)
- [ ] All environment variables ready

## Step 1: Prepare Your Local .env File

Create a `.env` file in your project root with the following variables:

```bash
# Database (TiDB Cloud)
DATABASE_URL="mysql://[username].[password]@[host]:4000/[database]?sslaccept=strict"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# UploadThing
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
```

**Important:** Replace the placeholders with your actual values from TiDB Cloud, Clerk, and UploadThing.

## Step 2: Push Database Schema to TiDB

Run the following commands to set up your database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to TiDB Cloud (no migrations needed for serverless)
npm run db:push

# Optional: Seed the database with demo data
npm run db:seed
```

## Step 3: Test Locally with TiDB

Before deploying, test your connection locally:

```bash
npm run dev
```

Visit `http://localhost:3000` and ensure:
- Database connection works
- Clerk authentication works
- Image uploads work (UploadThing)

## Step 4: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment with TiDB Cloud"
git push origin main
```

## Step 5: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - What's your project's name? **insightink** (or your preferred name)
   - In which directory is your code located? **./
   - Want to modify settings? **N**

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** (leave default)
   - **Install Command:** `npm install`

## Step 6: Configure Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add each variable from your `.env` file:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | Your TiDB connection string | Production, Preview, Development |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk key | Production, Preview, Development |
| `CLERK_SECRET_KEY` | Your Clerk secret | Production, Preview, Development |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Production, Preview, Development |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Production, Preview, Development |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` | Production, Preview, Development |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` | Production, Preview, Development |
| `UPLOADTHING_SECRET` | Your UploadThing secret | Production, Preview, Development |
| `UPLOADTHING_APP_ID` | Your UploadThing app ID | Production, Preview, Development |

3. Click "Save" for each variable

## Step 7: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**

## Step 8: Verify Deployment

Once deployment completes:

1. Visit your Vercel URL (e.g., `https://insightink.vercel.app`)
2. Test the following:
   - [ ] Homepage loads correctly
   - [ ] Sign in/Sign up works (Clerk)
   - [ ] Create a new post (test database write)
   - [ ] Upload an image (test UploadThing)
   - [ ] Publish a post
   - [ ] View published post on public site

## Troubleshooting

### Database Connection Issues

**Problem:** "Can't reach database server"

**Solution:**
- Verify your `DATABASE_URL` is correct
- Ensure TiDB Cloud cluster is active (not paused)
- Check TiDB Cloud firewall settings (Serverless should allow all IPs by default)

### Build Failures

**Problem:** "Module not found" or "Type errors"

**Solution:**
```bash
# Locally, regenerate Prisma client and check for errors
npm run db:generate
npm run build
```

### Clerk Authentication Issues

**Problem:** "Clerk: Invalid publishable key"

**Solution:**
- Double-check your Clerk keys in Vercel environment variables
- Ensure you're using the correct keys for your environment (development vs production)
- Add your Vercel domain to Clerk's allowed origins:
  1. Go to Clerk Dashboard → Your Application
  2. Navigate to **Settings** → **Domains**
  3. Add your Vercel domain (e.g., `insightink.vercel.app`)

### Image Upload Issues

**Problem:** Images fail to upload

**Solution:**
- Verify UploadThing environment variables are set correctly
- Check UploadThing dashboard for any issues
- Ensure your Vercel domain is added to UploadThing's allowed origins

## Database Management

### Running Migrations

When you make schema changes:

```bash
# 1. Update prisma/schema.prisma locally
# 2. Generate migration
npx prisma migrate dev --name your_migration_name

# 3. Push to TiDB Cloud
npm run db:push

# 4. Commit and push to GitHub
git add .
git commit -m "Database schema update"
git push

# Vercel will automatically redeploy
```

### Prisma Studio in Production

To view/edit production data:

```bash
# Set DATABASE_URL to your TiDB Cloud connection string
DATABASE_URL="your-tidb-url" npx prisma studio
```

## Performance Tips

1. **Enable Edge Runtime** for API routes (already configured in your project)
2. **Use ISR (Incremental Static Regeneration)** for blog posts:
   - Edit `app/(public)/posts/[slug]/page.tsx`
   - Add: `export const revalidate = 60` (revalidate every 60 seconds)

3. **Connection Pooling**: TiDB Serverless handles this automatically

## Security Checklist

- [x] Prisma configured with `relationMode = "prisma"`
- [ ] All secrets stored in Vercel environment variables (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] Clerk domains configured correctly
- [ ] UploadThing domains configured correctly
- [ ] TiDB Cloud uses SSL connections (enforced by default)

## Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard → Analytics
- Monitor traffic, performance, and errors

### TiDB Cloud Monitoring
- Go to TiDB Cloud Console → Your Cluster → Monitoring
- Check:
  - Connection count
  - Query performance
  - Storage usage

## Cost Optimization

### TiDB Serverless Free Tier Limits
- 5 GB storage
- 10M Request Units/month
- Automatic scaling

**Tips:**
- Monitor usage in TiDB Cloud dashboard
- Enable "Spend Limit" in TiDB settings to avoid overages
- Optimize queries with proper indexes (already configured in schema)

## Next Steps

After successful deployment:

1. Set up custom domain in Vercel (optional)
2. Configure Clerk production instance with custom domain
3. Set up monitoring/alerting
4. Enable Vercel Analytics
5. Configure CORS if needed for future API consumers

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **TiDB Cloud Documentation:** https://docs.pingcap.com/tidbcloud
- **Prisma Documentation:** https://www.prisma.io/docs
- **Clerk Documentation:** https://clerk.com/docs
- **UploadThing Documentation:** https://docs.uploadthing.com

## Quick Commands Reference

```bash
# Development
npm run dev                  # Start dev server
npm run db:studio           # Open Prisma Studio
npm run db:push             # Push schema changes

# Deployment
vercel                      # Deploy to Vercel
vercel --prod               # Deploy to production
vercel env pull             # Pull environment variables locally

# Database
npx prisma migrate dev      # Create migration
npx prisma db push          # Push schema (no migration)
npx prisma generate         # Generate Prisma Client
npx prisma studio           # Open Prisma Studio
```

---

**Deployment Date:** 2025-12-23
**Project:** InsightInk Blog CMS
**Stack:** Next.js 16 + TiDB Cloud + Vercel + Clerk + UploadThing
