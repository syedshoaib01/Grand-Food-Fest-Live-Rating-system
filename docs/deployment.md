# Deployment Guide — Grand Food Fest Live Rating Platform

This platform can be deployed using Vercel, Supabase (or AWS RDS / Railway), or Docker.

---

## 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database instance (Supabase, Neon, AWS RDS, or Railway)
- Domain / SSL certificate for HTTPS (required for secure session cookies)

---

## 2. Environment Variables Configuration
Configure the following in your hosting provider's environment variables:

| Variable | Description | Production Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` |
| `ADMIN_EMAIL` | Organizer admin login email | `admin@grandfoodfest.com` |
| `ADMIN_PASSWORD` | Strong administrative password | `[GENERATE-STRONG-PASSWORD]` |
| `ADMIN_JWT_SECRET` | HMAC secret for signing admin cookies | `[GENERATE-64-CHAR-HEX-SECRET]` |
| `PASS_SALT` | Secret festival salt for pass hashing | `[GENERATE-SALT-KEY]` |
| `NEXT_PUBLIC_DEV_MODE` | Toggle top developer switcher bar | `false` |

> [!WARNING]
> Set `NEXT_PUBLIC_DEV_MODE="false"` in production to disable the quick pass switcher and sample tokens in the public header.

---

## 3. Deployment Steps on Vercel

1. **Push Repository to GitHub**:
   ```bash
   git push origin main
   ```
2. **Import Project into Vercel**:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `prisma generate && next build`
3. **Set Environment Variables**:
   - Add all production variables listed above.
4. **Deploy Database Schema**:
   In your CI/CD pipeline or via local terminal connected to production `DATABASE_URL`:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
5. **Deploy**:
   Click **Deploy**. Vercel will build and launch your application at your custom festival domain (e.g. `https://ratings.grandfoodfest.in`).

---

## 4. Docker Deployment
A containerized deployment can be launched using the following standard Dockerfile:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```
