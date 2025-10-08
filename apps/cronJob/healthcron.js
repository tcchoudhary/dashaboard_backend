const cron = require('node-cron');
const { Op, DataTypes } = require('sequelize');
const moment = require('moment-timezone');
// ⚠️ IMPORTANT: Replace these paths with your actual model imports
const Cabin = require('../models/Cabin');
const DeviceHealthStatus = require('../models/Health');

// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

// --- Health Status Options ALIGNED with your API Error Message ---
// These are NOT counted as faults by your API
const NON_FAULTY_STATUSES = ['OK', 'Working', 'GOOD', "NORMAL"];
// These ARE counted as faults by your API
const FAULTY_STATUSES = ['Faulty', 'Not Working', 'LOW'];

/**
 * Function to get a random status with a realistic bias towards NON-FAULTY statuses.
 * (Logic remains the same: 85-95% chance of being Non-Faulty)
 */
function getRandomHealthStatus(highBias = 0.85) {
    const r = Math.random();

    // Chance for a Non-Faulty Status (85% to 95% chance, depending on component)
    if (r < highBias) {
        // Randomly pick one of the three non-faulty states
        return NON_FAULTY_STATUSES[Math.floor(Math.random() * NON_FAULTY_STATUSES.length)];
    }

    // Chance for a Faulty Status (15% to 5% chance)
    else {
        // Randomly pick one of the two faulty states
        return FAULTY_STATUSES[Math.floor(Math.random() * FAULTY_STATUSES.length)];
    }
}

/**
 * Runs nightly to create a daily snapshot of the health status for all 40 cabins.
 */
async function createDailyHealthSnapshot() {
    console.log(`\n--- Running Daily Device Health Snapshot at ${moment().format('YYYY-MM-DD HH:mm:ss')} IST ---`);

    try {
        const today = moment().format('YYYY-MM-DD');
        const cabins = await Cabin.findAll();

        // CRITICAL CHECK 1: Ensure we found exactly 40 cabins
        if (cabins.length !== 40) {
            console.error(`FAILURE: Expected to find exactly 40 cabins, but found ${cabins.length}. Skipping insertion.`);
            return;
        }

        // STEP 1: DELETE ALL EXISTING RECORDS 
        console.log('Cleaning DeviceHealthStatus table...');
        await DeviceHealthStatus.destroy({
            where: {},
            truncate: true
        });
        console.log('DeviceHealthStatus table cleaned successfully. ✅');

        // STEP 2: GENERATE AND INSERT NEW RECORDS
        const healthEntries = [];

        for (const cabin of cabins) {
            const complexId = cabin.complex_id;
            const userType = cabin.user_type;
            const cabinType = cabin.cabin_type;

            // --- Health Status Generation (Using new status strings) ---
            const healthStatus = {
                // Higher bias for generally reliable components (e.g., 90-95% chance of GOOD/OK/Working)
                flushHealth: getRandomHealthStatus(0.90),
                fanHealth: getRandomHealthStatus(0.85),
                lightHealth: getRandomHealthStatus(0.95),
                lockHealth: getRandomHealthStatus(0.88),
                odsHealth: getRandomHealthStatus(0.90),

                // Lower bias for components that fail/clog more often (e.g., 80-82% chance of GOOD/OK/Working)
                floorCleanHealth: getRandomHealthStatus(0.80), // 👈 Specific field mentioned by user
                tapHealth: getRandomHealthStatus(0.82),
                airDryerHealth: getRandomHealthStatus(0.80),
                chokeHealth: getRandomHealthStatus(0.92),
            };

            const entry = {
                cabin_id: cabin.id,
                CLIENT: `Client${complexId}`,
                CITY: 'Gwalior',
                STATE: 'MP',

                // Health Fields (Now using OK, Working, Faulty, Not Working, GOOD)
                flushHealth: healthStatus.flushHealth,
                floorCleanHealth: healthStatus.floorCleanHealth,
                fanHealth: healthStatus.fanHealth,
                lightHealth: healthStatus.lightHealth,
                lockHealth: healthStatus.lockHealth,
                odsHealth: healthStatus.odsHealth,

                // Other Fields
                freshWaterLevel: (Math.random() * (95 - 10) + 10).toFixed(0),
                recycleWaterLevel: (Math.random() * 25).toFixed(0),
                tapHealth: healthStatus.tapHealth,
                airDryerHealth: healthStatus.airDryerHealth,
                chokeHealth: healthStatus.chokeHealth,
                lockStatus: Math.random() < 0.85 ? 'Unlocked' : 'Locked',
                ThingName: `${userType} ${cabinType}`,
                SHORT_THING_NAME: cabin.cabin_name,
                created_at: today,
            };

            healthEntries.push(entry);
        }

        // CRITICAL CHECK 2: Double check the generated array size before insertion
        if (healthEntries.length !== 40) {
            console.error(`FATAL ERROR: Generated entries count is ${healthEntries.length}, not 40. Canceling insertion.`);
            return;
        }

        // Insert exactly 40 records
        await DeviceHealthStatus.bulkCreate(healthEntries);
        console.log(`Successfully created new health snapshot for exactly ${healthEntries.length} cabins. 📸`);

    } catch (error) {
        console.error('Error creating daily health snapshot:', error);
    }
}

// -----------------------------------------------------------
// 🌟 CRON SCHEDULING 🌟
// -----------------------------------------------------------

/**
 * Sets up the nightly cron job for the DeviceHealthStatus snapshot.
 */
function setupHealthSnapshotCron() {
    console.log('Health Snapshot Cron initialized. Scheduled for 11:59 PM IST daily. 🌙');

    // Cron Job: Runs every day at 11:59 PM (23:59 IST)
    cron.schedule('59 23 * * *', () => {
        console.log('\n--- Nightly Health Snapshot Triggered by Cron ---');
        createDailyHealthSnapshot().catch(err => console.error('Health Snapshot Cron Error:', err));
    });
}

module.exports = {
    createDailyHealthSnapshot,
    setupHealthSnapshotCron
};