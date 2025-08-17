const { connect } = require("mongoose");
const { config } = require("dotenv");
config();

module.exports = function connectDB() {
  try {
    connect(process.env.MONGO_URI);
    console.log("Server connecting succesfully");
  } catch (error) {
    console.log("Server connnecting error", error);
  }
};
