# Deploying Glenwood Park HOA to Production

This guide walks you through deploying the app for real-world use:

- **Frontend (Next.js)** → Vercel (free)
- **Backend (Django)** → Fly.io (free tier, ~always-on)
- **Database (Postgres)** → Neon (free, 0.5 GB)
- **File uploads** → Cloudflare R2 (free up to 10 GB)

You should be able to complete this end-to-end in about an hour.

---

## Prerequisites

- A GitHub account with this repo pushed up (you already have this)
- A credit card on file for Fly.io (they require one, but the free tier is free)
- Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
- Install the Vercel CLI (optional): `npm i -g vercel`

---

## Step 1 — Create a Neon Postgres database

1. Go to <https://neon.tech> and sign up with GitHub
2. Click **New Project**
3. Name it `glenwood-hoa`, pick the region closest to you (e.g. `US East (Ohio)`)
4. Once created, copy the **connection string** from the dashboard — it looks like:

   ```
   postgresql://user:pass@ep-xxx-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

5. **Save this**. You'll paste it into Fly.io in Step 3.

---

## Step 2 — Create a Cloudflare R2 bucket

1. Go to <https://dash.cloudflare.com> and sign up (or log in)
2. In the left sidebar, click **R2 Object Storage**
3. The first time you do this, Cloudflare will ask you to confirm (no card needed for free tier)
4. Click **Create bucket** → name it `glenwood-hoa-documents` → leave everything else default
5. Click the bucket, then **Settings** → note your **bucket name** and **account ID**
6. Go to **Manage R2 API Tokens** (top-right button)
   - Click **Create API Token**
   - Permissions: **Object Read & Write**
   - Specify bucket: select the bucket you just created
   - Click **Create**
   - **Copy and save** the Access Key ID, Secret Access Key, and jurisdiction-specific endpoint URL (looks like `https://<account_id>.r2.cloudflarestorage.com`)

You'll paste these into Fly.io in Step 3.

---

## Step 3 — Deploy the Django backend to Fly.io

From the repo root:

```bash
# 1. Log in
fly auth login

# 2. Create the app (pick a unique name — the one in fly.toml may be taken)
#    This also reads fly.toml automatically.
fly launch --no-deploy --copy-config --name glenwood-hoa-api

# When prompted:
#  - "Would you like to set up a Postgres database?" → NO (we're using Neon)
#  - "Would you like to set up an Upstash Redis database?" → NO
#  - "Would you like to deploy now?" → NO
```

Now set all the secrets (from Step 1 + Step 2):

```bash
# Replace the values with your own from steps 1 and 2.
fly secrets set \
  SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(64))')" \
  DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  ALLOWED_HOSTS="glenwood-hoa-api.fly.dev" \
  CORS_ALLOWED_ORIGINS="https://glenwood-hoa.vercel.app" \
  CSRF_TRUSTED_ORIGINS="https://glenwood-hoa.vercel.app,https://glenwood-hoa-api.fly.dev" \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET_NAME="glenwood-hoa-documents" \
  R2_ENDPOINT_URL="https://<account_id>.r2.cloudflarestorage.com"
```

Then deploy:

```bash
fly deploy
```

The `release_command` in `fly.toml` runs `manage.py migrate` before the new version goes live, so your schema is applied automatically.

After deploy finishes, test it:

```bash
curl https://glenwood-hoa-api.fly.dev/api/v1/auth/
```

You should see a JSON response (even if it's a 401 — that means Django is alive).

### Create an admin user in prod

```bash
fly ssh console -C "python manage.py seed_users"
# or, to create your own:
fly ssh console -C "python manage.py createsuperuser"
```

---

## Step 4 — Deploy the Next.js frontend to Vercel

The easiest path is the dashboard:

1. Go to <https://vercel.com> and sign in with GitHub
2. Click **Add New → Project**
3. Import the `zinc` repository
4. **Root Directory**: set this to `frontend`
5. **Framework Preset**: should auto-detect as Next.js
6. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://glenwood-hoa-api.fly.dev/api/v1` |

7. Click **Deploy**

When it finishes, Vercel will give you a URL like `https://glenwood-hoa.vercel.app`.

### Go back and update the backend with the real frontend URL

Now that you know your Vercel URL, update the backend CORS/CSRF settings:

```bash
fly secrets set \
  CORS_ALLOWED_ORIGINS="https://glenwood-hoa.vercel.app" \
  CSRF_TRUSTED_ORIGINS="https://glenwood-hoa.vercel.app"
```

Fly redeploys automatically after `secrets set`.

---

## Step 5 — Test end-to-end

1. Visit your Vercel URL
2. Log in with the admin account you created in Step 3
3. Create a lease, upload a document — verify the file downloads correctly (it should come from R2 via a signed URL)

---

## Troubleshooting

**"CSRF verification failed" on login**
→ Make sure `CSRF_TRUSTED_ORIGINS` on Fly includes your Vercel URL (and custom domain if you added one).

**CORS error in browser console**
→ `CORS_ALLOWED_ORIGINS` on Fly must exactly match your frontend origin (no trailing slash).

**Uploaded documents 404 on download**
→ Check your R2 credentials with `fly secrets list`. Try re-creating the R2 API token. Make sure `R2_ENDPOINT_URL` has no trailing slash.

**"no such table" errors**
→ Migrations didn't run. Either redeploy (which re-runs `release_command`) or run manually: `fly ssh console -C "python manage.py migrate"`.

**Database connection errors**
→ Neon's free tier puts the DB to sleep after inactivity. The first request after sleep takes 1-2 seconds to wake. This is normal.

---

## Ongoing updates

After the initial setup, deploying changes is just:

```bash
# Backend
git push origin main   # or your branch
fly deploy

# Frontend (Vercel auto-deploys on git push to main;
# for branches, it creates a preview URL)
```

---

## Cost summary

| Service | Free tier | When you'd hit paid |
|---|---|---|
| Vercel | 100 GB bandwidth, unlimited requests | Unlikely for an HOA |
| Fly.io | 3 shared-cpu-1x VMs, 3 GB storage | Unlikely unless traffic spikes |
| Neon | 0.5 GB DB, 190 compute-hours/mo | Small HOA won't reach this |
| Cloudflare R2 | 10 GB storage, 1M class-A ops/mo | Only if you store thousands of docs |

For a ~200-unit HOA with moderate lease activity, expect to stay in the free tier indefinitely.
