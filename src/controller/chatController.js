const Groq = require("groq-sdk");
const Chat = require("../models/Chat");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const sendMessage = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: "No message provided" });

  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        message: "Groq API key not configured. Please add GROQ_API_KEY to your .env file",
      });
    }

    // Current available Groq models (as of 2024)
    const availableModels = [
      "llama-3.1-8b-instant",      
      "llama-3.1-70b-versatile",   
      "mixtral-8x7b-32768",        
      "gemma2-9b-it"               
    ];

    const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    
    // Validate model choice
    if (!availableModels.includes(GROQ_MODEL)) {
      return res.status(400).json({
        message: `Invalid model specified. Available models: ${availableModels.join(", ")}`,
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for a voice chatbot. Keep responses short, engaging, and conversational (under 100 words). Respond in a friendly tone suitable for voice interaction."
        },
        {
          role: "user",
          content: message
        }
      ],
      model: GROQ_MODEL,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 0.8,
      stream: false,
    });

    let botText = completion.choices[0]?.message?.content?.trim() || "No response generated.";

    if (!botText || botText.length < 5) {
      botText = "That's an interesting question! Could you tell me more about what you're looking for?";
    }

    const chat = new Chat({
      userId: req.user._id,
      query: message,
      response: botText,
    });
    await chat.save();

    res.json({
      response: botText,
      chatId: chat._id,
      modelUsed: GROQ_MODEL
    });
  } catch (error) {
    console.error("Groq API Error:", error);

    // Enhanced error handling for Groq specific errors
    if (error.status === 400) {
      if (error.error?.code === 'model_decommissioned') {
        return res.status(400).json({
          message: "The selected model is no longer available. Please update GROQ_MODEL in your .env file to one of: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it",
          details: error.error.message
        });
      }
      return res.status(400).json({
        message: "Invalid request to Groq API",
        details: error.error?.message || "Please check your request parameters"
      });
    }
    
    if (error.status === 401) {
      return res.status(500).json({
        message: "Invalid Groq API key. Please check your GROQ_API_KEY in the .env file and ensure it's correct.",
        details: "You can get a free API key from https://console.groq.com"
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({
        message: "Rate limit exceeded. Groq has usage limits. Please try again in a few moments.",
        details: "Free tier has rate limits. Consider upgrading if you need higher limits."
      });
    }
    
    if (error.status === 404) {
      return res.status(500).json({
        message: "Model not found. The specified Groq model is not available.",
        details: error.error?.message || "Please check the model name in your .env file"
      });
    }

    // Generic error
    res.status(500).json({ 
      message: "Server error while processing your request",
      error: error.message 
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({
      createdAt: -1, 
    }).limit(50); 
    
    res.json({ 
      chats,
      total: chats.length
    });
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    res.status(500).json({ 
      message: "Failed to fetch chat history", 
      error: error.message 
    });
  }
};

// Optional: Add a models endpoint to check available models
const getAvailableModels = async (req, res) => {
  try {
    const availableModels = [
      { 
        id: "llama-3.1-8b-instant", 
        name: "Llama 3.1 8B Instant", 
        description: "Fast and efficient for real-time applications",
        max_tokens: 8192 
      },
      { 
        id: "llama-3.1-70b-versatile", 
        name: "Llama 3.1 70B Versatile", 
        description: "More capable model for complex tasks",
        max_tokens: 8192 
      },
      { 
        id: "mixtral-8x7b-32768", 
        name: "Mixtral 8x7B", 
        description: "Mixture of Experts model with large context",
        max_tokens: 32768 
      },
      { 
        id: "gemma2-9b-it", 
        name: "Gemma 2 9B", 
        description: "Google's lightweight model",
        max_tokens: 8192 
      }
    ];
    
    res.json({ models: availableModels });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching model information", 
      error: error.message 
    });
  }
};

module.exports = { sendMessage, getHistory, getAvailableModels };