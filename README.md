# 🎙️ AI Voice Chatbot Backend

## 📌 Overview
This is the **backend server** for an **AI Voice Chatbot**.  
It enables users to chat with an AI assistant (powered by **Google Gemini API**) via text or voice.  
The backend handles:
- User authentication (JWT)
- Chat message processing
- AI-powered responses
- Chat history storage in MongoDB



## ⚡ Features
- 🔐 **User Authentication** (Register/Login with JWT tokens)  
- 🤖 **AI Chat** (Gemini API integration)  
- 💾 **Chat History** per user  
- 📦 **MongoDB storage** (Atlas or local)  
- 🔊 **Voice-ready** (Frontend handles TTS/STT)  



## 🛠️ Tech Stack
- **Node.js** + **Express.js**  
- **MongoDB** (Mongoose ODM)  
- **JWT** (jsonwebtoken)  
- **Bcrypt.js** (password hashing)  
- **Google Gemini API** (free tier: 15 RPM, 1M tokens/day)  
- **dotenv**, **nodemon**  


