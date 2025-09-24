const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config()


const app = express();


//Database Connection
const MONGO_URI = process.env.MONGO_DB_URL_CONNECTION;
const connectDB = async () => {
  await mongoose.connect(MONGO_URI);
};
//Database Connected
connectDB()
  .then(() => {
    console.log("MongoDB Connected Successfully! 🚀🚀");
    //Listen server
    app.listen(process.env.PORT, () => {
      console.log(
        `Server started and running on ${process.env.PORT} successfully! 🔥🚀`
      );
    });
  })
  .catch((err) => {
    console.error("Database not connected properly!", err.message);
  });