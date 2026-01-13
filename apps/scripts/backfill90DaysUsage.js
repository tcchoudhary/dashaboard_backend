const { Op } = require('sequelize');
const moment = require('moment-timezone');
const UsageProfile = require('../models/UsageProfile');
const UsageAndFeedback = require('../models/UsageAndFeedback');
const Cabin = require('../models/Cabin');

moment.tz.setDefault('Asia/Kolkata');

const minEntriesPerSite = 5;
const maxEntriesPerSite = 12;
const cabinTypes = ['MUW', 'MWC', 'FWC', 'PWC'];
const startHour = 9;
const endHour = 19;

// ------------------ RATIOS ------------------
function getDailyCabinRatios() {
    const rawMWC = Math.random() * (0.55 - 0.15) + 0.15;
    const rawMUW = Math.random() * (0.55 - 0.20) + 0.20;
    const rawFWC = Math.random() * (0.25 - 0.07) + 0.07;
    const rawPWC = Math.random() * (0.10 - 0.00) + 0.00;

    const total = rawMWC + rawMUW + rawFWC + rawPWC;

    return {
        MWC: rawMWC / total,
        MUW: rawMUW / total,
        FWC: rawFWC / total,
        PWC: rawPWC / total,
    };
}

// ------------------ TIME ------------------
function randomTimeInDay(date) {
    const start = moment(date).startOf('day').add(startHour, 'hours');
    const end = moment(date).startOf('day').add(endHour, 'hours');
    const diff = end.diff(start, 'minutes');
    return start.clone().add(Math.floor(Math.random() * diff), 'minutes');
}

// ------------------ MAIN GENERATOR ------------------
async function generateForDate(date) {
    for (let complex = 1; complex <= 10; complex++) {

        const cabins = await Cabin.findAll({ where: { complex_id: complex } });
        if (cabins.length !== 4) continue;

        const dailyTarget = Math.floor(Math.random() * (maxEntriesPerSite - minEntriesPerSite + 1)) + minEntriesPerSite;
        const ratios = getDailyCabinRatios();
        const mood = (Math.random() * 0.2) - 0.1;

        let entriesPerCabin = {};
        let total = 0;

        for (let type of cabinTypes) {
            const count = Math.round(dailyTarget * ratios[type]);
            entriesPerCabin[type] = count;
            total += count;
        }

        const fixType = ratios.MWC > ratios.MUW ? 'MWC' : 'MUW';
        entriesPerCabin[fixType] += (dailyTarget - total);

        for (let cabin of cabins) {
            const typeKey = cabinTypes.find(t => cabin.cabin_name.startsWith(t));
            if (!typeKey) continue;

            const count = entriesPerCabin[typeKey] || 0;

            for (let i = 0; i < count; i++) {

                const entryTime = randomTimeInDay(date);
                const minD = typeKey === 'MUW' ? 1 : 3;
                const maxD = typeKey === 'MUW' ? 5 : 12;
                const durationMin = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
                const exitTime = entryTime.clone().add(durationMin, 'minutes');
                const durationSec = durationMin * 60;

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
                    Fantime: durationSec,
                    Lighttime: durationSec,
                    Duration: durationSec,
                    Preflush: typeKey !== 'MUW' ? 1 : 0,
                    Fullflush: typeKey !== 'MUW' ? 1 : 0,
                    Floorclean: Math.random() > 0.8 ? 1 : 0,
                    RFID: `RFID${Math.random().toString(36).slice(2)}`,
                    feedback: averageFeedback ?? 'N/A',
                    Entrytype: 'backfill',
                    Entry_TIME: entryTime.toDate(),
                    Exit_TIME: exitTime.toDate(),
                    Amountcollected: typeKey === 'PWC' ? 0 : Math.floor(Math.random() * 6 + 5),
                    Amountremaining: 0,
                });

                await UsageAndFeedback.create({
                    cabin_id: cabin.id,
                    CLIENT: `Client${complex}`,
                    TotalWaterRecycled: '0',
                    TotalUsage: durationSec.toString(),
                    ttl: moment(entryTime).unix(),
                    Lon: (78.15 + Math.random() * 0.1).toFixed(4),
                    Lat: (26.21 + Math.random() * 0.1).toFixed(4),
                    SHORT_THING_NAME: cabin.cabin_name,
                    ThingName: `${cabin.user_type} ${cabin.cabin_type}`,
                    AverageFeedback: averageFeedback,
                    Fanhealth: Math.random() > 0.95 ? 'Low' : 'High',
                    Flushhealth: Math.random() > 0.95 ? 'Low' : 'High',
                });
            }
        }

        console.log(`✅ ${date} | Site ${complex} done`);
    }
}

// ------------------ RUNNER ------------------
async function backfillLast90Days() {
    console.log('\n🧨 DELETING OLD DATA...');
    await UsageProfile.destroy({ where: {}, truncate: true });
    await UsageAndFeedback.destroy({ where: {}, truncate: true });

    console.log('🚀 Generating last 90 days data...\n');

    for (let i = 90; i >= 0; i--) {
        const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
        await generateForDate(day);
    }

    console.log('\n🎉 BACKFILL COMPLETE');
    process.exit(0);
}

backfillLast90Days().catch(err => {
    console.error('❌ BACKFILL FAILED:', err);
    process.exit(1);
});
