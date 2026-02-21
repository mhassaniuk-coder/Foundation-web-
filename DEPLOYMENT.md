# Deployment Guide - Restored Kings Foundation Website

## Pre-Deployment Checklist

- [ ] All page content is up to date
- [ ] Contact information is correct
- [ ] Legal pages (privacy policy, terms) are created
- [ ] SSL certificate is obtained
- [ ] Domain name is registered
- [ ] Email is configured
- [ ] Analytics ID is set
- [ ] Stripe account is live (not test mode)
- [ ] Admin accounts are created
- [ ] Database backups are configured
- [ ] Security headers are enabled
- [ ] SEO meta tags are correct
- [ ] Images are optimized
- [ ] Tests pass locally

## Deployment Options

### Option 1: Netlify (Easiest for Static Site)

**Pros:**
- Simple, Git-based deployment
- Automatic HTTPS
- Fast CDN
- Free tier available
- Great for nonprofits

**Steps:**
1. Push code to GitHub (https://github.com)
2. Create Netlify account (https://netlify.com)
3. Connect GitHub repo to Netlify
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `public`
5. Add environment variables in Netlify UI
6. Configure domain in Netlify settings
7. Netlify auto-deploys on push to main

**Cost:** Free tier or $19+/month

---

### Option 2: Vercel (Best for Dynamic Content)

**Pros:**
- Excellent for Node.js apps
- Serverless functions
- Analytics included
- Global edge network
- Git-based deployment

**Steps:**
1. Create Vercel account (https://vercel.com)
2. Connect GitHub repo
3. Configure project:
   - Framework: Next.js (or Other)
   - Build Command: `npm run build`
   - Output Directory: `dist` or `.next`
4. Add environment variables
5. Custom domain setup
6. Automatic deployments on push

**Cost:** Free tier or $20+/month

---

### Option 3: Heroku (Traditional Server)

**Pros:**
- Full server control
- Good database support
- Add-ons marketplace
- Small scale to enterprise

**Cons:**
- Costs more
- Requires more config
- Deprecating free tier

**Steps:**
1. Create Heroku account (https://heroku.com)
2. Install Heroku CLI
3. Create Procfile:
   ```
   web: node backend/server.js
   ```
4. Deploy:
   ```bash
   heroku login
   heroku create restored-kings-foundation
   git push heroku main
   ```
5. Add environment variables:
   ```bash
   heroku config:set JWT_SECRET=xxxxx
   ```
6. Provision database:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

**Cost:** $5-50+/month

---

### Option 4: AWS (Enterprise)

**Recommended Architecture:**
- **Frontend:** CloudFront + S3
- **Backend:** Elastic Beanstalk
- **Database:** RDS (PostgreSQL)
- **Files:** S3 storage
- **Email:** SES

**Steps:**
1. Create AWS account
2. Configure S3 bucket for static files
3. Create CloudFront distribution
4. Deploy Elastic Beanstalk application
5. Create RDS database
6. Configure security groups and IAM roles
7. Point domain via Route 53

**Cost:** $100-500+/month depending on traffic

---

### Option 5: DigitalOcean (Medium Complexity)

**Recommended Setup:**
- Droplet (server)
- Managed PostgreSQL database
- Spaces (object storage)
- App Platform (easier deployment)

**Steps:**
1. Create DigitalOcean account
2. Create Droplet (Ubuntu 20.04)
3. SSH into droplet
4. Install Node.js, PostgreSQL, nginx
5. Clone repository
6. Install dependencies: `npm install`
7. Configure nginx as reverse proxy
8. Set up SSL with Let's Encrypt
9. Create systemd service for Node app
10. Point domain DNS to droplet IP

**Cost:** $5-20+/month

---

### Option 6: Shared Hosting (Budget)

For shared hosting with PHP:

1. Upload files via FTP
2. Configure MySQL database
3. Update database credentials
4. Set up email configuration
5. Enable SSL certificate

**Cost:** $5-15/month

**Limitation:** Limited performance, shared resources

---

## Domain Setup

### Register Domain
- GoDaddy
- Namecheap
- Google Domains
- AWS Route 53

### Point to Hosting

**Netlify:**
```
Update nameserver or CNAME:
example.com -> 15.199.156.249
www.example.com -> [Netlify delegation]
```

**Vercel:**
```
Nameservers:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**AWS:**
```
Use Route 53 nameservers
```

## SSL Certificate Setup

### Free Option: Let's Encrypt
Most hosting platforms include free Let's Encrypt.

```bash
# Manual setup (if needed)
certbot certonly --standalone -d restoredkings.org -d www.restoredkings.org
```

### Paid Options
- DigiCert
- GlobalSign
- ComodoCA

## Email Configuration for Production

### SendGrid (Recommended for nonprofits)
1. Create free account (up to 100 emails/day)
2. Verify sender email
3. Get API key
4. Add to .env: `SENDGRID_API_KEY=SG.xxxxx`

### AWS SES
1. Set up in AWS console
2. Verify domain or email
3. Request production access
4. Configure DKIM/SPF

### Email Domain Setup (SPF/DKIM)
Add to DNS records:

**SPF:**
```
v=spf1 include:sendgrid.net ~all
```

**DKIM:**
```
Add CNAME record provided by SendGrid
```

**DMARC:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@restoredkings.org
```

## Database Migration

### Create Production Database

```bash
# PostgreSQL example
createdb restored_kings_production

# Run migrations
npm run migrate:up

# Seed initial data (if any)
npm run seed
```

### Backup Strategy

Automated daily backups:
```bash
# Backup database daily
0 2 * * * pg_dump restored_kings_production > backup_$(date +\%Y\%m\%d).sql

# Upload to S3
0 3 * * * aws s3 cp backup_*.sql s3://backups/
```

## Security for Production

### 1. HTTPS/SSL
- ✅ Enable on all hosting platforms
- ✅ Redirect HTTP → HTTPS
- ✅ Use security headers

### 2. Environment Variables
- ✅ Use .env files (never in code)
- ✅ Different keys for dev/prod
- ✅ Rotate keys periodically
- ✅ Use secret management (AWS Secrets Manager, Vault)

### 3. Database Security
- ✅ Strong password
- ✅ Restricted access (whitelist IPs)
- ✅ Regular backups
- ✅ Encryption at rest and in transit

### 4. API Security
- ✅ CORS only for trusted domains
- ✅ Rate limiting
- ✅ Input validation
- ✅ Output encoding
- ✅ CSRF protection
- ✅ API keys/JWT tokens

### 5. Web Application Firewall
- AWS WAF
- Cloudflare
- ModSecurity

## Monitoring & Logging

### Application Monitoring
```bash
# Install New Relic APM
npm install newrelic
```

### Error Tracking
- Sentry (errors)
- LogRocket (frontend)
- Paper Trail (logs)

### Uptime Monitoring
- Pingdom
- Uptime Robot (free)
- New Relic

### Analytics
- Google Analytics 4
- Mixpanel
- Amplitude

## Performance Optimization

### Images
```bash
# Compress images
npm install imagemin

# Use WebP format for modern browsers
# Generate responsive images
```

### Caching Strategy
- Set browser cache headers (1 year for static)
- Use CDN (CloudFront, Cloudflare)
- Server-side caching (Redis)

### Code Optimization
```bash
# Minify JS/CSS
npm install minify

# Code splitting
# Lazy loading
```

### Database Optimization
- Index frequently queried columns
- Optimize queries (explain analyze)
- Connection pooling
- Read replicas for reporting

## Rollback Strategy

### Keep Previous Version Running
```bash
# If using Vercel/Netlify
git revert <commit-hash>
git push  # Auto-deploys previous version

# If using Heroku
heroku releases
heroku rollback v10
```

## Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] All pages accessible
- [ ] Forms submit successfully
- [ ] Donations process (test mode first)
- [ ] Email notifications send
- [ ] Analytics tracking works
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] SSL certificate valid
- [ ] Backups running
- [ ] Monitoring alerts active
- [ ] Team trained on admin panel

## Maintenance Schedule

### Daily
- Monitor error logs
- Check uptime alerts
- Review submissions

### Weekly
- Backup verification
- Security check
- Performance review

### Monthly
- Update dependencies
- Review analytics
- Database optimization
- Security audit

### Quarterly
- Full system review
- Load testing
- Disaster recovery drill
- Team training

## Cost Estimate (per month)

| Service | Cost | Purpose |
|---------|------|---------|
| Hosting | $10-50 | Server/Netlify |
| Database | $15-100 | PostgreSQL managed |
| Email | FREE | SendGrid nonprofit |
| SSL | FREE | Let's Encrypt |
| Analytics | FREE | Google Analytics |
| Monitoring | FREE-50 | Sentry/New Relic |
| Storage (S3) | $1-20 | File storage |
| **Total** | **$26-220** | **Typical range** |

## Emergency Contacts

- Hosting support
- Database backup contact
- Security incident hotline
- Domain registrar support

## Documentation Links

- Hosting: See respective platform docs
- Database: https://www.postgresql.org/docs
- Node.js: https://nodejs.org/docs
- Stripe: https://stripe.com/docs
- SendGrid: https://docs.sendgrid.com

---

**Last Updated**: March 2024
**Version**: 1.0
**Status**: Production Ready
