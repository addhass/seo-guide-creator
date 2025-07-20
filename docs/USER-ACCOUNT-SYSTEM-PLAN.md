# User Account System - Project Plan

## 🎯 Project Overview

Transform SEO Guide Creator into a free SaaS tool where users sign up and securely store their own API keys.

### Goals
- Make the tool free to use (users bring their own API keys)
- Secure storage of user credentials
- Professional account management system
- Scalable architecture for growth

## 🏗️ Architecture Overview

### Tech Stack Recommendation
- **Frontend**: Current (HTML/JS) + React for account pages
- **Backend**: Node.js/Express (current) + Auth endpoints
- **Database**: PostgreSQL (Vercel Postgres or Supabase)
- **Authentication**: JWT tokens + bcrypt
- **API Key Storage**: AES-256 encryption
- **Hosting**: Vercel (Frontend) + Vercel Functions (Backend)

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. **Database Setup**
   - User table (email, password_hash, created_at, etc.)
   - API_keys table (encrypted keys, user_id)
   - Sessions table (JWT management)

2. **Authentication System**
   - Sign up endpoint
   - Login endpoint
   - JWT token generation/validation
   - Password reset flow

3. **Security Implementation**
   - bcrypt for password hashing
   - AES-256 for API key encryption
   - Environment-based encryption keys
   - Rate limiting on auth endpoints

### Phase 2: User Interface (Week 2-3)
1. **Landing Page Update**
   - "Sign Up Free" CTA
   - Benefits of account (save settings, secure keys)
   - Simple pricing: "Free Forever"

2. **Auth Pages**
   - Sign Up form
   - Login form  
   - Forgot Password
   - Email verification

3. **Account Dashboard**
   - API Key management interface
   - Usage statistics (optional)
   - Account settings
   - Billing info (for future premium features)

### Phase 3: Integration (Week 3-4)
1. **API Key Management**
   - Add/Edit/Delete API keys
   - Test connection buttons
   - Masked display (show only last 4 chars)
   - Copy to clipboard functionality

2. **Tool Integration**
   - Modify current tool to check auth
   - Load user's API keys for requests
   - Session management
   - Auto-logout after inactivity

3. **Migration Path**
   - Allow anonymous usage with own keys (current way)
   - Encourage sign up for key storage
   - Import existing local storage settings

### Phase 4: Polish & Launch (Week 4-5)
1. **Security Hardening**
   - Penetration testing
   - OWASP compliance check
   - SSL/TLS verification
   - GDPR compliance

2. **User Experience**
   - Onboarding flow
   - Help documentation
   - API key setup guides
   - Video tutorials

3. **Launch Preparation**
   - Beta testing with 10-20 users
   - Bug fixes
   - Performance optimization
   - Marketing materials

## 🔐 Security Considerations

### API Key Storage
```javascript
// Encryption approach
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY;

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
```

### Database Schema
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL, -- 'dataforseo' or 'anthropic'
    encrypted_key TEXT NOT NULL,
    key_hint VARCHAR(10), -- last 4 characters
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, service)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 💰 Cost Analysis

### Running Costs (Monthly)
- **Vercel**: Free tier (or $20/mo Pro)
- **Database**: 
  - Vercel Postgres: Free tier (good for 10k users)
  - Supabase: Free tier (good for 50k users)
- **Email Service**: 
  - SendGrid: Free tier (100 emails/day)
  - Resend: Free tier (100 emails/day)
- **Total**: $0-20/month initially

### User Costs
- **Free Forever**: Users only pay for their own API usage
- **DataForSEO**: ~$0.003 per keyword
- **Anthropic**: ~$0.015 per guide generated

## 🚀 Implementation Roadmap

### Week 1
- [ ] Set up database (Vercel Postgres/Supabase)
- [ ] Create auth endpoints
- [ ] Implement JWT tokens
- [ ] Build encryption service

### Week 2  
- [ ] Create sign up/login UI
- [ ] Build account dashboard
- [ ] API key management interface
- [ ] Email verification flow

### Week 3
- [ ] Integrate auth with existing tool
- [ ] Modify API calls to use user keys
- [ ] Add session management
- [ ] Create onboarding flow

### Week 4
- [ ] Security testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Beta testing

### Week 5
- [ ] Bug fixes from beta
- [ ] Polish UI/UX
- [ ] Create marketing page
- [ ] Launch! 🎉

## 🎨 UI/UX Mockups Needed

1. **Landing Page**
   - Hero: "Free SEO Content Guide Generator"
   - "Sign Up Free" button
   - Features list
   - "How it works" section

2. **Auth Pages**
   - Clean, modern forms
   - Social login options (future)
   - Clear value proposition

3. **Dashboard**
   - Welcome message
   - API key cards
   - Quick start guide
   - Usage stats (optional)

4. **API Key Management**
   ```
   ┌─────────────────────────────────────┐
   │ DataForSEO API                      │
   │ ••••••••••••••••••••••••••••3a7f   │
   │ [Test] [Edit] [Delete]              │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │ Anthropic API                       │
   │ ••••••••••••••••••••••••••••2b9c   │
   │ [Test] [Edit] [Delete]              │
   └─────────────────────────────────────┘
   
   [+ Add API Key]
   ```

## 📊 Success Metrics

- 100 users in first month
- 80% email verification rate
- <2s page load times
- 99.9% uptime
- Zero security breaches
- 50% of users complete onboarding

## 🔧 Technical Decisions Needed

1. **Database Choice**
   - Vercel Postgres (integrated, easy)
   - Supabase (more features, generous free tier)
   - MongoDB Atlas (NoSQL option)

2. **Auth Library**
   - Build custom (more control)
   - NextAuth.js (if migrating to Next.js)
   - Auth0 (managed solution)

3. **Frontend Framework**
   - Keep vanilla JS (simpler)
   - Add React for account pages only
   - Full migration to Next.js (best DX)

## 🚦 Risk Mitigation

1. **Security Risks**
   - Regular security audits
   - Encryption key rotation
   - Rate limiting
   - Input validation

2. **Scaling Risks**
   - Database connection pooling
   - Caching strategy
   - CDN for static assets
   - Horizontal scaling ready

3. **User Adoption**
   - Clear value proposition
   - Smooth onboarding
   - Excellent documentation
   - Responsive support

## 📈 Future Enhancements

1. **Premium Features** (Phase 2)
   - Team accounts
   - API usage analytics
   - Bulk operations
   - White-label options

2. **Integrations**
   - Zapier/Make
   - WordPress plugin
   - Chrome extension
   - API access

3. **Advanced Features**
   - Scheduled reports
   - Competitor monitoring
   - Historical data
   - A/B testing tools

---

## 🎯 Next Steps

1. **Approve tech stack**
2. **Set up development environment**
3. **Create GitHub issues for each task**
4. **Start with database and auth**
5. **Weekly progress reviews**

**Estimated Timeline**: 4-5 weeks to MVP
**Estimated Cost**: $0-20/month operational
**Estimated Impact**: 10x user growth potential