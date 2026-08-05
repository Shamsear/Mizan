# 🚀 Deploy Runway to Production

Quick guide to deploy your fully-functional expense tracker app.

---

## ✅ Pre-Deploy Checklist

### Verify Locally
```bash
# 1. Install dependencies
npm install

# 2. Verify TypeScript
npx tsc --noEmit
# Should show: Exit Code: 0

# 3. Build production
npm run build
# Should complete without errors

# 4. Test production build
npm run start
# Open http://localhost:3000 and test
```

### What to Test
- [ ] Sign up flow works
- [ ] Onboarding completes
- [ ] Transactions save/load
- [ ] Quick-add works
- [ ] Edit transaction works
- [ ] Charts display
- [ ] Works offline (disable network in DevTools)

---

## 🔑 Environment Variables

### Required (Clerk)
You need these from https://dashboard.clerk.com

```env
# .env.local (for development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

**Note:** Already set if app is working locally. Vercel will need these too.

---

## 📦 Deploy to Vercel (Recommended)

### Why Vercel?
- Zero config for Next.js
- Automatic HTTPS
- Edge functions
- Free tier available
- Git integration
- Preview deployments

### Steps

#### 1. Push to GitHub (if not already)
```bash
git init
git add .
git commit -m "Initial commit - Runway v1.0"
git branch -M main
git remote add origin https://github.com/yourusername/runway.git
git push -u origin main
```

#### 2. Connect to Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js

#### 3. Configure Environment Variables
In Vercel project settings:
- Go to "Settings" → "Environment Variables"
- Add:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- Copy values from your `.env.local`

#### 4. Deploy
- Click "Deploy"
- Wait ~2 minutes
- Your app is live! 🎉

#### 5. Configure Clerk
In Clerk dashboard:
1. Go to "Domains"
2. Add your Vercel domain (e.g., `runway.vercel.app`)
3. Update redirect URLs if needed

---

## 🌐 Alternative Platforms

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Railway
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add environment variables
5. Deploy

### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch
fly launch

# Add secrets
fly secrets set CLERK_SECRET_KEY=sk_test_xxxxx
```

---

## 🔒 Security Checklist

### Before Going Live
- [ ] Environment variables in deployment platform (NOT in code)
- [ ] `.env.local` in `.gitignore` ✅ (already is)
- [ ] Clerk domain configured for production URL
- [ ] HTTPS enabled ✅ (automatic with Vercel)
- [ ] No hardcoded secrets in code ✅

---

## 📱 Post-Deploy Testing

### Test in Production
1. **Sign up with real email**
2. **Complete onboarding**
3. **Add transactions**
4. **Test on mobile device**
5. **Install as PWA** (Add to Home Screen)
6. **Test offline mode** (airplane mode)

### Check These
- [ ] Clerk auth works on production domain
- [ ] Transactions persist after page refresh
- [ ] Safe-to-Spend calculates correctly
- [ ] Charts render properly
- [ ] PWA installs on mobile
- [ ] Offline mode works

---

## 🎨 Optional: Add PWA Icons

### Current State
- Manifest configured ✅
- Service worker registered ✅
- Icons are placeholders ⚠️

### Design Icons
You need:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable.png` (512x512 with safe zone)
- `favicon.ico` (32x32)

### Where to Design
- **Figma** - Design tool
- **Canva** - Easy templates
- **RealFaviconGenerator** - Generate all sizes

### Update Manifest
In `src/app/manifest.ts`:
```typescript
icons: [
  {
    src: '/icon-192.png',  // Update these paths
    sizes: '192x192',
    type: 'image/png',
  },
  // ... etc
]
```

---

## 📊 Monitoring (Optional)

### Vercel Analytics
- Automatic in Vercel dashboard
- Page views, performance, errors

### Custom Analytics
Add to `src/app/layout.tsx`:
```typescript
// Google Analytics
<Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX" />

// Plausible (privacy-friendly)
<Script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js" />
```

### Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check TypeScript locally
npx tsc --noEmit

# Check for missing dependencies
npm install

# Clear cache
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Clerk Auth Not Working
- Check environment variables are set in Vercel
- Verify Clerk domain matches deployment URL
- Check redirect URLs in Clerk dashboard

### Database Not Persisting
- IndexedDB works in all modern browsers
- Check browser console for errors
- Verify no IndexedDB errors in production

---

## 🎉 You're Live!

### Share Your App
- [ ] Add custom domain (Vercel settings)
- [ ] Share link with beta testers
- [ ] Post on social media
- [ ] Submit to Product Hunt (optional)

### Gather Feedback
- Google Forms
- Typeform
- Embedded feedback widget

### Iterate
- Monitor user behavior
- Fix bugs quickly
- Add requested features
- Keep shipping! 🚢

---

## 📈 Growth Checklist

### Week 1
- [ ] Deploy to production
- [ ] Test with 5-10 beta users
- [ ] Fix critical bugs
- [ ] Add custom domain

### Month 1
- [ ] Design and add PWA icons
- [ ] Set up analytics
- [ ] Write user documentation
- [ ] Add privacy policy

### Month 2
- [ ] Add unit tests
- [ ] Set up CI/CD
- [ ] Implement cloud sync (optional)
- [ ] Add dark mode (optional)

### Month 3+
- [ ] Scale based on user feedback
- [ ] Add requested features
- [ ] Optimize performance
- [ ] Consider monetization

---

## 🎯 Success Metrics

### Key Performance Indicators
- **User Adoption**: Daily/Monthly active users
- **Engagement**: Transactions logged per user per day
- **Retention**: D1, D7, D30 retention rates
- **Feature Usage**: Most used quick-add chips
- **PWA Install**: Installation rate

### Track in Vercel Analytics
- Page views
- Unique visitors
- Session duration
- Bounce rate

---

## 📞 Support

### If You Get Stuck

**Vercel Issues**
- Vercel docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord

**Clerk Issues**
- Clerk docs: https://clerk.com/docs
- Clerk Discord: https://clerk.com/discord

**Next.js Issues**
- Next.js docs: https://nextjs.org/docs
- Next.js Discord: https://nextjs.org/discord

---

## 🚢 Final Words

Your app is **production-ready**. All features work. The only thing left is to click "Deploy" and get it in front of users!

**Don't wait for perfection.** Ship now, iterate based on real feedback.

### Quick Deploy Command
```bash
# If using Vercel CLI
vercel --prod
```

That's it! Your expense tracker is live and helping people spend money without anxiety. 🎊

**Good luck and happy shipping! 🚀**
