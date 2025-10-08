const cron = require('node-cron');
const { Op } = require('sequelize');
const UsageProfile = require('../models/UsageProfile'); // Assuming this is your original log table
const Cabin = require('../models/Cabin');
const moment = require('moment-timezone');
const UsageAndFeedback = require('../models/UsageAndFeedback');

// const UsageAndFeedback = {
//     create: async (data) => {
//         // In a real application, this would insert into the database.
//         // For simulation, we just log and return a mock object.
//         return { id: Math.floor(Math.random() * 100000) }; 
//     },
// };
// ----------------------------------------------------------------------


// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

const dailyTracking = {};

// Ratios for cabins per day
const cabinRatios = {
    MUW: 0.50,
    MWC: 0.27,
    FWC: 0.17,
    PWC: 0.06,
};

// Constants
const minEntriesPerSite = 30;
const maxEntriesPerSite = 50;
const cabinTypes = ['MUW', 'MWC', 'FWC', 'PWC'];
const startHour = 9; // 9 AM IST
const endHour = 20; // 8 PM IST

// Function to seed cabins
async function seedCabins() {
    for (let complex = 1; complex <= 10; complex++) {
        const existing = await Cabin.count({ where: { complex_id: complex } });
        if (existing >= 4) continue;

        await Cabin.bulkCreate([
            { complex_id: complex, cabin_name: `MWC${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'WC', user_type: 'Male', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
            { complex_id: complex, cabin_name: `FWC${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'WC', user_type: 'Female', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
            { complex_id: complex, cabin_name: `PWC${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'WC', user_type: 'PD', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
            { complex_id: complex, cabin_name: `MUW${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'URINAL', user_type: 'Male', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
        ]);
    }
    console.log('Cabins seeded successfully. 🏡');
}


function getTargetEntriesUpToNow(dailyTarget) {
    const now = moment();
    const todayStart = moment().startOf('day').add(startHour, 'hours');
    const todayEnd = moment().startOf('day').add(endHour, 'hours');

    if (now.isBefore(todayStart)) return 0;
    if (now.isAfter(todayEnd)) return dailyTarget;

    const totalWorkingMinutes = todayEnd.diff(todayStart, 'minutes');
    const elapsedWorkingMinutes = now.diff(todayStart, 'minutes');

    // Proportional target calculation
    const proportionalTarget = (elapsedWorkingMinutes / totalWorkingMinutes) * dailyTarget;

    // Adding small random integer offset for non-linear generation
    const randomOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1

    return Math.max(0, Math.round(proportionalTarget + randomOffset));
}

// Function to generate and insert entries into BOTH tables
async function generateEntries() {
    const now = moment();
    const today = now.format('YYYY-MM-DD');
    const todayStart = moment().startOf('day').add(startHour, 'hours'); // 9 AM IST
    const todayEnd = moment().startOf('day').add(endHour, 'hours'); // 8 PM IST

    // Check if outside the 9 AM - 8 PM working window
    if (now.isBefore(todayStart) || now.isAfter(todayEnd.clone().add(30, 'minutes'))) {
        console.log('Outside working hours (9 AM - 8 PM IST). Skipping entry generation. 😴');
        return;
    }

    // Loop through each complex (site)
    for (let complex = 1; complex <= 10; complex++) {

        // 1. Initialize Daily Target
        if (!dailyTracking[complex] || dailyTracking[complex].lastCheckedDay !== today) {
            const randomTarget = Math.floor(Math.random() * (maxEntriesPerSite - minEntriesPerSite + 1)) + minEntriesPerSite;
            dailyTracking[complex] = {
                target: randomTarget,
                generated: 0,
                lastCheckedDay: today
            };
        }

        const { target: dailyTarget, generated: currentGenerated } = dailyTracking[complex];

        // 2. Determine Entries to Generate
        const requiredEntriesUpToNow = getTargetEntriesUpToNow(dailyTarget);
        let entriesToGenerate = Math.max(0, requiredEntriesUpToNow - currentGenerated);

        if (entriesToGenerate === 0) {
            console.log(`Site ${complex}: Target ${requiredEntriesUpToNow}/${dailyTarget} met for this time slot. Skipping. ✅`);
            continue;
        }

        console.log(`Site ${complex}: Generating ${entriesToGenerate} new entries to meet target ${requiredEntriesUpToNow}/${dailyTarget}... ⏳`);


        // 3. Calculate Cabin Distribution
        const cabins = await Cabin.findAll({ where: { complex_id: complex } });
        if (cabins.length !== 4) continue;

        let entriesPerCabin = {};
        let sumOfBaseEntries = 0;

        for (let cabinType of cabinTypes) {
            const baseEntries = Math.round(entriesToGenerate * cabinRatios[cabinType]);
            const randomVariation = Math.floor(Math.random() * 3) - 1;
            entriesPerCabin[cabinType] = Math.max(0, baseEntries + randomVariation);
            sumOfBaseEntries += entriesPerCabin[cabinType];
        }

        // Adjust MUW to ensure the total equals entriesToGenerate
        const difference = entriesToGenerate - sumOfBaseEntries;
        entriesPerCabin['MUW'] = Math.max(0, entriesPerCabin['MUW'] + difference);

        // 4. Generate and Persist Entries (Dual Insertion)
        for (let cabin of cabins) {
            const cabinType = cabin.cabin_name.slice(0, 3);
            const entriesForThisCabin = entriesPerCabin[cabinType];

            for (let i = 0; i < entriesForThisCabin; i++) {

                // --- Time Generation Logic ---
                const lastUsage = await UsageProfile.findOne({
                    where: { cabin_id: cabin.id, Entry_TIME: { [Op.gte]: todayStart.toDate() } },
                    order: [['Exit_TIME', 'DESC']],
                });

                let lastExit = lastUsage && lastUsage.Exit_TIME ? moment(lastUsage.Exit_TIME) : todayStart.clone();
                if (!lastExit.isValid() || lastExit.isBefore(todayStart)) lastExit = todayStart.clone();

                let baseEntryTime = lastExit.clone().add(Math.floor(Math.random() * 15) + 5, 'minutes');
                let entryTime = baseEntryTime;

                if (entryTime.isAfter(todayEnd)) continue;

                const minDuration = cabinType === 'MUW' ? 1 : 3;
                const maxDuration = cabinType === 'MUW' ? 10 : 20;
                const randomDuration = Math.floor(Math.random() * (maxDuration - minDuration + 1) + minDuration);
                const exitTime = moment(entryTime).add(randomDuration, 'minutes');
                const durationSeconds = randomDuration * 60;
                const floorCleanFlag = Math.random() > 0.8 ? 1 : 0;

                if (!entryTime.isValid() || !exitTime.isValid() || exitTime.isAfter(todayEnd.clone().add(10, 'minutes'))) continue;


                // --- Feedback Logic (3.5 to 5.0, 70% chance) ---
                const feedbackProvided = Math.random() < 0.7;
                let averageFeedback = null;

                if (feedbackProvided) {
                    const minRating = 3.5;
                    const maxRating = 5.0;
                    averageFeedback = (Math.random() * (maxRating - minRating) + minRating).toFixed(1);
                }

                // --- USAGEPROFILE ENTRY (Table 1: Log Data) ---
                const usageEntry = {
                    cabin_id: cabin.id,
                    CLIENT: `Client${complex}`,
                    CITY: 'Gwalior',
                    STATE: 'MP',
                    COMPLEX: `Complex${complex}`,
                    SHORT_THING_NAME: cabin.cabin_name,
                    THING_NAME: `${cabin.user_type} ${cabin.cabin_type}`,
                    Fantime: durationSeconds,
                    Lighttime: durationSeconds,
                    Duration: durationSeconds,
                    Preflush: cabinType !== 'MUW' ? 1 : 0,
                    Fullflush: cabinType !== 'MUW' ? 1 : (Math.random() > 0.8 ? 1 : 0),
                    Floorclean: floorCleanFlag,
                    Manualflush: 0,
                    Miniflush: 0,
                    Airdryer: 0,
                    RFID: `RFID${Math.random().toString(36).slice(2)}`,
                    // For UsageProfile, store score as string or 'N/A'
                    feedback: averageFeedback ? averageFeedback.toString() : 'N/A',
                    Entrytype: 'simulated',
                    Entry_TIME: entryTime.toDate(),
                    Exit_TIME: exitTime.toDate(),
                    Amountcollected: cabinType === 'PWC' ? 0 : Math.floor(Math.random() * 6 + 5),
                    Amountremaining: 0,
                };

                // --- USAGEANDFEEDBACK ENTRY (Table 2: IoT/Summary Data) ---
                const feedbackEntry = {
                    cabin_id: cabin.id,
                    CLIENT: `Client${complex}`,
                    TotalWaterRecycled: '0',
                    TotalUsage: durationSeconds.toString(),
                    ttl: moment().unix(),
                    Lon: (78.15 + Math.random() * 0.1).toFixed(4).toString(),
                    NH3concentration: (Math.random() * 5).toFixed(2).toString(),
                    COconcentration: (Math.random() * 10).toFixed(2).toString(),
                    SHORT_THING_NAME: cabin.cabin_name,
                    ShortThingName: cabin.cabin_name,
                    SendToDevic: 'True',
                    Fanhealth: Math.random() > 0.9 ? 'Low' : 'High',
                    Lat: (26.21 + Math.random() * 0.1).toFixed(4).toString(),
                    INITIATED: 'Manually',
                    IsDeviceStolen: 'False',
                    version_code: 101,
                    SendToAws: 'True',
                    Floorcleanhealth: floorCleanFlag ? 'High' : (Math.random() > 0.9 ? 'Low' : 'High'),
                    Freshwaterlevel: (Math.random() * 90 + 10).toFixed(0).toString(),
                    Lighthealth: Math.random() > 0.9 ? 'Low' : 'High',
                    LuminosityStatus: Math.random() > 0.5 ? 'Day' : 'Night',
                    ThingName: `${cabin.user_type} ${cabin.cabin_type}`,
                    // For UsageAndFeedback, store score as float or null
                    AverageFeedback: averageFeedback,
                    Recyclewaterlevel: (Math.random() * 20).toFixed(0).toString(),
                    COMPLEX: `Complex${complex}`,
                    THING_NAME: `${cabin.user_type} ${cabin.cabin_type}`,
                    CH4concentration: (Math.random() * 2).toFixed(2).toString(),
                    Flushhealth: Math.random() > 0.9 ? 'Low' : 'High',
                };

                // --- Execute Dual Insertion ---
                await UsageProfile.create(usageEntry);
                await UsageAndFeedback.create(feedbackEntry);
                dailyTracking[complex].generated++;

                // console.log(`Dual Entry Created for Site ${complex}/${cabin.cabin_name} | Feedback: ${averageFeedback || 'N/A'}`);
            }
        }

        console.log(`Site ${complex}: Finished. Total generated today: ${dailyTracking[complex].generated}/${dailyTarget}. 👍`);
    }

    console.log('--- Cron execution finished ---');
}

// Function to start cron job
function setupCron() {
    // 1. Seed Cabins on startup
    seedCabins().catch(err => console.error('Seed error:', err));

    // 2. Cron job: Runs every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        console.log(`\n--- Running Cron Job at ${moment().format('YYYY-MM-DD HH:mm:ss')} IST ---`);
        generateEntries().catch(err => console.error('Entry generation error:', err));
    });
}

module.exports = setupCron;









