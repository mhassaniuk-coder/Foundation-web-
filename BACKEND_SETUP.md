# Backend Setup Guide

## Overview

This document provides setup instructions for implementing the backend of the Restored Kings Foundation website.

## Tech Stack Recommendations

### Option 1: Node.js + Express (Recommended for most)
- **Language**: JavaScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Email**: SendGrid or Nodemailer
- **Authentication**: JWT

### Option 2: Python + Flask/Django
- **Language**: Python
- **Framework**: Flask or Django
- **Database**: PostgreSQL
- **Email**: Django Mail or SendGrid
- **Authentication**: JWT or Sessions

### Option 3: PHP (For shared hosting)
- **Language**: PHP 7.4+
- **Framework**: Laravel or Slim
- **Database**: MySQL/MariaDB
- **Email**: Swift Mailer or PHPMailer

## Installation (Node.js + Express)

### Prerequisites
- Node.js v14+ (https://nodejs.org)
- npm or yarn
- PostgreSQL (https://www.postgresql.org)
- Git

### Setup Steps

```bash
# 1. Navigate to project directory
cd d:\foundation website

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Configure database
# Edit .env with your database credentials

# 5. Start server
npm start

# 6. Visit admin panel
# http://localhost:3000/admin
```

## Environment Configuration (.env)

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development
SERVER_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restored_kings_db
DB_USER=postgres
DB_PASSWORD=your_password

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email Configuration
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxx
ADMIN_EMAIL=admin@restoredkings.org
FROM_EMAIL=noreply@restoredkings.org

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Security
CORS_ORIGINS=http://localhost:3000,https://restoredkings.org
SESSION_SECRET=your_session_secret

# Google Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Domain
DOMAIN=restoredkings.org
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- admin, user, volunteer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Donations Table
```sql
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50), -- one-time, monthly
    status VARCHAR(50), -- pending, completed, failed
    stripe_charge_id VARCHAR(255),
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Volunteers Table
```sql
CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    interests TEXT, -- JSON array
    availability VARCHAR(100),
    status VARCHAR(50), -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(100),
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(50), -- new, read, responded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blog Posts Table
```sql
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    author_id INTEGER REFERENCES users(id),
    status VARCHAR(50), -- draft, published
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me
```

### Donations
```
POST   /api/donate              # Create donation
GET    /api/donations          # Admin: view all donations
GET    /api/donations/:id      # Admin: view single donation
PUT    /api/donations/:id      # Admin: update donation
DELETE /api/donations/:id      # Admin: delete donation
GET    /api/donations/stats    # Public: donation stats
```

### Volunteers
```
POST   /api/volunteer/apply    # Submit application
GET    /api/volunteers         # Admin: view all applications
GET    /api/volunteers/:id     # Admin: view single application
PUT    /api/volunteers/:id     # Admin: update status
DELETE /api/volunteers/:id     # Admin: delete application
```

### Contact & Messages
```
POST   /api/contact            # Submit contact form
GET    /api/messages           # Admin: view all messages
GET    /api/messages/:id       # Admin: view single message
PUT    /api/messages/:id       # Admin: mark as read
DELETE /api/messages/:id       # Admin: delete message
```

### Blog
```
POST   /api/blog               # Admin: create post
GET    /api/blog               # Public: list posts
GET    /api/blog/:slug         # Public: read post
PUT    /api/blog/:id           # Admin: update post
DELETE /api/blog/:id           # Admin: delete post
```

### Newsletter
```
POST   /api/newsletter/subscribe
GET    /api/newsletter/subscribers  # Admin only
```

## Stripe Integration

### Setup Payment Processing

1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard
3. Add to .env:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_PUBLIC_KEY=pk_live_xxxxx
   ```

4. Create webhook endpoint:
   ```javascript
   // backend/routes/webhooks.js
   app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
       const sig = req.headers['stripe-signature'];
       let event;
       
       try {
           event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
       } catch (err) {
           return res.status(400).send(`Webhook Error: ${err.message}`);
       }
       
       if (event.type === 'charge.succeeded') {
           // Handle successful payment
           const charge = event.data.object;
           // Save to database, send confirmation email
       }
       
       res.json({received: true});
   });
   ```

## Email Configuration

### Using SendGrid (Recommended)

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendConfirmationEmail(email, name, amount) {
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Donation Confirmation',
        html: `
            <h2>Thank you for your generosity, ${name}!</h2>
            <p>Your donation of $${amount} has been received.</p>
            <p>Tax ID: XX-XXXXXXX</p>
        `
    };
    
    await sgMail.send(msg);
}
```

## Security Best Practices

✅ **Implement:**
- Input validation on all endpoints
- Rate limiting to prevent abuse
- HTTPS/SSL certificates
- CSRF protection
- SQL injection prevention (use parameterized queries)
- XSS protection
- Password hashing (bcrypt)
- JWT token expiration
- CORS configuration
- Security headers

```javascript
// Example: Add security headers with Helmet
const helmet = require('helmet');
app.use(helmet());
```

## Testing

### Unit Tests (with Jest)
```bash
npm test
```

### API Testing (with Postman)
1. Import API collection
2. Set environment variables
3. Run tests for each endpoint

### Payment Testing
Use Stripe test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## Deployment

### Heroku Deployment
```bash
# 1. Create Heroku account
# 2. Create procfile
echo "web: node backend/server.js" > Procfile

# 3. Deploy
git push heroku main
```

### AWS Deployment
- Use Elastic Beanstalk or EC2
- RDS for PostgreSQL
- S3 for file storage
- CloudFront for CDN

### DigitalOcean Deployment
- Droplet for server
- Managed Database for PostgreSQL
- Spaces for file storage

## Monitoring & Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

## Common Issues & Solutions

**Issue**: CORS errors
- Solution: Update CORS_ORIGINS in .env

**Issue**: Database connection fails
- Solution: Check database credentials and ensure PostgreSQL is running

**Issue**: Stripe payments failing
- Solution: Verify API keys and webhook setup

**Issue**: Emails not sending
- Solution: Check SendGrid API key and email verification

## Support Resources

- Express.js Docs: https://expressjs.com
- Stripe API: https://stripe.com/docs/api
- PostgreSQL: https://www.postgresql.org/docs
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

---

**Status**: Development Ready
**Last Updated**: March 2024
