# Environment Variables Setup Guide for Vistabite

## Overview
Environment variables store sensitive information like API keys. They are NOT stored in the code but in separate configuration files.

---

## For Local Development (Your Computer)

### Step 1: Create `.env.local` File

1. Open your project folder in a code editor (like VS Code)
2. In the root directory (where `package.json` is), create a new file named `.env.local`
3. Copy the contents from `.env.local.example` into `.env.local`
4. Fill in your actual API keys

**File location:**
```
VistaBite.io/
├── package.json
├── .env.local          ← Create this file here
├── .env.local.example  ← Reference file
└── ...
```

### Step 2: Add Your RapidAPI Key

In the `.env.local` file, find this line:
```
RAPIDAPI_KEY=your_rapidapi_key_here
```

Replace `your_rapidapi_key_here` with your actual RapidAPI key:
```
RAPIDAPI_KEY=8b49adbf5dmshf4d668a7fb11605p1012a7jsn4d1924a51717
```

### Step 3: Add Other Required Keys

Fill in all the other API keys in `.env.local`:

```env
# Database - Get from Neon dashboard
DATABASE_URL=postgresql://user:password@host:port/database

# Groq API - Get from Groq console
GROQ_API_KEY=your_groq_key_here

# RapidAPI - Your Instagram Scraper API key
RAPIDAPI_KEY=your_rapidapi_key_here

# Resend Email Service
RESEND_API_KEY=your_resend_key_here
FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=your_admin_email@example.com
```

### Step 4: Start Your App

```bash
npm run dev
```

The app will now use variables from `.env.local`

---

## For Production (Vercel)

### Step 1: Go to Vercel Dashboard

1. Visit: `https://vercel.com/dashboard`
2. Select your `VistaBite.io` project
3. Click **Settings** → **Environment Variables**

### Step 2: Add Variables

Click **Add New** for each variable:

| Variable Name | Value |
|---|---|
| `RAPIDAPI_KEY` | Your RapidAPI key |
| `DATABASE_URL` | Your Neon database URL |
| `GROQ_API_KEY` | Your Groq API key |
| `RESEND_API_KEY` | Your Resend API key |
| `ADMIN_EMAIL` | Your admin email |

### Step 3: Deploy

Push your code to GitHub, and Vercel will automatically deploy with the new environment variables.

---

## How Next.js Uses Environment Variables

**In Code:**
```javascript
const apiKey = process.env.RAPIDAPI_KEY;
```

**Types of Variables:**

1. **Private Variables** (Server-side only)
   - `RAPIDAPI_KEY`
   - `DATABASE_URL`
   - `GROQ_API_KEY`
   - Use: `process.env.VARIABLE_NAME`

2. **Public Variables** (Client-side, visible to users)
   - Start with `NEXT_PUBLIC_`
   - Example: `NEXT_PUBLIC_FRONTEND_URL`
   - Use: `process.env.NEXT_PUBLIC_VARIABLE_NAME`

---

## Important: Never Commit `.env.local`

The `.env.local` file should NEVER be committed to GitHub because it contains secret keys.

**Check if `.gitignore` has `.env.local`:**

Open `.gitignore` file and verify it contains:
```
.env.local
.env.*.local
```

If not there, add it!

---

## Testing Your Configuration

To verify your environment variables are loaded correctly:

1. Add this to `app/page.tsx` temporarily:
```javascript
console.log('RAPIDAPI_KEY set:', !!process.env.RAPIDAPI_KEY);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
```

2. Check the console in browser dev tools
3. Remove the code after testing

---

## Where Each API Key Comes From

| API | Where to Get It |
|---|---|
| **RapidAPI Key** | `https://rapidapi.com/account/keys` |
| **Groq API Key** | `https://console.groq.com/keys` |
| **Database URL** | Neon dashboard → Connection string |
| **Resend API Key** | `https://resend.com/api-keys` |

---

## Quick Checklist

- [ ] Created `.env.local` file in root directory
- [ ] Added `RAPIDAPI_KEY` from your RapidAPI dashboard
- [ ] Added `DATABASE_URL` from Neon
- [ ] Added `GROQ_API_KEY` from Groq console
- [ ] Added `RESEND_API_KEY` from Resend
- [ ] Verified `.gitignore` has `.env.local`
- [ ] Restarted dev server with `npm run dev`
- [ ] Environment variables working (check console)

---

## Troubleshooting

**"process.env.RAPIDAPI_KEY is undefined"**
- Check if `.env.local` exists in root directory
- Verify the key name is spelled correctly
- Restart dev server

**"API returns 403 Forbidden"**
- RapidAPI key might be wrong
- Check your RapidAPI subscription is active

**"Can't find .env.local"**
- Create the file manually in your project root
- Copy from `.env.local.example`
