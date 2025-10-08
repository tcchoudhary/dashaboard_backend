const cron = require('node-cron');
const { Op } = require('sequelize');
const Cabin = require('../models/Cabin'); // Assuming Cabin model is in the current directory or imported correctly
const moment = require('moment-timezone');

// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

// --- Constants for Status Update ---
// Max percentage of cabins that can go offline/have issues (e.g., 5 out of 40 total cabins)
const MAX_AFFECTED_PERCENT = 15; 
const TOTAL_SITES = 10;
const CABINS_PER_SITE = 4;
const TOTAL_CABINS = TOTAL_SITES * CABINS_PER_SITE;

// List of possible "unhealthy" statuses and their probabilities
const unhealthyStatuses = [
    { status: 'OFFLINE', probability: 0.35 },        // Most severe: 35% chance
    { status: 'Low data network', probability: 0.45 }, // Common network issue: 45% chance
    { status: 'Working', probability: 0.20 }         // Ambiguous status, might mean maintenance/testing: 20% chance
];
// ------------------------------------

/**
 * Runs every morning to simulate real-world connection status changes for IoT devices.
 */
async function updateCabinStatus() {
    console.log(`\n--- Running Connection Status Update at ${moment().format('YYYY-MM-DD HH:mm:ss')} IST ---`);

    try {
        // 1. First, set all cabins back to ONLINE to simulate daily maintenance/reboot.
        // This ensures the offline status is random each day, not cumulative.
        await Cabin.update(
            { connection_status: 'ONLINE' },
            { where: { connection_status: { [Op.ne]: 'ONLINE' } } }
        );
        console.log('All cabins reset to ONLINE status.');

        // 2. Determine how many cabins will be affected today (realistic variation)
        const maxAffected = Math.floor(TOTAL_CABINS * (MAX_AFFECTED_PERCENT / 100)); // Max 15% (e.g., 6 cabins)
        // Choose a random number of affected cabins between 1 and the max limit
        const numAffected = Math.floor(Math.random() * maxAffected) + 1; 
        
        console.log(`Simulating issues for ${numAffected} out of ${TOTAL_CABINS} cabins today.`);

        // 3. Get all cabin IDs to select a random subset
        const allCabinIds = await Cabin.findAll({ attributes: ['id'] });
        
        if (allCabinIds.length === 0) {
            console.log('No cabins found to update.');
            return;
        }

        // Randomly select 'numAffected' unique cabin IDs
        const shuffledIds = allCabinIds.sort(() => 0.5 - Math.random());
        const cabinsToAffect = shuffledIds.slice(0, numAffected).map(c => c.id);

        let totalUpdates = 0;

        // 4. Update the status for the randomly selected cabins
        for (const cabinId of cabinsToAffect) {
            // Randomly select a new unhealthy status based on probability
            let randomStatus = 'OFFLINE';
            const rand = Math.random();
            let cumulativeProbability = 0;

            for (const item of unhealthyStatuses) {
                cumulativeProbability += item.probability;
                if (rand < cumulativeProbability) {
                    randomStatus = item.status;
                    break;
                }
            }
            
            // Update the selected cabin's status
            await Cabin.update(
                { connection_status: randomStatus },
                { where: { id: cabinId } }
            );
            console.log(`-> Cabin ID ${cabinId} set to: ${randomStatus}`);
            totalUpdates++;
        }

        console.log(`Status update complete. ${totalUpdates} cabins are now in a non-ONLINE state. ⚠️`);

    } catch (error) {
        console.error('Error updating cabin status:', error);
    }
}

// Function to set up both cron jobs
function setupCronJobs() {
    // Cron Job 1: Daily Connection Status Update (Runs every day at 9:00 AM IST)
    // Runs before the usage generation starts to establish daily connectivity baseline.
    cron.schedule('0 9 * * *', () => {
        updateCabinStatus().catch(err => console.error('Connection status cron error:', err));
    });

    // Run once immediately (optional, good for testing initial state)
    updateCabinStatus().catch(err => console.error('Initial status update error:', err));
}

module.exports = { setupCronJobs, updateCabinStatus };