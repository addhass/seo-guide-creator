# Account System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Browser                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐   │
│  │   Landing   │───▶│  Auth Pages  │───▶│   SEO Tool App    │   │
│  │    Page     │    │  Login/Signup│    │  (Protected)      │   │
│  └─────────────┘    └──────────────┘    └────────────────────┘   │
│         │                   │                      │               │
└─────────┼───────────────────┼────────────────────┼───────────────┘
          │                   │                    │
          ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐   │
│  │  Static     │    │   Auth API   │    │   Tool API        │   │
│  │  Assets     │    │  Functions   │    │   Functions       │   │
│  └─────────────┘    └──────────────┘    └────────────────────┘   │
│                             │                      │               │
└─────────────────────────────┼────────────────────┼───────────────┘
                              │                    │
                              ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Supabase                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐   │
│  │   Users     │    │  API Keys    │    │    Sessions       │   │
│  │   Table     │    │  (Encrypted) │    │    (JWT)          │   │
│  └─────────────┘    └──────────────┘    └────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     External APIs                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                        ┌────────────────────┐    │
│  │ DataForSEO  │                        │    Anthropic      │    │
│  │    API      │                        │     (Claude)      │    │
│  └─────────────┘                        └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Flow

### 1. User Registration
```
User ──▶ Sign Up Form ──▶ Supabase Auth ──▶ Email Verification ──▶ Account Created
```

### 2. API Key Storage
```
User API Key ──▶ Client Encryption ──▶ HTTPS ──▶ Server Validation ──▶ AES-256 Encryption ──▶ Database
```

### 3. API Key Usage
```
Tool Request ──▶ JWT Validation ──▶ Fetch Encrypted Keys ──▶ Decrypt in Memory ──▶ External API Call ──▶ Response
```

## 💾 Data Models

### Users Table
```javascript
{
  id: "uuid",
  email: "user@example.com",
  password_hash: "bcrypt_hash",
  email_verified: true,
  created_at: "2024-01-20T10:00:00Z",
  subscription_tier: "free", // for future use
  settings: {
    preferred_language: "en",
    timezone: "UTC"
  }
}
```

### API Keys Table
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  service: "dataforseo", // or "anthropic"
  encrypted_key: "AES256_encrypted_string",
  key_hint: "...3a7f", // last 4 chars
  is_valid: true,
  last_validated: "2024-01-20T10:00:00Z",
  created_at: "2024-01-20T10:00:00Z"
}
```

### Usage Tracking (Optional)
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  action: "generate_guide",
  timestamp: "2024-01-20T10:00:00Z",
  details: {
    keywords_analyzed: 30,
    competitors_found: 15,
    guide_length: 2500
  }
}
```

## 🔄 User Journey

### New User Flow
1. **Lands on homepage** → Sees "Free Forever" message
2. **Clicks "Sign Up Free"** → Simple email/password form
3. **Verifies email** → Click link in email
4. **First login** → Onboarding wizard
5. **Add API keys** → Secure form with help links
6. **Use tool** → Everything works with their keys

### Returning User Flow
1. **Visit tool** → Auto-redirect to login if not authenticated
2. **Login** → Email/password
3. **Dashboard** → See saved keys (masked)
4. **Use tool** → Keys automatically loaded
5. **Logout** → Session cleared

## 🛡️ Security Measures

### 1. Password Security
- Minimum 8 characters
- bcrypt with salt rounds = 10
- Password strength indicator
- Breach detection (HaveIBeenPwned API)

### 2. API Key Security
- Never sent to client in plain text
- AES-256-GCM encryption
- Unique IV per key
- Keys decrypted only in memory
- Auto-clear after use

### 3. Session Security
- JWT with 24-hour expiry
- Refresh tokens (7 days)
- HttpOnly cookies
- Secure flag in production
- CSRF protection

### 4. Rate Limiting
- Auth endpoints: 5 attempts per minute
- API endpoints: 100 requests per minute
- Progressive delays on failures

## 🚀 Deployment Strategy

### Phase 1: MVP (Week 1-2)
- Basic auth (email/password)
- API key storage
- Simple dashboard
- Core tool integration

### Phase 2: Enhancements (Week 3-4)
- Password reset
- Email notifications
- Usage tracking
- Better UI/UX

### Phase 3: Scale (Month 2+)
- Team accounts
- OAuth providers
- Advanced analytics
- Premium features

## 📊 Database Queries

### Common Operations
```sql
-- Get user's API keys (app server)
SELECT service, key_hint, last_validated 
FROM api_keys 
WHERE user_id = ? AND is_valid = true;

-- Validate user session
SELECT u.id, u.email, s.expires_at 
FROM users u 
JOIN sessions s ON u.id = s.user_id 
WHERE s.token_hash = ? AND s.expires_at > NOW();

-- Usage statistics
SELECT DATE(timestamp) as date, COUNT(*) as usage_count 
FROM usage_tracking 
WHERE user_id = ? AND timestamp > NOW() - INTERVAL '30 days' 
GROUP BY DATE(timestamp);
```

## 🎯 Success Metrics

- **Week 1**: Working auth system
- **Week 2**: 50 beta users signed up
- **Month 1**: 500 active users
- **Month 3**: 2,000 active users
- **Month 6**: 10,000 active users

## 💰 Cost Projections

### At 1,000 Users
- Supabase: $0 (free tier)
- Vercel: $0 (free tier)
- Total: $0/month

### At 10,000 Users
- Supabase: $25/month
- Vercel: $20/month
- Total: $45/month

### At 50,000 Users
- Supabase: $399/month
- Vercel: $150/month
- Total: $549/month