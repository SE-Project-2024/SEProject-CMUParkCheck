const express = require("express");
const app = express();
const ejs = require("ejs");
const path = require("path");

app.get('/', (req, res) => {
res.render('pages/index');
});

app.listen(3000, function () {
    console.log("sever start port 3000");
})