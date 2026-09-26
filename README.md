# Dhaka Tesla Pool — Frontend

Next.js + Tailwind frontend for the Dhaka Tesla Pool ride-pooling MVP.

For full project documentation — architecture, ERD, database design, tech justification, concurrency handling, AI usage, and demo video — see the main README in the backend repo:

👉 **[dhaka-ridepool (backend repo)](https://github.com/yunusarfat/dhaka-ridepool)**

## What's in this repo

- `/login`, `/register` — authentication pages
- `/passenger` — passenger dashboard: request a ride, track status/fare, view history, cancel
- `/driver` — driver dashboard: manage vehicle, view active pool, progress ride lifecycle

## Local Setup

```bash
git clone https://github.com/yunusarfat/pool_frontend.git
cd pool_frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend URL
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Set this to your deployed backend URL when running against production, e.g.:
```
NEXT_PUBLIC_API_URL=https://dhaka-ridepool.onrender.com
```

## Deployment

Deployed on **Vercel**: *(add your Vercel URL here)*

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- js-cookie for client-side auth token storage

See the [backend README](https://github.com/yunusarfat/dhaka-ridepool) for the full tech-stack justification table.
