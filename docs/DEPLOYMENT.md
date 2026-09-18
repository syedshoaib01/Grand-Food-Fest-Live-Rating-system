# DEPLOYMENT SPECIFICATION — GRAND FOOD FEST

This document details production deployment, environment variables, database migration, and scaling architecture.

---

## 1. RECOMMENDED DEPLOYMENT STACK

* **Web Hosting**: Vercel, Railway, AWS ECS, or Render (Node.js 18+ runtime).
* **Database**: PostgreSQL on Supabase, AWS RDS, or Neon.
* **CDN / Edge**: Cloudflare or Vercel Edge Network for caching static assets and directory pages.

---

## 2. PRODUCTION ENVIRONMENT VARIABLES

Configure these environment variables in your hosting provider's secrets manager:

```env
# Production PostgreSQL connection string (with SSL)
DATABASE_URL="postgresql://user:password@host:5432/grandfoodfest?sslmode=require"

# Cryptographic HMAC signing secret (generate with: openssl rand -hex 32)
ADMIN_JWT_SECRET="<random-32-byte-hex>"

# Attendee pass token hashing salt (generate with: openssl rand -hex 16)
PASS_SALT="<random-16-byte-hex>"

# Admin initial credentials
ADMIN_EMAIL="admin@grandfoodfest.com"
ADMIN_PASSWORD="<strong-random-password>"

# Developer mode flag (MUST BE FALSE IN PRODUCTION)
NEXT_PUBLIC_DEV_MODE="false"

NODE_ENV="production"
```

---

## 3. BUILD & DEPLOYMENT COMMANDS

```bash
# 1. Install dependencies
npm ci

# 2. Push / migrate schema to production PostgreSQL
npx prisma db push

# 3. Seed initial festival events, days, and stalls
npm run db:seed

# 4. Compile production bundle
npm run build

# 5. Start production server
npm start
```

---

## 4. HEALTH CHECK & MONITORING

* **Health Check Endpoint**: `GET /api/event`
* Verify status is 200 OK and returns active festival data.
