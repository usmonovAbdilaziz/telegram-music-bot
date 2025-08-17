const express = require("express");
const bodyParser = require("body-parser");
const { config } = require("dotenv");
const { setupBot } = require("./controller/channel.controller");
const connectDB = require("./db/mongo.db");
config();

const PORT = +process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
connectDB();
setupBot();

app.listen(PORT, () => {
  console.log(`🚀 Express server ${PORT}-portda ishga tushdi`);
});
