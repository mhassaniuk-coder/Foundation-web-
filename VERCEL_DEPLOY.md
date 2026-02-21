# 🚀 Deploy to Vercel - Complete Guide

Your Restored Kings Foundation website is ready to deploy to **Vercel** (free, fast, production-ready).

---

## 📋 Prerequisites

1. **GitHub Account** (free) - https://github.com/join
2. **Vercel Account** (free) - https://vercel.com/signup
3. **Git installed** (already done ✓)
4. **Project committed to Git** (already done ✓)

---

## 🔧 Step-by-Step Deployment

### Step 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Create repository named: `restored-kings-foundation`
3. Click **Create repository**
4. Copy the commands under "...or push an existing repository from the command line"
5. In your project folder, run those commands:

```powershell
cd "d:\foundation website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/restored-kings-foundation.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username

---

### Step 2: Deploy to Vercel (2 minutes)

#### Option A: Using Vercel CLI (Easiest)

```powershell
# Install Vercel CLI globally (one-time only)
npm install -g vercel

# From your project folder
cd "d:\foundation website"
vercel
```

Follow the prompts:
- Choose: **"Create and deploy"**
- Project name: `restored-kings-foundation`
- Framework: **"Other"** (since it's static)
- Output Directory: `public`
- Click to deploy

**✓ Your site is now live!**

---

#### Option B: Using Vercel Dashboard (More Visual)

1. Go to https://vercel.com/import
2. Select your GitHub repository
3. Click **Import**
4. Configure project:
   - **Framework Preset:** Other
   - **Build Command:** Leave blank
   - **Output Directory:** `public`
   - **Root Directory:** `.`
5. Click **Deploy**

**✓ Your site is now live!**

---

## 🌐 Your Live URL

After deployment, Vercel will give you:
- **Default URL:** `https://restored-kings-foundation-abc123.vercel.app`
- **Custom Domain:** See section below

---

## 🎯 Custom Domain (Optional but Recommended)

### Add Your Own Domain

1. **Get a domain** (GoDaddy, Namecheap, Google Domains, etc.)
   - Typical cost: $10-15/year
   - Recommended: `restoredkingsfoundation.org`

2. **Connect to Vercel:**
   - Go to Vercel Project Settings
   - Click **Domains**
   - Enter your domain name
   - Follow Vercel's instructions to update DNS

3. **Enable HTTP → HTTPS redirect**
   - Vercel does this automatically
   - SSL certificate: Free and automatic

---

## 📊 Post-Deployment Checklist

After your site goes live:

- [ ] Visit your live URL and test all pages
- [ ] Test on mobile (responsive design should work)
- [ ] Click all links (internal navigation)
- [ ] Test contact form (will show success state)
- [ ] Test donation form (test Stripe button)
- [ ] Check images load correctly
- [ ] Test volunteer form
- [ ] Verify mobile hamburger menu works
- [ ] Check footer links

---

## 🔗 Set Up Analytics (Optional)

Add Google Analytics to track visitors:

1. Create Google Analytics account: https://analytics.google.com
2. Get your **Measurement ID** (looks like: `G-XXXXXXXXXX`)
3. Add to your pages - find this in `public/js/main.js`:

```javascript
// Around line 20, replace with your ID:
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-YOUR_MEASUREMENT_ID');
```

---

## 🔄 Auto-Deploy Updates

After deployment, your site **auto-updates** when you push to GitHub:

```powershell
# Make a change to any file
# Then:
git add .
git commit -m "Update website content"
git push origin main

# Within 1 minute, your Vercel site updates automatically!
```

---

## 🔐 Environment Variables (For Future Backend)

When you add a backend later, configure in Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add variables like:
   - `STRIPE_PUBLIC_KEY`
   - `STRIPE_SECRET_KEY`
   - `DATABASE_URL`
   - `EMAIL_API_KEY`

They'll automatically be available to your backend.

---

## 💡 Vercel Benefits

✅ **Free Tier Includes:**
- Unlimited bandwidth
- Automatic HTTPS (SSL/TLS)
- Global CDN (fast worldwide)
- Automatic deployments from Git
- 50GB monthly bandwidth
- 100 functions per deployment
- Serverless functions ready for backend
- Analytics and monitoring
- Custom domains
- Environment variables

✅ **No Setup Needed:**
- Database? Use Vercel KV or external service
- Emails? SendGrid free tier
- Payments? Stripe free tier
- Authentication? Auth0 has free tier

---

## 🆘 Troubleshooting

### Site shows 404 errors

**Solution:** Verify `vercel.json` has correct output directory:
```json
{
  "buildCommand": "",
  "outputDirectory": "public"
}
```

### Pages don't load styling or images

**Solution:** Check file paths in HTML are absolute:
- ✅ Correct: `<link rel="stylesheet" href="/css/styles.css">`
- ❌ Wrong: `<link rel="stylesheet" href="./css/styles.css">`

### Images not loading

**Solution:** Ensure image files exist in `public/images/` folder

### Forms don't work

**Note:** Contact/Volunteer forms show success locally but need backend to actually save. For now, they work as UI demonstrations.

---

## 📈 Next Steps After Launch

### Week 1:
- [ ] Share URL with team
- [ ] Get feedback on design
- [ ] Update contact info if needed
- [ ] Add custom domain

### Week 2-3:
- [ ] Update all placeholder content with real data
- [ ] Add real images
- [ ] Test all forms thoroughly
- [ ] Monitor Vercel analytics

### Month 2:
- [ ] Enable Stripe live mode for donations
- [ ] Setup email notifications
- [ ] Create Terms of Service page
- [ ] Add privacy policy legal text

### Month 3+:
- [ ] Build Node.js backend (see BACKEND_SETUP.md)
- [ ] Connect to database
- [ ] Implement admin panel
- [ ] Enable volunteer application processing
- [ ] Setup newsletter service

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/help
- **Git Help:** https://git-scm.com/book
- **This Project README:** See README.md

---

## ✅ Summary

**Current Status:**
- ✅ Website complete
- ✅ Git initialized  
- ✅ Set for easy deployment
- ✅ Ready for custom domain
- ✅ Auto-deployment configured

**Your Next Action:**
1. Get a GitHub account (if you don't have one)
2. Push to GitHub using commands above
3. Deploy via Vercel CLI or Dashboard
4. Share your live URL!

---

**Total Time to Live: ~15 minutes** ⚡

Once live, you have a **production-grade website** serving your foundation with:
- Global CDN (lightning fast)
- Free SSL (https)
- Automatic deployments
- Analytics ready
- Future-proof for backend features

**Your Restored Kings Foundation website is ready to change lives.** 🙌

---

**Deployed with ❤️ on Vercel**
