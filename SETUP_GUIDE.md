# Setup Guide for Product Description Guide

## Prerequisites

1. Node.js and npm installed
2. DataForSEO account with API credentials
3. Anthropic Claude API key
4. Supabase project with service role key

## Server Setup

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# DataForSEO API Credentials
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_password_here

# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Supabase Configuration
SUPABASE_URL=https://jdqdfejuesqbcxjwbcwl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Server Configuration
PORT=3001
```

### 3. Start the Server

```bash
npm start
# or
node cors-proxy-server.js
```

## Authentication Setup

The system supports two methods for API keys:

### Method 1: Environment Variables (Quick Setup)
- Add your API keys to the `.env` file as shown above
- This is good for testing and development

### Method 2: User Dashboard (Production)
- Users can add their own API keys through the dashboard
- Keys are stored encrypted in Supabase
- Each user has their own set of API keys

## Troubleshooting

### Error: "Anthropic API key not configured"

This error occurs when:
1. No API key is found in the environment variables
2. User hasn't added their API key in the dashboard
3. Authentication to Supabase failed

**Solutions:**
1. Check that `.env` file exists and contains `ANTHROPIC_API_KEY`
2. Ensure the server was restarted after adding the .env file
3. Check server logs for authentication errors
4. Verify Supabase service role key is correct

### Error: "Keyword analysis failed: 400"

This error occurs when:
1. DataForSEO credentials are missing
2. TSV data format is incorrect
3. Required columns (Keyword, Search Volume) are not found

**Solutions:**
1. Add DataForSEO credentials to `.env`:
   ```env
   DATAFORSEO_LOGIN=your_email
   DATAFORSEO_PASSWORD=your_password
   ```
2. Ensure TSV file has proper columns:
   - "Keyword" or "Primary Keyword"
   - "Search Volume" or column containing "MSV"
3. Check server logs for specific column parsing errors

### Authentication Debugging

To debug authentication issues:

1. Check server logs for auth details:
   ```
   Auth header received: Yes/No
   User verified: user@email.com
   API keys fetched: ['dataforseo', 'anthropic']
   ```

2. Use the test endpoint:
   ```bash
   curl -X POST http://localhost:3001/test-api-key \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"service": "anthropic", "apiKey": "test-key"}'
   ```

3. Open `test-auth-debug.html` in a browser to test authentication flow

### Server Logs

The server provides detailed logging:
- 🔍 Analyzing TSV keyword data...
- 📊 Header columns found: [0]="Keyword", [1]="Search Volume"
- 📋 Parsed X keywords
- 🎯 Selected top 30 keywords by search volume

## Common Issues

### CORS Errors
- Ensure the server is running on port 3001
- Check that frontend is configured to use `http://localhost:3001`

### Supabase Authentication
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check that the key has proper permissions
- Ensure Supabase project is active

### API Rate Limits
- DataForSEO has rate limits - check your account limits
- Claude API has token and request limits
- Implement proper error handling for rate limit errors

## Testing

1. Test individual components:
   ```bash
   # Test authentication
   open test-auth-debug.html
   
   # Test complete system
   node tests/test-complete-system.js
   
   # Test guide generator
   node tests/test-guide-generator.js
   ```

2. Check API connectivity:
   - DataForSEO: Should return SERP results
   - Claude API: Should generate analysis
   - Supabase: Should fetch user API keys

## Production Deployment

For production deployment:
1. Use environment variables from your hosting provider
2. Enable HTTPS for secure API key transmission
3. Set up proper CORS origins (not localhost)
4. Use production Supabase keys
5. Monitor API usage and costs