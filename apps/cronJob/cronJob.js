


// const cron = require('node-cron');
// const { Op } = require('sequelize');
// const UsageProfile = require('../models/UsageProfile');
// const Cabin = require('../models/Cabin');
// const moment = require('moment-timezone');
// const UsageAndFeedback = require('../models/UsageAndFeedback');

// // Set timezone to IST
// moment.tz.setDefault('Asia/Kolkata');

// const dailyTracking = {};

// // Constants Updated for 200-400 global range (Per site: 20-40)
// const minEntriesPerSite = 5;
// const maxEntriesPerSite = 12;
// const cabinTypes = ['MUW', 'MWC', 'FWC', 'PWC'];
// const startHour = 9; // 9 AM IST
// const endHour = 19; // 7 PM IST

// // --- HELPER: Generate Dynamic Ratios based on your Image ---
// function getDailyCabinRatios() {
//     // Generate random raw weights based on your image ranges
//     const rawMWC = Math.random() * (0.55 - 0.15) + 0.15; // 15% to 55%
//     const rawMUW = Math.random() * (0.55 - 0.20) + 0.20; // 20% to 55%
//     const rawFWC = Math.random() * (0.25 - 0.07) + 0.07; // 7% to 25%
//     const rawPWC = Math.random() * (0.10 - 0.00) + 0.00; // 0% to 10%

//     const totalRaw = rawMWC + rawMUW + rawFWC + rawPWC;

//     // Normalize so sum equals 1 (100%)
//     return {
//         MWC: rawMWC / totalRaw,
//         MUW: rawMUW / totalRaw,
//         FWC: rawFWC / totalRaw,
//         PWC: rawPWC / totalRaw
//     };
// }

// // Function to seed cabins (Unchanged)
// async function seedCabins() {
//     for (let complex = 1; complex <= 10; complex++) {
//         const existing = await Cabin.count({ where: { complex_id: complex } });
//         if (existing >= 4) continue;

//         await Cabin.bulkCreate([
//             { complex_id: complex, cabin_name: `MWC${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'WC', user_type: 'Male', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
//             { complex_id: complex, cabin_name: `FWC${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'WC', user_type: 'Female', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
//             { complex_id: complex, cabin_name: `PWC${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'WC', user_type: 'PD', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
//             { complex_id: complex, cabin_name: `MUW${complex}`, smartness_level: 'High', date: moment().format('YYYY-MM-DD'), cabin_type: 'URINAL', user_type: 'Male', usage_charge_type: 'COIN', connection_status: 'ONLINE' },
//         ]);
//     }
//     console.log('Cabins seeded successfully. 🏡');
// }

// function getTargetEntriesUpToNow(dailyTarget) {
//     const now = moment();
//     const todayStart = moment().startOf('day').add(startHour, 'hours');
//     const todayEnd = moment().startOf('day').add(endHour, 'hours');

//     if (now.isBefore(todayStart)) return 0;
//     if (now.isAfter(todayEnd)) return dailyTarget;

//     const totalWorkingMinutes = todayEnd.diff(todayStart, 'minutes');
//     const elapsedWorkingMinutes = now.diff(todayStart, 'minutes');

//     // Proportional target calculation
//     const proportionalTarget = (elapsedWorkingMinutes / totalWorkingMinutes) * dailyTarget;

//     // Adding small random integer offset for non-linear generation
//     const randomOffset = Math.floor(Math.random() * 3) - 1;

//     return Math.max(0, Math.round(proportionalTarget + randomOffset));
// }

// // Function to generate and insert entries
// async function generateEntries() {
//     const now = moment();
//     const today = now.format('YYYY-MM-DD');
//     const todayStart = moment().startOf('day').add(startHour, 'hours');
//     const todayEnd = moment().startOf('day').add(endHour, 'hours');

//     // Check if outside working hours
//     if (now.isBefore(todayStart) || now.isAfter(todayEnd.clone().add(30, 'minutes'))) {
//         console.log('Outside working hours (9 AM - 8 PM IST). Skipping entry generation. 😴');
//         return;
//     }

//     // Loop through each complex (site)
//     for (let complex = 1; complex <= 10; complex++) {

//         // 1. Initialize Daily Target & Site Specific Ratios
//         if (!dailyTracking[complex] || dailyTracking[complex].lastCheckedDay !== today) {

//             // TARGET: 20 to 40 per site (Total 200-400 across 10 sites)
//             const randomTarget = Math.floor(Math.random() * (maxEntriesPerSite - minEntriesPerSite + 1)) + minEntriesPerSite;

//             // RATIOS: Calculated dynamically per site/day based on your image
//             const dailyRatios = getDailyCabinRatios();

//             // MOOD: Daily variation for feedback (e.g., -0.1 to +0.1 shift) to prevent flat charts
//             const dailyMoodFactor = (Math.random() * 0.2) - 0.1;

//             dailyTracking[complex] = {
//                 target: randomTarget,
//                 generated: 0,
//                 lastCheckedDay: today,
//                 ratios: dailyRatios,
//                 mood: dailyMoodFactor
//             };
//         }

//         const { target: dailyTarget, generated: currentGenerated, ratios: currentRatios, mood: dailyMood } = dailyTracking[complex];

//         // 2. Determine Entries to Generate
//         const requiredEntriesUpToNow = getTargetEntriesUpToNow(dailyTarget);
//         let entriesToGenerate = Math.max(0, requiredEntriesUpToNow - currentGenerated);

//         if (entriesToGenerate === 0) {
//             // console.log(`Site ${complex}: Target met for now. ✅`);
//             continue;
//         }

//         console.log(`Site ${complex}: Generating ${entriesToGenerate} entries. Target: ${dailyTarget} (Using dynamic ratios)`);

//         // 3. Calculate Cabin Distribution using Dynamic Ratios
//         const cabins = await Cabin.findAll({ where: { complex_id: complex } });
//         if (cabins.length !== 4) continue;

//         let entriesPerCabin = {};
//         let sumOfBaseEntries = 0;

//         for (let cabinType of cabinTypes) {
//             const baseEntries = Math.round(entriesToGenerate * currentRatios[cabinType]);
//             entriesPerCabin[cabinType] = baseEntries;
//             sumOfBaseEntries += baseEntries;
//         }

//         // Adjust to ensure total matches exactly
//         let difference = entriesToGenerate - sumOfBaseEntries;
//         if (difference !== 0) {
//             // Add/Subtract difference to the highest ratio cabin (usually MUW or MWC) to hide the fix
//             const primaryType = currentRatios.MWC > currentRatios.MUW ? 'MWC' : 'MUW';
//             entriesPerCabin[primaryType] = Math.max(0, entriesPerCabin[primaryType] + difference);
//         }

//         // 4. Generate and Persist Entries
//         for (let cabin of cabins) {
//             const cabinType = cabin.cabin_name.slice(0, 3).replace(/\d+$/, ''); // Ensure strict type matching
//             // Match cabinType "MUW" to "MUW" in map, etc.
//             // Assuming cabin_name formats like 'MWC1', 'MUW1'
//             const typeKey = cabinTypes.find(t => cabin.cabin_name.startsWith(t));
//             if (!typeKey) continue;

//             const entriesForThisCabin = entriesPerCabin[typeKey] || 0;

//             for (let i = 0; i < entriesForThisCabin; i++) {

//                 // --- Time Generation Logic ---
//                 // (Logic kept same for realism)
//                 let baseEntryTime = moment().subtract(Math.floor(Math.random() * 30), 'minutes'); // Random time in last 30 mins
//                 if (baseEntryTime.isBefore(todayStart)) baseEntryTime = todayStart.clone().add(Math.random() * 60, 'minutes');

//                 const minDuration = typeKey === 'MUW' ? 1 : 3;
//                 const maxDuration = typeKey === 'MUW' ? 5 : 12; // Adjusted slightly for realism
//                 const randomDuration = Math.floor(Math.random() * (maxDuration - minDuration + 1) + minDuration);
//                 const exitTime = baseEntryTime.clone().add(randomDuration, 'minutes');
//                 const durationSeconds = randomDuration * 60;
//                 const floorCleanFlag = Math.random() > 0.8 ? 1 : 0;

//                 // --- UPDATED FEEDBACK LOGIC (3.5 to 4.7) ---
//                 // Not everyone gives feedback (approx 45% chance)
//                 const feedbackProvided = Math.random() < 0.45;
//                 let averageFeedback = null;

//                 if (feedbackProvided) {
//                     const minRating = 3.5;
//                     const maxRating = 4.7;

//                     // Base Random Rating
//                     let rawRating = Math.random() * (maxRating - minRating) + minRating;

//                     // Apply Daily Mood Factor (makes chart wave-like instead of flat line)
//                     rawRating += dailyMood;

//                     // Clamp values to ensure we don't go below 3.5 or above 4.7 due to mood
//                     if (rawRating < 3.5) rawRating = 3.5;
//                     if (rawRating > 4.7) rawRating = 4.7;

//                     averageFeedback = rawRating.toFixed(1);
//                 }

//                 // --- USAGEPROFILE ENTRY ---
//                 const usageEntry = {
//                     cabin_id: cabin.id,
//                     CLIENT: `Client${complex}`,
//                     CITY: 'Gwalior',
//                     STATE: 'MP',
//                     COMPLEX: `Complex${complex}`,
//                     SHORT_THING_NAME: cabin.cabin_name,
//                     THING_NAME: `${cabin.user_type} ${cabin.cabin_type}`,
//                     Fantime: durationSeconds,
//                     Lighttime: durationSeconds,
//                     Duration: durationSeconds,
//                     Preflush: typeKey !== 'MUW' ? 1 : 0,
//                     Fullflush: typeKey !== 'MUW' ? 1 : (Math.random() > 0.8 ? 1 : 0),
//                     Floorclean: floorCleanFlag,
//                     Manualflush: 0,
//                     Miniflush: 0,
//                     Airdryer: 0,
//                     RFID: `RFID${Math.random().toString(36).slice(2)}`,
//                     feedback: averageFeedback ? averageFeedback.toString() : 'N/A',
//                     Entrytype: 'simulated',
//                     Entry_TIME: baseEntryTime.toDate(),
//                     Exit_TIME: exitTime.toDate(),
//                     Amountcollected: typeKey === 'PWC' ? 0 : Math.floor(Math.random() * 6 + 5),
//                     Amountremaining: 0,
//                 };

//                 // --- USAGEANDFEEDBACK ENTRY ---
//                 const feedbackEntry = {
//                     cabin_id: cabin.id,
//                     CLIENT: `Client${complex}`,
//                     TotalWaterRecycled: '0',
//                     TotalUsage: durationSeconds.toString(),
//                     ttl: moment().unix(),
//                     Lon: (78.15 + Math.random() * 0.1).toFixed(4).toString(),
//                     NH3concentration: (Math.random() * 5).toFixed(2).toString(),
//                     COconcentration: (Math.random() * 10).toFixed(2).toString(),
//                     SHORT_THING_NAME: cabin.cabin_name,
//                     ShortThingName: cabin.cabin_name,
//                     SendToDevic: 'True',
//                     Fanhealth: Math.random() > 0.95 ? 'Low' : 'High', // Less faults
//                     Lat: (26.21 + Math.random() * 0.1).toFixed(4).toString(),
//                     INITIATED: 'Manually',
//                     IsDeviceStolen: 'False',
//                     version_code: 101,
//                     SendToAws: 'True',
//                     Floorcleanhealth: floorCleanFlag ? 'High' : (Math.random() > 0.95 ? 'Low' : 'High'),
//                     Freshwaterlevel: (Math.random() * 40 + 60).toFixed(0).toString(), // Usually fuller (60-100)
//                     Lighthealth: Math.random() > 0.95 ? 'Low' : 'High',
//                     LuminosityStatus: Math.random() > 0.5 ? 'Day' : 'Night',
//                     ThingName: `${cabin.user_type} ${cabin.cabin_type}`,
//                     AverageFeedback: averageFeedback,
//                     Recyclewaterlevel: (Math.random() * 20).toFixed(0).toString(),
//                     COMPLEX: `Complex${complex}`,
//                     THING_NAME: `${cabin.user_type} ${cabin.cabin_type}`,
//                     CH4concentration: (Math.random() * 2).toFixed(2).toString(),
//                     Flushhealth: Math.random() > 0.95 ? 'Low' : 'High',
//                 };

//                 await UsageProfile.create(usageEntry);
//                 await UsageAndFeedback.create(feedbackEntry);
//                 dailyTracking[complex].generated++;
//             }
//         }
//         console.log(`Site ${complex}: Processed. Total Generated Today: ${dailyTracking[complex].generated}/${dailyTarget}`);
//     }
// }

// function setupCron() {
//     seedCabins().catch(err => console.error('Seed error:', err));
//     // Check every 20 minutes to ensure smoother distribution
//     cron.schedule('*/20 * * * *', () => {
//         console.log(`\n--- Running Smart Usage Sim at ${moment().format('YYYY-MM-DD HH:mm:ss')} IST ---`);
//         generateEntries().catch(err => console.error('Entry generation error:', err));
//     });
// }

// module.exports = setupCron;





const cron = require('node-cron');
const { Op } = require('sequelize');
const UsageProfile = require('../models/UsageProfile');
const Cabin = require('../models/Cabin');
const moment = require('moment-timezone');
const UsageAndFeedback = require('../models/UsageAndFeedback');

// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

const dailyTracking = {};

// Constants (Per site: 5–12 daily total)
const minEntriesPerSite = 5;
const maxEntriesPerSite = 12;
const cabinTypes = ['MUW', 'MWC', 'FWC', 'PWC'];
const startHour = 9;
const endHour = 19;

// ------------------ 90 DAY GLOBAL LIMIT ------------------
async function getRemainingQuota90Days() {
    const ninetyDaysAgo = moment().subtract(90, 'days').toDate();

    const total = await UsageProfile.count({
        where: {
            Entry_TIME: {
                [Op.gte]: ninetyDaysAgo
            }
        }
    });

    if (total >= 9000) return { allow: false, remaining: 0, total };
    if (total >= 8000) return { allow: true, remaining: 9000 - total, total };

    return { allow: true, remaining: Infinity, total };
}

// ------------------ RATIOS ------------------
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

// ------------------ SEED CABINS ------------------
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
    console.log('🏡 Cabins seeded');
}

// ------------------ PROPORTIONAL TARGET ------------------
function getTargetEntriesUpToNow(dailyTarget) {
    const now = moment();
    const todayStart = moment().startOf('day').add(startHour, 'hours');
    const todayEnd = moment().startOf('day').add(endHour, 'hours');

    if (now.isBefore(todayStart)) return 0;
    if (now.isAfter(todayEnd)) return dailyTarget;

    const totalWorkingMinutes = todayEnd.diff(todayStart, 'minutes');
    const elapsedWorkingMinutes = now.diff(todayStart, 'minutes');
    const proportionalTarget = (elapsedWorkingMinutes / totalWorkingMinutes) * dailyTarget;
    const randomOffset = Math.floor(Math.random() * 3) - 1;

    return Math.max(0, Math.round(proportionalTarget + randomOffset));
}

// ------------------ MAIN GENERATOR ------------------
async function generateEntries() {

    // 🔒 90 DAY LIMIT CHECK
    const quota = await getRemainingQuota90Days();

    if (!quota.allow) {
        console.log(`🚫 90-day cap reached (${quota.total}). Generation stopped.`);
        return;
    }

    let remainingGlobalQuota = quota.remaining;
    console.log(`📊 90-day count: ${quota.total}, remaining: ${remainingGlobalQuota === Infinity ? '∞' : remainingGlobalQuota}`);

    const now = moment();
    const today = now.format('YYYY-MM-DD');
    const todayStart = moment().startOf('day').add(startHour, 'hours');
    const todayEnd = moment().startOf('day').add(endHour, 'hours');

    if (now.isBefore(todayStart) || now.isAfter(todayEnd.clone().add(30, 'minutes'))) {
        console.log('😴 Outside working hours. Skipping.');
        return;
    }

    for (let complex = 1; complex <= 10; complex++) {

        if (remainingGlobalQuota !== Infinity && remainingGlobalQuota <= 0) break;

        if (!dailyTracking[complex] || dailyTracking[complex].lastCheckedDay !== today) {

            const randomTarget = Math.floor(Math.random() * (maxEntriesPerSite - minEntriesPerSite + 1)) + minEntriesPerSite;
            const dailyRatios = getDailyCabinRatios();
            const dailyMoodFactor = (Math.random() * 0.2) - 0.1;

            dailyTracking[complex] = {
                target: randomTarget,
                generated: 0,
                lastCheckedDay: today,
                ratios: dailyRatios,
                mood: dailyMoodFactor
            };
        }

        const { target, generated, ratios, mood } = dailyTracking[complex];

        const requiredUpToNow = getTargetEntriesUpToNow(target);
        let entriesToGenerate = Math.max(0, requiredUpToNow - generated);

        // 🔒 APPLY GLOBAL LIMIT
        if (remainingGlobalQuota !== Infinity && entriesToGenerate > remainingGlobalQuota) {
            entriesToGenerate = remainingGlobalQuota;
        }

        if (entriesToGenerate === 0) continue;

        const cabins = await Cabin.findAll({ where: { complex_id: complex } });
        if (cabins.length !== 4) continue;

        let entriesPerCabin = {};
        let sum = 0;

        for (let type of cabinTypes) {
            const count = Math.round(entriesToGenerate * ratios[type]);
            entriesPerCabin[type] = count;
            sum += count;
        }

        const primaryType = ratios.MWC > ratios.MUW ? 'MWC' : 'MUW';
        entriesPerCabin[primaryType] += (entriesToGenerate - sum);

        for (let cabin of cabins) {

            if (remainingGlobalQuota !== Infinity && remainingGlobalQuota <= 0) break;

            const typeKey = cabinTypes.find(t => cabin.cabin_name.startsWith(t));
            if (!typeKey) continue;

            const count = entriesPerCabin[typeKey] || 0;

            for (let i = 0; i < count; i++) {

                if (remainingGlobalQuota !== Infinity && remainingGlobalQuota <= 0) break;

                let baseEntryTime = moment().subtract(Math.floor(Math.random() * 30), 'minutes');
                if (baseEntryTime.isBefore(todayStart)) baseEntryTime = todayStart.clone().add(Math.random() * 60, 'minutes');

                const minD = typeKey === 'MUW' ? 1 : 3;
                const maxD = typeKey === 'MUW' ? 5 : 12;
                const durMin = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
                const exitTime = baseEntryTime.clone().add(durMin, 'minutes');
                const durSec = durMin * 60;
                const floorCleanFlag = Math.random() > 0.8 ? 1 : 0;

                let averageFeedback = null;
                if (Math.random() < 0.45) {
                    let r = Math.random() * (4.7 - 3.5) + 3.5 + mood;
                    if (r < 3.5) r = 3.5;
                    if (r > 4.7) r = 4.7;
                    averageFeedback = r.toFixed(1);
                }

                await UsageProfile.create({
                    cabin_id: cabin.id,
                    CLIENT: `Client${complex}`,
                    CITY: 'Gwalior',
                    STATE: 'MP',
                    COMPLEX: `Complex${complex}`,
                    SHORT_THING_NAME: cabin.cabin_name,
                    THING_NAME: `${cabin.user_type} ${cabin.cabin_type}`,
                    Fantime: durSec,
                    Lighttime: durSec,
                    Duration: durSec,
                    Preflush: typeKey !== 'MUW' ? 1 : 0,
                    Fullflush: typeKey !== 'MUW' ? 1 : (Math.random() > 0.8 ? 1 : 0),
                    Floorclean: floorCleanFlag,
                    Manualflush: 0,
                    Miniflush: 0,
                    Airdryer: 0,
                    RFID: `RFID${Math.random().toString(36).slice(2)}`,
                    feedback: averageFeedback ?? 'N/A',
                    Entrytype: 'simulated',
                    Entry_TIME: baseEntryTime.toDate(),
                    Exit_TIME: exitTime.toDate(),
                    Amountcollected: typeKey === 'PWC' ? 0 : Math.floor(Math.random() * 6 + 5),
                    Amountremaining: 0,
                });

                await UsageAndFeedback.create({
                    cabin_id: cabin.id,
                    CLIENT: `Client${complex}`,
                    TotalWaterRecycled: '0',
                    TotalUsage: durSec.toString(),
                    ttl: moment().unix(),
                    Lon: (78.15 + Math.random() * 0.1).toFixed(4),
                    Lat: (26.21 + Math.random() * 0.1).toFixed(4),
                    SHORT_THING_NAME: cabin.cabin_name,
                    ThingName: `${cabin.user_type} ${cabin.cabin_type}`,
                    AverageFeedback: averageFeedback,
                    Fanhealth: Math.random() > 0.95 ? 'Low' : 'High',
                    Flushhealth: Math.random() > 0.95 ? 'Low' : 'High',
                });

                dailyTracking[complex].generated++;
                if (remainingGlobalQuota !== Infinity) remainingGlobalQuota--;
            }
        }

        console.log(`Site ${complex} done. Today: ${dailyTracking[complex].generated}/${target}`);
    }
}

// ------------------ CRON SETUP ------------------
function setupCron() {
    seedCabins().catch(err => console.error('Seed error:', err));

    cron.schedule('*/20 * * * *', () => {
        console.log(`\n⏰ Cron run: ${moment().format('YYYY-MM-DD HH:mm:ss')} IST`);
        generateEntries().catch(err => console.error('Entry generation error:', err));
    });
}

module.exports = setupCron;
