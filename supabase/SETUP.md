# Supabase Setup Instructions

## 🚀 Quick Setup (10 minutes)

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New project"
5. Fill in:
   - Project name: `seo-guide-creator`
   - Database password: (generate a strong one)
   - Region: Choose closest to your users
6. Click "Create new project"

### 2. Get Your API Keys

Once project is created:
1. Go to Settings → API
2. Copy these values:
   - `Project URL` (looks like: https://xxxxxxxxxxxx.supabase.co)
   - `anon public` key (safe for frontend)

### 3. Update Your Code

Edit `js/supabase-client.js`:
```javascript
const SUPABASE_URL = 'your-project-url-here';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 4. Create Database Tables

1. In Supabase dashboard, click "SQL Editor"
2. Click "New query"
3. Copy all content from `supabase/schema.sql`
4. Paste and click "Run"

### 5. Configure Authentication

1. Go to Authentication → Settings
2. Under "Site URL", add your domain:
   - For local: `http://localhost:8000`
   - For production: `https://addhass.github.io/seo-guide-creator`
3. Under "Redirect URLs", add:
   - `http://localhost:8000/dashboard.html`
   - `https://addhass.github.io/seo-guide-creator/dashboard.html`

### 6. Enable Email Auth

1. Go to Authentication → Providers
2. Make sure "Email" is enabled
3. Configure email templates (optional)

## 🧪 Test Your Setup

1. Open `auth.html` in your browser
2. Try signing up with an email
3. Check your email for verification
4. Sign in and access dashboard

## 🔐 Security Checklist

- [ ] Row Level Security (RLS) is enabled on all tables
- [ ] API keys are never exposed in frontend code
- [ ] Authentication is required for all protected routes
- [ ] CORS is configured properly

## 🚨 Important Notes

1. **Never commit your Supabase keys to Git**
   - Add them to `.gitignore`
   - Use environment variables in production

2. **Free Tier Limits**
   - 500MB database
   - 50,000 monthly active users
   - 2GB bandwidth

3. **Encryption**
   - Current setup uses basic encryption
   - For production, implement proper AES-256 encryption

## 📝 Environment Variables

For production deployment, set these in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key (for server-side)
```

## 🆘 Troubleshooting

### "User not authenticated" error
- Check if user is logged in
- Verify JWT token hasn't expired

### Can't save API keys
- Check RLS policies are created
- Verify user is authenticated
- Check browser console for errors

### Email not sending
- Check email settings in Supabase
- Verify SMTP configuration
- Check spam folder

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Auth Helpers](https://supabase.com/docs/guides/auth)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript/introduction)