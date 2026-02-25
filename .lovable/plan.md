

## Taking Your Site Live with Your Custom Domain

Here's the step-by-step process to publish your site and connect your existing domain.

### Step 1: Publish Your Project

1. Click the **Publish** button in the top-right corner of the editor (the globe/web icon).
2. Click **Publish** in the dialog that appears.
3. Your site will be live on a staging URL (e.g., `yourproject.lovable.app`).

### Step 2: Connect Your Custom Domain

1. Click your **project name** (top-left) → **Settings**.
2. Go to the **Domains** tab.
3. Click **Connect Domain** and enter your domain (e.g., `yourdomain.com`).
4. Lovable will give you DNS records to set at your domain registrar.

### Step 3: Update DNS at Your Registrar

Since another website currently uses your domain, you'll need to **replace** the existing DNS records:

1. Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.).
2. Find the **DNS settings** for your domain.
3. **Remove or replace** the existing A records pointing to your old website.
4. Add these records:
   - **A Record**: Name `@` → Value `185.158.133.1`
   - **A Record**: Name `www` → Value `185.158.133.1`
   - **TXT Record**: Name `_lovable` → Value provided by Lovable during setup
5. Save the changes.

### Step 4: Wait for Propagation

- DNS changes can take **up to 72 hours** to propagate, though it's often much faster (minutes to a few hours).
- Lovable will automatically provision SSL (HTTPS) once DNS is verified.
- You can check propagation at [dnschecker.org](https://dnschecker.org).

### Important Notes

- **Your old site will go offline** as soon as DNS points to Lovable — there's no way to run both simultaneously on the same domain.
- Add **both** `yourdomain.com` and `www.yourdomain.com` in Lovable's domain settings, then set one as **Primary** (the other will redirect).
- A **paid Lovable plan** is required for custom domains.

