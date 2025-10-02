# 🚀 Render Deployment Guide

This guide will help you deploy both your backend and frontend on Render.com (free tier).

## Prerequisites

- ✅ GitHub repository: `https://github.com/thidakhon/CodeSense-project.git`
- ✅ Render.com account (sign up at https://render.com)
- ✅ OpenAI API key (get from https://platform.openai.com/api-keys)

## Deployment Steps

### Step 1: Deploy Using Blueprint (Easiest - Deploys Both Services)

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Click "New +"** → **"Blueprint"**

3. **Connect GitHub Repository**:
   - If not connected, click "Connect GitHub"
   - Select your repository: `thidakhon/CodeSense-project`
   - Render will automatically detect the `render.yaml` file

4. **Review Services**:
   - You should see 2 services:
     - `codesense-backend` (Web Service)
     - `codesense-frontend` (Static Site)

5. **Click "Apply"**

6. **Set Required Environment Variables**:
   - For `codesense-backend`:
     - `OPENAI_API_KEY`: Your OpenAI API key (required)
     - All other variables are pre-configured

7. **Wait for Deployment** (~5-10 minutes):
   - Backend will deploy first
   - Frontend will deploy after backend is ready
   - You'll see "Live" status when ready

8. **Get Your URLs**:
   - Backend: `https://codesense-backend.onrender.com`
   - Frontend: `https://codesense-frontend.onrender.com`

### Step 2: Update CORS Settings (If Needed)

If you get CORS errors, update the backend's `CLIENT_ORIGIN`:

1. Go to your backend service in Render
2. Click **"Environment"** tab
3. Update `CLIENT_ORIGIN` to your frontend URL
4. Save (will trigger redeploy)

## Alternative: Manual Deployment

### Deploy Backend Manually

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `codesense-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   NODE_VERSION=18.0.0
   OPENAI_API_KEY=your-openai-api-key-here
   JWT_SECRET=your-random-secret-key
   PORT=10000
   CLIENT_ORIGIN=*
   OPENAI_MODEL=gpt-4o-mini
   AI_PROVIDER=openai
   USE_MOCK=false
   USE_FALLBACK_ON_ERROR=true
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   OPENAI_MAX_RETRIES=3
   OPENAI_RETRY_BASE_MS=3000
   ```

6. Click **"Create Web Service"**
7. Copy your backend URL

### Deploy Frontend Manually

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `codesense-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. Add Environment Variable:
   - `VITE_API_BASE`: Your backend URL (e.g., `https://codesense-backend.onrender.com`)

6. Click **"Create Static Site"**

## Important Notes

### Free Tier Limitations

- **Spin Down**: Services spin down after 15 minutes of inactivity
- **Cold Start**: First request after spin down takes 30-60 seconds
- **Database**: SQLite data is lost on redeploy (ephemeral filesystem)
- **Hours**: 750 hours/month per service

### Database Consideration

Your backend uses SQLite which stores data in `backend/data.sqlite`. On Render's free tier:
- ⚠️ Data is **lost** when the service redeploys or restarts
- For persistent data, consider:
  - Upgrading to a paid plan with persistent disk
  - Using Render's PostgreSQL (free tier available)
  - Using an external database service

### Updating Your Deployment

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push

# Render will automatically redeploy both services
```

## Troubleshooting

### Backend Issues

**503 Service Unavailable**
- Normal for free tier after inactivity
- Wait 30-60 seconds for cold start

**CORS Errors**
- Update `CLIENT_ORIGIN` in backend environment variables
- Should match your frontend URL exactly

**Build Failures**
- Check logs in Render dashboard
- Verify `package.json` has all dependencies
- Ensure Node version is 18+

### Frontend Issues

**API Connection Failed**
- Verify `VITE_API_BASE` environment variable
- Should match your backend URL exactly
- Check backend is running (visit backend URL)

**404 on Page Refresh**
- Should be handled by `routes` in `render.yaml`
- For manual deployment, add rewrite rule in Render dashboard

**Build Failures**
- Check build logs
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

## Testing Your Deployment

1. Visit your frontend URL: `https://codesense-frontend.onrender.com`
2. Wait for backend to wake up (if it was sleeping)
3. Try the chat functionality
4. Check browser console for errors

## Environment Variables Summary

### Backend
```
OPENAI_API_KEY=sk-your-key-here (REQUIRED)
JWT_SECRET=auto-generated
CLIENT_ORIGIN=https://codesense-frontend.onrender.com
PORT=10000
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
```

### Frontend
```
VITE_API_BASE=https://codesense-backend.onrender.com
```

## Cost

**100% FREE** for personal projects!
- Backend: 750 hours/month
- Frontend: Unlimited bandwidth (100GB/month)
- Both services on free tier

---

🎉 **Your app is now live on Render!**

Frontend: `https://codesense-frontend.onrender.com`
Backend: `https://codesense-backend.onrender.com`
