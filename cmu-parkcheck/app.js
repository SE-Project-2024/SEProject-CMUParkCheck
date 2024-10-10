const express = require("express");
const app = express();
const ejs = require("ejs");
const path = require("path");
const mysql = require("mysql2");
const multer = require ("multer");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Kard_1539",
    database: "cmu_parkcheck"
});

connection.connect((err) => {
    if (err){
        console.error("Error connecting to database:", err.stack);
        return;
    }
    console.log("Connected to MySQL database");
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now()+'-' + file.originalname);
    }
});
const upload = multer({ dest: 'uploads/'});

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('pages/landing');
});

app.get('/index', function(req, res) {
    res.render('pages/index');
});

app.get('/admin-manage-parking',function(req,res){
    res.render('pages/admin-manage-parking')
});

app.post('/admin/update-status/:id', (req, res) => {
    const complaintId = req.params.id;
    const newStatus = req.body.status;

    const sql = 'UPDATE complaints SET status = ? WHERE id = ?';
    connection.query(sql, [newStatus, complaintId], (err, result) => { // เปลี่ยน db เป็น connection
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Status updated successfully' });
    });
});


app.get('/complaints-dashboard', function(req, res) {
    const query = 'SELECT * FROM complaints'; 
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            return res.status(500).send('Server Error');
        }
        res.render('pages/complaints-dashboard', { rows: results });
    });
});

app.get('/admin-complaints-dashboard', function(req, res) {
    const query = 'SELECT * FROM complaints'; 
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            return res.status(500).send('Server Error');
        }
        console.log('Complaints fetched:', results); // Add this line to inspect the data
        console.log(results);
        res.render('pages/admin-complaints-dashboard', { rows: results });
    });
});


app.get('/complaints-dashboard', function(req, res) {
    const query = `
        SELECT complaints.*, complaint_files.filename 
        FROM complaints 
        LEFT JOIN complaint_files 
        ON complaints.id = complaint_files.complaint_id
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching complaints and files:', err);
            return res.status(500).send('Server Error');
        }
        res.render('pages/complaints-dashboard', { rows: results });
        console.log(results)
    });
});
app.get('/admin-complaints-dashboard', function(req, res) {
    const query = `
        SELECT complaints.*, complaint_files.filename 
        FROM complaints 
        LEFT JOIN complaint_files 
        ON complaints.id = complaint_files.complaint_id
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching complaints and files:', err);
            return res.status(500).send('Server Error');
        }
        res.render('pages/admin-complaints-dashboard', { rows: results });
        console.log(results)
    });
});


app.get('/complaints', (req, res) => {
    const query = 'SELECT name FROM parking_areas';
    
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching parking areas:', err);
        return res.status(500).send('Server Error');
      }
      
      // Render complaints form and pass the parking areas to the view
      res.render('pages/complaints', { parkingAreas: results });
    });
  });
  app.get('/complaints-dashboard', function(req, res) {
    res.render('pages/complaints-dashboard');
});

app.get('/api/feeconnectionack/:parkingAreaId', (req, res) => {
    const parkingAreaId = req.params.parkingAreaId;
    const query = `
        SELECT positive_feeconnectionack, COUNT(*) AS count, MAX(visit_time) AS latest_feeconnectionack_time 
        FROM feeconnectionack 
        WHERE parking_area_id = ? 
        GROUP BY positive_feeconnectionack
    `;
    connection.query(query, [parkingAreaId], (error, results) => {
        if (error) throw error;
        const feeconnectionack = { likes: 0, dislikes: 0 };
        results.forEach(row => {
            if (row.positive_feeconnectionack) {
                feeconnectionack.likes = row.count;
            } else {
                feeconnectionack.dislikes = row.count;
            }
        });
        if (results.length > 0) {
            feeconnectionack.latestFeeconnectionackTime = results[0].latest_feeconnectionack_time;
        }
        res.json(feeconnectionack);
    });
});

app.post('/api/feeconnectionack', (req, res) => {
    const { parkingAreaId, positiveFeeconnectionack } = req.body;
    connection.query('INSERT INTO feeconnectionack (parking_area_id, visit_time, positive_feeconnectionack) VALUES (?, NOW(), ?)', [parkingAreaId, positiveFeeconnectionack], (error, results) => {
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
app.get('/api/nearby-parking', (req, res) => {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude){
        return res.status(400).json({ error: "Missing latitude or longitude"});
    }
    const maxDistance = 0.15;

    const query = `
    SELECT DISTINCT id, name, latitude, longitude, ( 6371 * acos( cos( radians(?) ) * cos(radians( latitude )) * cos( radians( longitude ) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
    FROM parking_areas
    HAVING distance < ?
    ORDER by distance`;

    connection.query(query, [latitude, longitude, latitude, maxDistance], (err, results) => {
        if(err){
            console.error("Error fetching nearby areas: ", err);
            return res.status(500).json({ error: "Internal Server Error"});
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
app.post('/api/feeconnectionack', (req, res) => {
    const { parking_area_id, visit_time, positive_feeconnectionack } = req.body;
    const query = "INSERT INTO feeconnectionack (parking_area_id, visit_time, positive_feeconnectionack) VALUES (?, ?, ?)";
    connection.query(query, [parking_area_id, visit_time, positive_feeconnectionack], (err, results) => {
        if (err){
            console.error("Error executing query:", err);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
        res.json({ success: true});
    });
});
function saveLocation(parkingId, latitude, longitude){
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO saved_parking_locations (parking_area_id, latitude, longitude, saved_at) VALUES (?, ?, ?, NOW())";
        connection.query(query, [parkingId, latitude, longitude], (err) => {
            if(err){
                return reject(err);
            }
            console.log(`Saving location: ${parkingId}, ${latitude}, ${longitude}`);
            resolve();
        });
    });
}

app.post('/api/save-parking-location', (req, res) => {
    const { parkingId, latitude, longitude } = req.body;

    saveLocation(parkingId, latitude, longitude)
    .then(() => res.json({ success: true}))
    .catch(err => res.status(500).json({error: 'Failed to save location'}));
});

app.post('/upload', upload.array('filename[]'), (req, res) => {
    const parkingArea = req.body.parkingArea;
    const issue = req.body.issue;
    const files = req.files;

    if(!parkingArea || !issue){
        return res.status(400).send('Parking Area and issue are required.');
    }
    const ref_number = Math.floor(100000 + Math.random() * 900000);
    const query = `INSERT INTO complaints (parking_area, issue, ref_number, created_at) VALUES (?, ?, ?, NOW())`;
    connection.query(query, [parkingArea, issue, ref_number], (err, result) => {
        if (err) {
            console.error('Error inserting complaint: ', err);
            return res.status(500).send('Failed to submit complaint');
        }

        const complaintId = result.insertId;

        // If there are uploaded files, save them in the database
        if (files && files.length > 0) {
            const fileValues = files.map(file => [complaintId, file.filename]);

            const fileQuery = `INSERT INTO complaint_files (complaint_id, filename) VALUES ?`;
            connection.query(fileQuery, [fileValues], (err) => {
                if (err) {
                    console.error('Error saving file information: ', err);
                    return res.status(500).send('Failed to upload files');
                }

                return res.json({success: true, message: 'Complaint submitted successfully with files.', ref_number: ref_number});
            });
        } else {
            return res.json({success: true, message: 'Complaint submitted successfully without files. Reference Number.', ref_number: ref_number});
        }
    });
});

const PORT = 3000;
app.listen(PORT, function () {
    console.log(`Server started on port ${PORT}`);
    console.log("http://localhost:3000/");
});