const express = require("express");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const dotenv = require("dotenv").config();
const port = process.env.PORT;
const userRouter = require("./routes/userRoute");
const bodyParser = require("body-parser");

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', userRouter);

app.listen(port, ()=>{
    console.log(`App running on port ${port}`)
});

module.exports = app;