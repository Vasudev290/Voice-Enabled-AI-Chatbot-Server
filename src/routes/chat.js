const express = require("express");
const { sendMessage, getHistory } = require("../controller/chatController");
const { userAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", userAuth, sendMessage);
router.get("/history", userAuth, getHistory);

module.exports = router;
