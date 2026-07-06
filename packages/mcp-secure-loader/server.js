const express = require("express");
const router = require('./routes')
const mongoose = require("mongoose");
const cors = require("cors");

require('dotenv').config();

const { PORT, MONGO_URI} = process.env;

const app = express();

app.use(express.json());
app.use("/",router);
app.use(cors());
/**
 * Code entry point
 */
async function startServer(){
    app.listen( PORT , ()=> {
        console.log(`Listening to port ${PORT}`)
    }
    );
    mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.error(err);
    });
}

/**
 * Start server
 */
startServer();