const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Router = require("./apps/config/routes")
const setupCron = require("./apps/cronJob/cronJob"); // Jo file aapne di thi, uska path
const { setupCronJobs, updateCabinStatus } = require("./apps/cronJob/cabinCron"); // Import the setup function
const {
    createDailyHealthSnapshot, setupHealthSnapshotCron } = require("./apps/cronJob/healthcron"); // Import the setup function

setupCronJobs();
setupCron();
setupHealthSnapshotCron();
createDailyHealthSnapshot();
updateCabinStatus();

const app = express();
const logger = require("morgan");
require('dotenv').config();

const port = 8000;
const host = '0.0.0.0';
app.use(bodyParser.urlencoded({ limit: '5000mb', extended: false }));
app.use(bodyParser.json({ limit: '5000mb' }));
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(logger('dev'));

app.get('/', (req, res) => {
    res.send("Welcome");
});


app.use('/uploads', express.static('./uploads'));
app.use('/api/admin', Router);

app.get('/api/ping', (req, res) => {
    res.status(200).send('pong');
});



app.use((req, res) => {
    res.status(404).json({
        message: 'Invalid Url',
        error: true,
        success: false,
        status: '0',
    });

});


app.listen(port, host, () => {
    console.log(`server is running on http://${host}:${port}`)
});


