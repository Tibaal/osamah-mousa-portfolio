# Osamah Mousa — Portfolio Site

A single-page static site. No build step, no framework, no dependencies —
just `index.html` + an `images/` folder.

## Local preview

Just open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy: GitHub

```bash
git init
git add .
git commit -m "Initial site"
```

Then create a new repo on github.com (or via `gh repo create`), and:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Deploy: Vercel

1. Go to https://vercel.com → **Add New Project**.
2. Import the GitHub repo you just pushed.
3. Framework Preset: choose **Other** (it's a static site, no build command needed).
4. Click **Deploy**. Vercel will give you a `*.vercel.app` URL immediately.
5. Every future `git push` to `main` auto-redeploys.

## Connect your Squarespace-registered domain

You keep the domain registered at Squarespace — you're just pointing its DNS
at Vercel, not moving the registration.

1. In Vercel: open your project → **Settings → Domains** → add your domain
   (e.g. `osamahmousa.com`). Vercel will show you the DNS records to add
   (typically an `A` record for the root domain, and a `CNAME` for `www`).
2. In Squarespace: go to **Settings → Domains → [your domain] → DNS Settings**,
   and add the exact records Vercel gave you.
3. Wait for DNS propagation (usually minutes, sometimes a few hours), then
   Vercel will auto-verify and issue an SSL certificate.

## Updating content later

Edit `index.html` directly (text, links, sections). To add or swap a photo,
drop the new file into `images/` and update the matching `<img src="images/...">`
reference. Keep images as `.webp` where possible — smaller file size, same quality.
