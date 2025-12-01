const { Op } = require('sequelize');
const UsageProfile = require('../models/UsageProfile');
const Cabin = require('../models/Cabin');
const moment = require('moment-timezone');
const UsageAndFeedback = require('../models/UsageAndFeedback');

// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

// --- Configuration ---
const DAYS_TO_SEED = 90; // Last 90 Days
const minEntriesPerSite = 20; // 20 * 10 Sites = 200 Min Users/Day
const maxEntriesPerSite = 40; // 40 * 10 Sites = 400 Max Users/Day
const cabinTypes = ['MUW', 'MWC', 'FWC', 'PWC'];
const startHour = 9; // 9 AM
const endHour = 20; // 8 PM
const totalWorkingMinutes = (endHour - startHour) * 60; // 660 Minutes window

// --- Helper: Dynamic Ratios (Same as Cron) ---
function getDailyCabinRatios() {
    const rawMWC = Math.random() * (0.55 - 0.15) + 0.15;
    const rawMUW = Math.random() * (0.55 - 0.20) + 0.20;
    const rawFWC = Math.random() * (0.25 - 0.07) + 0.07;
    const rawPWC = Math.random() * (0.10 - 0.00) + 0.00;
    const totalRaw = rawMWC + rawMUW + rawFWC + rawPWC;

    return {
        MWC: rawMWC / totalRaw,
        MUW: rawMUW / totalRaw,
        FWC: rawFWC / totalRaw,
        PWC: rawPWC / totalRaw
    };
}

async function seedHistory() {
    console.log(`🚀 Starting Historical Seed for past ${DAYS_TO_SEED} days...`);

    // Loop backwards from 90 days ago up to yesterday (Day 1 ago)
    for (let d = DAYS_TO_SEED; d >= 1; d--) {
        const targetDate = moment().subtract(d, 'days');
        const dateString = targetDate.format('YYYY-MM-DD');

        console.log(`\n📅 Processing Date: ${dateString} (Day -${d})`);

        // Loop through all 10 complexes
        for (let complex = 1; complex <= 10; complex++) {

            // 1. Determine Target for this Site on this specific Day
            const dailyTarget = Math.floor(Math.random() * (maxEntriesPerSite - minEntriesPerSite + 1)) + minEntriesPerSite;
            const dailyRatios = getDailyCabinRatios();
            const dailyMoodFactor = (Math.random() * 0.2) - 0.1; // Feedback variation

            // 2. Fetch Cabins
            const cabins = await Cabin.findAll({ where: { complex_id: complex } });
            if (cabins.length !== 4) continue;

            // 3. Distribute Entries based on Ratios
            let entriesPerCabin = {};
            let sumOfBaseEntries = 0;

            for (let cabinType of cabinTypes) {
                const baseEntries = Math.round(dailyTarget * dailyRatios[cabinType]);
                entriesPerCabin[cabinType] = baseEntries;
                sumOfBaseEntries += baseEntries;
            }

            // Fix rounding errors
            let difference = dailyTarget - sumOfBaseEntries;
            if (difference !== 0) {
                const primaryType = dailyRatios.MWC > dailyRatios.MUW ? 'MWC' : 'MUW';
                entriesPerCabin[primaryType] = Math.max(0, entriesPerCabin[primaryType] + difference);
            }

            // 4. Generate Data
            const bulkUsage = [];
            const bulkFeedback = [];

            for (let cabin of cabins) {
                const cabinType = cabin.cabin_name.slice(0, 3).replace(/\d+$/, '');
                const typeKey = cabinTypes.find(t => cabin.cabin_name.startsWith(t));
                if (!typeKey) continue;

                const count = entriesPerCabin[typeKey] || 0;

                for (let i = 0; i < count; i++) {
                    // --- Time Logic for History ---
                    // Random minute between 9 AM (0) and 8 PM (660)
                    const randomMinuteOffset = Math.floor(Math.random() * totalWorkingMinutes);

                    const entryTime = targetDate.clone().set({ hour: startHour, minute: 0, second: 0 }).add(randomMinuteOffset, 'minutes');

                    const minDuration = typeKey === 'MUW' ? 1 : 3;
                    const maxDuration = typeKey === 'MUW' ? 5 : 12;
                    const randomDuration = Math.floor(Math.random() * (maxDuration - minDuration + 1) + minDuration);

                    const exitTime = entryTime.clone().add(randomDuration, 'minutes');
                    const durationSeconds = randomDuration * 60;
                    const floorCleanFlag = Math.random() > 0.8 ? 1 : 0;

                    // --- Feedback Logic (3.5 - 4.7) ---
                    const feedbackProvided = Math.random() < 0.45;
                    let averageFeedback = null;

                    if (feedbackProvided) {
                        let rawRating = Math.random() * (4.7 - 3.5) + 3.5;
                        rawRating += dailyMoodFactor;
                        if (rawRating < 3.5) rawRating = 3.5;
                        if (rawRating > 4.7) rawRating = 4.7;
                        averageFeedback = rawRating.toFixed(1);
                    }

                    // --- Entry Objects ---
                    bulkUsage.push({
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
                        Preflush: typeKey !== 'MUW' ? 1 : 0,
                        Fullflush: typeKey !== 'MUW' ? 1 : (Math.random() > 0.8 ? 1 : 0),
                        Floorclean: floorCleanFlag,
                        Manualflush: 0,
                        Miniflush: 0,
                        Airdryer: 0,
                        RFID: `RFID${Math.random().toString(36).slice(2)}`,
                        feedback: averageFeedback ? averageFeedback.toString() : 'N/A',
                        Entrytype: 'simulated',
                        Entry_TIME: entryTime.toDate(),
                        Exit_TIME: exitTime.toDate(),
                        Amountcollected: typeKey === 'PWC' ? 0 : Math.floor(Math.random() * 6 + 5),
                        Amountremaining: 0,
                        created_at: entryTime.toDate() // Important for history
                    });

                    bulkFeedback.push({
                        cabin_id: cabin.id,
                        CLIENT: `Client${complex}`,
                        TotalWaterRecycled: '0',
                        TotalUsage: durationSeconds.toString(),
                        ttl: entryTime.unix(), // Use historical timestamp
                        Lon: (78.15 + Math.random() * 0.1).toFixed(4).toString(),
                        NH3concentration: (Math.random() * 5).toFixed(2).toString(),
                        COconcentration: (Math.random() * 10).toFixed(2).toString(),
                        SHORT_THING_NAME: cabin.cabin_name,
                        ShortThingName: cabin.cabin_name,
                        SendToDevic: 'True',
                        Fanhealth: Math.random() > 0.95 ? 'Low' : 'High',
                        Lat: (26.21 + Math.random() * 0.1).toFixed(4).toString(),
                        INITIATED: 'Manually',
                        IsDeviceStolen: 'False',
                        version_code: 101,
                        SendToAws: 'True',
                        Floorcleanhealth: floorCleanFlag ? 'High' : (Math.random() > 0.95 ? 'Low' : 'High'),
                        Freshwaterlevel: (Math.random() * 40 + 60).toFixed(0).toString(),
                        Lighthealth: Math.random() > 0.95 ? 'Low' : 'High',
                        LuminosityStatus: Math.random() > 0.5 ? 'Day' : 'Night',
                        ThingName: `${cabin.user_type} ${cabin.cabin_type}`,
                        AverageFeedback: averageFeedback,
                        Recyclewaterlevel: (Math.random() * 20).toFixed(0).toString(),
                        COMPLEX: `Complex${complex}`,
                        THING_NAME: `${cabin.user_type} ${cabin.cabin_type}`,
                        CH4concentration: (Math.random() * 2).toFixed(2).toString(),
                        Flushhealth: Math.random() > 0.95 ? 'Low' : 'High',
                        created_at: entryTime.toDate() // Important for history
                    });
                }
            }

            // Bulk Insert for Speed
            if (bulkUsage.length > 0) await UsageProfile.bulkCreate(bulkUsage);
            if (bulkFeedback.length > 0) await UsageAndFeedback.bulkCreate(bulkFeedback);

            // console.log(`   Complex ${complex}: Inserted ${bulkUsage.length} entries.`);
        }
    }

    console.log('\n✅ Historical Data Seeding Completed Successfully!');
    process.exit(0);
}

// Run the function
seedHistory().catch(err => {
    console.error('Seeding Error:', err);
    process.exit(1);
});