const {  Sequelize, DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database");
const cron = require('node-cron');

const ResetProfile = sequelize.define(
  "ResetProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    CLIENT: DataTypes.STRING,
    CITY: DataTypes.STRING,
    STATE: DataTypes.STRING,
    COMPLEX: DataTypes.STRING,
    SHORT_THING_NAME: DataTypes.STRING,
    THING_NAME: DataTypes.STRING,
    Resetsource: DataTypes.STRING,
    BoardId: DataTypes.STRING,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // यह अब सिर्फ तारीख देगा
    },
    ttl: DataTypes.BIGINT,
  },
  {
    tableName: "ResetProfile",
    timestamps: false,
  }
);

// ResetProfile.sync({alter:true}).then(()=>{
//     console.log("health model created")
// })
module.exports = ResetProfile;


async function insertDailyResetRecords() {
  try {
    const resetRecordsToInsert = [];
    const baseData = {
      "CLIENT": "GSCDCL_PH2",
      "CITY": "MP1404",
      "COMPLEX": "1000_BED_HOSPITAL",
      "STATE": "MP",
      "Resetsource": "1024", // आपके डेटा में यह सामान्य है
      "BoardId": "UCEMS", // आपके डेटा में यह सामान्य है
      // 'DEVICE_TIMESTAMP', 'timestamp', 'ttl' को डायनेमिकली जनरेट करेंगे
    };

    const totalCabins = 40;
    const today = new Date();
    // created_at के लिए पूरा डेट और टाइम, जैसा कि आपके मॉडल में है
    const now = new Date();
    
    for (let cabinId = 1; cabinId <= totalCabins; cabinId++) {
      const shortThingName = `FWC_${String(cabinId).padStart(3, '0')}`;
      const thingName = `MP1404_23072024_003_${shortThingName}`;

      // हर केबिन के लिए 0 से 2 रैंडम रीसेट रिकॉर्ड बनाएं (कुछ रीसेट नहीं होंगे)
      const numberOfResets = Math.floor(Math.random() * 3); // 0, 1, or 2 resets

      for (let i = 0; i < numberOfResets; i++) {
        const resetTime = new Date(today);
        // दिन में अलग-अलग समय पर रीसेट simulates करने के लिए कुछ रैंडम घंटे और मिनट जोड़ें
        resetTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), Math.floor(Math.random() * 999));

        const ttl = Math.floor((resetTime.getTime() / 1000) + (365 * 24 * 60 * 60)); // 1 साल आगे का TTL (seconds)

        resetRecordsToInsert.push({
          cabin_id: cabinId,
          CLIENT: baseData.CLIENT,
          CITY: baseData.CITY,
          STATE: baseData.STATE,
          COMPLEX: baseData.COMPLEX,
          SHORT_THING_NAME: shortThingName,
          THING_NAME: thingName,
          Resetsource: baseData.Resetsource,
          BoardId: baseData.BoardId,
          created_at: resetTime, // पूरा डेट और टाइम
          ttl: ttl
        });
      }
    }

    if (resetRecordsToInsert.length > 0) {
      console.log(`आज के लिए ${resetRecordsToInsert.length} नए रीसेट रिकॉर्ड्स डालने के लिए तैयार हैं।`);
      await ResetProfile.bulkCreate(resetRecordsToInsert);
      console.log(`${resetRecordsToInsert.length} नए रीसेट रिकॉर्ड्स ResetProfile टेबल में सफलतापूर्वक इंसर्ट हो गए हैं।`);
    } else {
      console.log('आज के लिए कोई नया रीसेट रिकॉर्ड इंसर्ट नहीं किया गया।');
    }

  } catch (error) {
    console.error('रीसेट डेटा डालने में त्रुटि:', error);
  }
}


async function cleanOldResetRecords() {
  try {
    const uniqueDatesCount = await ResetProfile.count({
      distinct: true,
      col: sequelize.fn('DATE', sequelize.col('created_at')) // created_at से सिर्फ तारीख को एक्सट्रेक्ट करें
    });

    console.log(`ResetProfile टेबल में मौजूद यूनिक तारीखों की संख्या: ${uniqueDatesCount}`);

    if (uniqueDatesCount > 90) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      cutoffDate.setHours(0, 0, 0, 0); // यह सुनिश्चित करने के लिए कि यह पूरे दिन को कवर करे

      console.log(`ResetProfile में 90 दिन से ज्यादा का डेटाबेस है (${uniqueDatesCount} दिन)। ${cutoffDate.toISOString().split('T')[0]} से पहले के रिकॉर्ड्स डिलीट किए जा रहे हैं।`);

      const deletedCount = await ResetProfile.destroy({
        where: {
          created_at: { // created_at कॉलम का उपयोग करें
            [Op.lt]: cutoffDate
          }
        }
      });

      console.log(`${deletedCount} पुराने रिकॉर्ड्स ResetProfile टेबल से डिलीट हो गए हैं।`);
    } else {
      console.log('ResetProfile में 90 दिनों से अधिक का डेटा नहीं है। पुराने रिकॉर्ड्स डिलीट नहीं किए गए।');
    }

  } catch (error) {
    console.error('पुराने रीसेट रिकॉर्ड्स डिलीट करने में त्रुटि:', error);
  }
}


async function startApplication() {
  try {
    await sequelize.authenticate();
    console.log('शेड्यूलर के लिए Database कनेक्शन तैयार है।');

    // सुनिश्चित करें कि दोनों टेबल्स मौजूद हैं
    await ResetProfile.sync({ alter: true }); // NEW: ResetProfile टेबल सिंक करें
    console.log("ResetProfile टेबल सिंक हो गई है।");


    // हर दिन सुबह 8:00 बजे (IST) नए यूसेज और रीसेट रिकॉर्ड डालें
    cron.schedule('10 9 * * *', async () => {
      console.log(`\n--- ${new Date().toLocaleString()} - दैनिक रिकॉर्ड डालने का कार्य शुरू ---`);
      await insertDailyResetRecords(); // NEW: रीसेट रिकॉर्ड
      console.log(`--- ${new Date().toLocaleString()} - दैनिक रिकॉर्ड डालने का कार्य समाप्त ---`);
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // अपने टाइमजोन के हिसाब से बदलें
    });

    // हर दिन सुबह 8:10 बजे (IST) पुराने रिकॉर्ड्स डिलीट करें
    cron.schedule('10 9 * * *', async () => {
      console.log(`\n--- ${new Date().toLocaleString()} - पुराने रिकॉर्ड्स डिलीट करने का कार्य शुरू ---`);
      await cleanOldResetRecords(); // NEW: रीसेट रिकॉर्ड्स के लिए डिलीट लॉजिक
      console.log(`--- ${new Date().toLocaleString()} - पुराने रिकॉर्ड्स डिलीट करने का कार्य समाप्त ---`);
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // अपने टाइमजोन के हिसाब से बदलें
    });

    console.log('शेड्यूलिंग सेट हो गई है। ऐप चल रहा है।');

  } catch (error) {
    console.error('एप्लिकेशन शुरू करने में गंभीर त्रुटि:', error);
    process.exit(1);
  }
}

// एप्लिकेशन शुरू करें
// startApplication();