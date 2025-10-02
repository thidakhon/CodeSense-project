# CodeSense - Local Development

A local chat application for code assistance and programming help.

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
Backend runs on: http://localhost:3002

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

## 📁 Project Structure

```
├── backend/          # Express.js server
│   ├── server.js     # Main server file
│   ├── db.js         # SQLite database
│   └── package.json
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── App.jsx   # Main app component
│   │   ├── api.js    # API client
│   │   └── components/
│   └── package.json
└── README.md
```

## 🔧 Configuration

- **Backend Port**: 3002
- **Frontend Port**: 5173
- **Database**: SQLite (local file)
- **AI Provider**: OpenAI (set OPENAI_API_KEY in backend/.env)

## 📝 Environment Variables

Create `backend/.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## 🎯 Features

- ✅ Code explanation and assistance
- ✅ User authentication
- ✅ Chat history
- ✅ Real-time streaming responses
- ✅ Markdown rendering with syntax highlighting

## 🛠️ Development

Both frontend and backend support hot reloading during development.

- Backend: Uses nodemon for auto-restart
- Frontend: Uses Vite for instant HMR

## 🌐 Deployment

### Deploy to GitHub

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick steps:**
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/codesense-chat.git
git branch -M main
git push -u origin main
```

### Deployment Options

- **GitHub Pages** - Frontend only (static hosting)
- **Render.com** - Full stack (recommended, free tier available)
- **Railway.app** - Full stack with auto-deploy
- **Vercel** - Frontend + separate backend
- **Heroku** - Full stack deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions for each platform.

That's it! Simple local development setup. 🎉