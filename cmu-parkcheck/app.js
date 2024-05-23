const express = require("express");
const app = express();
const ejs = require("ejs");
const path = require("path");
const mysql = require("mysql");
const { connect } = require("http2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Jireh410.",
    database: "cmu_parkcheck"
});

connection.connect((err) => {
    if (err){
        console.error("Error connecting to database:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('pages/index');
});

app.get('/api/parking-areas', (req, res) => {
    const query = "Select * FROM parking_areas";
    connect.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query: ", err);
            res.status(500).json({error: "Internal Server Error"});
            return;
        }
        res.json(results);
    });
});

app.post('/api/feedback', (req, res) => {
    const { parking_area_id, visit_time, positive_feedback } = req.body;
    const query = "INSERT INTO feedback (parking_area_id, visit_time, posiitve_feedback) VALUES (?, ?, ?)";
    connection.query(query, [parking_area_id, visit_time, positive_feedback], (err, results) => {
        if (err){
            console.error("Error executing query:", err);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
        res.json({ success: true});
    });
});


const PORT = 3000;
app.listen(3000, function () {
    console.log(`Server started on port ${PORT}`);
    console.log("http://localhost:${PORT}/ (home page)");

});