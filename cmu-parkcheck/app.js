const express = require("express");
const app = express();
const ejs = require("ejs");
const path = require("path");
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Jireh410.",
    database: "cmu_parkcheck"
});

connection.connect((err) => {
    if (err){
        console.error("Error connecting to database:", err.stack);
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

app.get('/api/feedback/:parkingAreaId', (req, res) => {
    const parkingAreaId = req.params.parkingAreaId;
    const query = `
        SELECT positive_feedback, COUNT(*) AS count, MAX(visit_time) AS latest_feedback_time 
        FROM feedback 
        WHERE parking_area_id = ? 
        GROUP BY positive_feedback
    `;
    connection.query(query, [parkingAreaId], (error, results) => {
        if (error) throw error;
        const feedback = { likes: 0, dislikes: 0 };
        results.forEach(row => {
            if (row.positive_feedback) {
                feedback.likes = row.count;
            } else {
                feedback.dislikes = row.count;
            }
        });
        if (results.length > 0) {
            feedback.latestFeedbackTime = results[0].latest_feedback_time;
        }
        res.json(feedback);
    });
});

app.post('/api/feedback', (req, res) => {
    const { parkingAreaId, positiveFeedback } = req.body;
    connection.query('INSERT INTO feedback (parking_area_id, visit_time, positive_feedback) VALUES (?, NOW(), ?)', [parkingAreaId, positiveFeedback], (error, results) => {
        console.log(req.body);
        if (error) throw error;
        res.status(201).json({ success: true, timestamp: new Date().toISOString() });

    });
});

app.get('/parking-details/:id', (req, res) => {
    const parking_area_id = req.params.id;
    const query = "SELECT id, name, google_maps_link FROM parking_areas WHERE id = ?";
    connection.query(query, [parking_area_id], (err, results) =>{
        if (err){
            console.error("Error fetching parking area details: ", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        if (results.length === 0){
            res.status(404).send("Parking area not found");
                return;
            }
            const parkingArea = results[0];
            console.log(parkingArea);
            res.render('pages/parking-details', { parkingArea });
        });
    });
app.get('/api/parking_areas', (req, res) => {
    const query = "SELECT * FROM parking_areas";
    connection.query(query, (err, results) => {
        if (err){
            console.error("Error fetching parking areas:", err);
            res.status(500).json({ error: "Internal Server Error"});
            return;
        }
        res.json(results);
    });
});
app.get('/api/buildings/:input', (req, res) => {
    const input = req.params.input;
    const query = `
        SELECT * FROM buildings
        WHERE name LIKE ? OR building_code LIKE ?
        `;
    connection.query(query, [`%${input}%`, `%${input}%`], (error, results) => {
        if (error){
            console.error("Error fetching buildings:", error);
            return res.status(500).json({ error: "Internal Server Error"});
        }
        if (results.length === 0){
            return res.status(404).json({error: "Building not found"});
        }
        const building = results[0];
        res.json(building);
    });
});
app.post('/api/feedback', (req, res) => {
    const { parking_area_id, visit_time, positive_feedback } = req.body;
    const query = "INSERT INTO feedback (parking_area_id, visit_time, positive_feedback) VALUES (?, ?, ?)";
    connection.query(query, [parking_area_id, visit_time, positive_feedback], (err, results) => {
        if (err){
            console.error("Error executing query:", err);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
        res.json({ success: true});
    });
});

app.post('/api/save-parking-location', (req, res) => {
    const { parkingId, latitude, longitude } = req.body;

    saveLocation(parkingId, latitude, longitude)
    .then(() => res.json({ success: true}))
    .catch(err => res.status(500).json({error: 'Failed to save location'}));
});


const PORT = 3000;
app.listen(PORT, function () {
    console.log(`Server started on port ${PORT}`);
    console.log("http://localhost:3000/");
});