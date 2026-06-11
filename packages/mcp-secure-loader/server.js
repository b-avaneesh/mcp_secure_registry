const express = require("express");
const router = require('./routes')
require('dotenv').config();

const PORT = process.env.PORT || 7777;

const app = express();

app.use(express.json());
app.use("/",router);
app.listen( PORT , ()=> {
    console.log(`Listening to port ${PORT}`)
}
);