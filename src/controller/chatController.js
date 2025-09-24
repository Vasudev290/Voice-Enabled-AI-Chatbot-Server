const fetch = require("node-fetch");
const Chat = require("../models/Chat");

const sendMessage = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: "No message provided" });

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key not configured.",
      });
    }

    // Use env var or default to correct, supported model
    const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    // Gemini endpoint with correct model and key in query param
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful AI assistant for a voice chatbot. Keep responses short and engaging. User: ${message}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error(
        "❌ Gemini Error Details:",
        JSON.stringify(errData, null, 2)
      );

      const errorMessage = errData.error?.message || "Unknown error";
      const errorCode = errData.error?.code || "";
      const errorStatus = errData.error?.status || "";

      // Enhanced key error handling
      if (
        response.status === 400 ||
        errorCode === 400 ||
        errorMessage.includes("API Key not found") ||
        errorMessage.includes("API_KEY_INVALID")
      ) {
        return res.status(500).json({
          message:
            "Invalid Gemini API key (400). Regenerate a new key at aistudio.google.com (delete old one first). Ensure no spaces in .env. Test with curl: curl 'https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_NEW_KEY'",
        });
      }
      if (
        response.status === 404 ||
        errorMessage.includes("not found") ||
        errorMessage.includes("not supported")
      ) {
        return res.status(500).json({
          message: `Model "${GEMINI_MODEL}" not found (404). Switch to "gemini-1.0-pro" in .env and restart.`,
        });
      }
      if (response.status === 403 || errorMessage.includes("quota")) {
        return res.status(500).json({
          message:
            "Gemini quota exceeded. Check limits at aistudio.google.com.",
        });
      }
      if (response.status === 429 || errorMessage.includes("rate_limit")) {
        return res.status(500).json({
          message: "Gemini rate limit (15 RPM). Wait 1 minute.",
        });
      }
      if (response.status === 401 || errorMessage.includes("API key")) {
        return res.status(500).json({
          message:
            "Unauthorized (401). Regenerate API key at aistudio.google.com.",
        });
      }

      return res.status(500).json({
        message: "Gemini API error",
        details: errorMessage,
      });
    }

    const data = await response.json();

    let botText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "No response generated.";

    if (!botText || botText.length < 5) {
      botText = "That's a good question! Tell me more about it.";
    }

    botText = botText
      .replace(`User: ${message}`, "")
      .replace(/^\s+/, "")
      .trim();

    const chat = new Chat({
      userId: req.user._id,
      query: message,
      response: botText,
    });
    await chat.save();

    res.json({
      response: botText,
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Server:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({
      createdAt: 1,
    });
    res.json({ chats });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ message: "Failed to fetch chat history", error: error.message });
  }
};

module.exports = { sendMessage, getHistory };
