const express = require("express");
const app = express();
const ejs = require("ejs");
const path = require("path");

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.get('/', (req, res) => {
    res.render('pages/index');
});


const PORT = 3000;
app.listen(3000, function () {
    console.log(`Server started on port ${PORT}`);
    console.log("http://localhost:3000/ (home page)");

})