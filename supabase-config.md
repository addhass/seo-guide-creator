# Supabase Authentication Configuration

## For GitHub Pages Deployment

Once GitHub Pages is enabled, add these URLs to your Supabase project:

### 1. Go to Authentication Settings
https://supabase.com/dashboard/project/jdqdfejuesqbcxjwbcwl/auth/url-configuration

### 2. Site URL
```
https://addhass.github.io/seo-guide-creator
```

### 3. Redirect URLs (add all of these)
```
https://addhass.github.io/seo-guide-creator/auth.html
https://addhass.github.io/seo-guide-creator/dashboard.html
https://addhass.github.io/seo-guide-creator/product-guide-builder-modular.html
```

### 4. Additional Settings (if needed)
- Enable Email Confirmations: Optional (for production, recommended)
- Enable Email Change Confirmations: Optional
- Secure Email Change: Enabled (default)

## For Local Development (optional)

If you also want to test locally, add these as well:
```
http://localhost:3000
http://localhost:3000/auth.html
http://localhost:3000/dashboard.html
```

## Testing the Setup

After configuring:
1. Visit: https://addhass.github.io/seo-guide-creator/auth.html
2. Try signing up with an email
3. You should be redirected to the dashboard after successful signup
4. Add your API keys in the dashboard
5. Return to the main app to use it with your own keys!

## Important Notes
- GitHub Pages can take 5-10 minutes to activate initially
- The site URL should show a green checkmark at: https://github.com/addhass/seo-guide-creator/settings/pages
- If you see 404 errors, wait a few more minutes for GitHub to deploy