# Quick Start Guide - Restored Kings Foundation Website

## Welcome! 👑

You now have a complete, professional website for the Restored Kings Foundation. Here's how to get started.

## 📋 What You Have

✅ **8 Complete Pages:**
- Home page with impact metrics
- About Us with mission/vision
- Programs & Services
- Impact Stories with testimonials
- Donation page (Stripe-ready)
- Volunteer application
- Blog & Updates
- Contact form

✅ **Professional Features:**
- Responsive mobile design
- Color scheme: Deep Blue, Gold, Earth Tones
- Modern, trustworthy aesthetic
- Forms for donations, volunteers, contact
- Newsletter signup
- Admin panel template
- SEO optimized
- Fast loading

✅ **Ready for Backend Integration:**
- Stripe payment processing
- Email notifications
- User authentication
- Database schemas provided
- API endpoint structure

## 🚀 Start Here

### Step 1: View the Website Locally (5 min)

**Using Python (easiest):**
```bash
cd public
python -m http.server 8000
# Visit http://localhost:8000
```

Or using Node.js:
```bash
npx http-server public/
# Visit http://localhost:8080
```

Or in VS Code:
- Install "Live Server" extension
- Right-click `public/index.html` → "Open with Live Server"

### Step 2: Customize Content (30 min)

Edit these files to add your information:

1. **Update Contact Info** (all HTML files):
   - Email: `contact@restoredkings.org` → your email
   - Phone: `(555) 123-4567` → your phone
   - Address: `[City Location]` → your location
   - EIN: `XX-XXXXXXX` → your EIN

2. **Update Social Links** (footer in all pages):
   - Facebook, Twitter, Instagram, LinkedIn URLs

3. **Customize Colors** (if desired):
   - Edit `public/css/styles.css`
   - Line 7-13 has color variables

4. **Add Your Logo/Images**:
   - Place images in `public/images/`
   - Update hero image paths

### Step 3: Deploy to Free Hosting (15 min)

**Easiest: Netlify**
1. Sign up: https://netlify.com
2. Drag & drop `public` folder
3. Get instant free hosting
4. Can add custom domain ($12/year)

**Alternative: GitHub Pages**
1. Push to GitHub: https://github.com
2. Go to Settings → Pages
3. Select main branch
4. Click Save
5. Live in 2 minutes!

## 💰 Enable Donations

To accept donations:

1. **Create Stripe Account:**
   - Go to https://stripe.com
   - Sign up (free)
   - Get test keys from dashboard

2. **Update Stripe Key:**
   - Open `public/js/donate.js`
   - Line 15: Replace `pk_test_YOUR_STRIPE_KEY`
   - Use your actual Stripe key

3. **Test Donations:**
   - Visit `/donate.html`
   - Use test card: 4242 4242 4242 4242
   - Any future date, any CVC
   - Click "Donate"

4. **Go Live:**
   - Switch to live Stripe keys in production
   - Enable SSL/HTTPS (Netlify does this free)

## 📧 Enable Email

To receive form submissions & send confirmations:

**Using SendGrid (Free plan available):**

1. Sign up: https://sendgrid.com
2. Verify sender email
3. Get API key
4. For now: Forms display success messages locally

**Backend needed for email:**
- Implement `/api/contact` endpoint
- Implement `/api/donate` endpoint
- See BACKEND_SETUP.md for details

## 🤝 Go Live Checklist

- [ ] All content updated
- [ ] Contact info correct
- [ ] Logo/images added
- [ ] Mobile tested
- [ ] Forms tested
- [ ] Donations tested (stripe test mode)
- [ ] Domain purchased
- [ ] Hosted (Netlify/Vercel/GitHub Pages)
- [ ] Custom domain configured
- [ ] Analytics ID added
- [ ] SSL enabled
- [ ] Legal pages created
- [ ] Team trained

## 📱 Mobile Testing

The site is fully responsive! Test on:
- iPhone/iPad
- Android phone
- Tablet
- Desktop

To test locally:
- Open DevTools (F12)
- Click device toggle (top-left)
- Select mobile device

## 🛠️ Common Customizations

### Change Hero Image
```html
<!-- In each page, update: -->
<section class="hero" style="background: linear-gradient(...), url('/images/YOUR_IMAGE.jpg')">
```

### Change Brand Colors
Edit `public/css/styles.css` lines 7-13:
```css
--primary-color: #1a3a5c;    /* Deep Blue */
--secondary-color: #d4a574;  /* Gold */
```

### Add Team Members
Edit `about.html` and add team member cards

### Add Success Stories
Edit `impact.html` - copy the story card structure

### Add Blog Posts
Edit `blog.html` - copy the post card

### Change Phone/Email
Find & replace in all files (use Ctrl+Shift+H in VS Code)

## 📚 Documentation

**For Understanding the Site:**
- `README.md` - Full documentation
- `BACKEND_SETUP.md` - Backend implementation guide
- `DEPLOYMENT.md` - Deployment strategies

**File Structure:**
```
public/
├── index.html       ← Home page
├── about.html       ← About Us
├── programs.html    ← Programs
├── impact.html      ← Impact Stories
├── donate.html      ← Donations
├── volunteer.html   ← Volunteer signup
├── blog.html        ← Blog
├── contact.html     ← Contact form
├── css/             ← Styles
└── js/              ← JavaScript
```

## 🔐 Security Notes

✅ **Safe as-is for static site**

⚠️ **When adding backend:**
- Never commit `.env` file
- Use strong passwords
- Keep API keys secret
- Enable HTTPS
- Validate all inputs
- See DEPLOYMENT.md

## 💡 Next Steps

1. **Short term (1 week):**
   - [ ] Customize all content
   - [ ] Get mobile working
   - [ ] Deploy to Netlify
   - [ ] Get live domain

2. **Medium term (1-4 weeks):**
   - [ ] Set up Stripe live
   - [ ] Configure email
   - [ ] Add analytics
   - [ ] Create legal pages

3. **Long term (1-3 months):**
   - [ ] Build admin panel
   - [ ] Add database
   - [ ] Enable email notifications
   - [ ] Monitor analytics

## 🆘 Help & Support

**Technical Questions:**
- MDN Web Docs: https://developer.mozilla.org
- Stack Overflow: https://stackoverflow.com
- Netlify Docs: https://docs.netlify.com

**Stripe Help:**
- https://stripe.com/docs
- Stripe support portal

**Git Help:**
- GitHub Guides: https://guides.github.com
- Git Documentation: https://git-scm.com/doc

## 📈 Growth Tips

1. **Content:** Publish blog posts regularly
2. **Social:** Share on Facebook, Instagram, Twitter
3. **Email:** Build newsletter list
4. **SEO:** Add meta descriptions to new content
5. **Outreach:** Partner with other nonprofits
6. **Stories:** Highlight client success stories
7. **Volunteer:** Feature volunteer spotlights
8. **Stats:** Update impact numbers monthly

## 🎯 Key Messages on Site

The site communicates:
- ✅ We restore dignity
- ✅ We support men and boys with real action
- ✅ We are transparent
- ✅ We are building stronger communities

This messaging is woven throughout all pages.

## 📊 Analytics to Track

- Visitors (Google Analytics)
- Donations (Stripe dashboard)
- Volunteer applications
- Contact form submissions
- Email subscribers
- Page views (where do people go?)
- Bounce rate (mobile vs desktop?)
- Conversion rate (visitors → donors)

## 🙏 Final Notes

This website is:
- **Ready to launch** - Almost everything works
- **Customizable** - Easy to adapt to your needs
- **Professional** - Builds donor trust
- **Scalable** - Can add more features later
- **Mobile-first** - Works great on all devices

The backend (forms, payments, database) needs development, but front-end is production-ready!

---

**Let's get started! 🚀**

Questions? Check README.md or BACKEND_SETUP.md

**Last Updated:** March 2024
**Ready to deploy:** YES ✓
