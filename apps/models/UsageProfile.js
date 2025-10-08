

const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database");

const UsageProfile = sequelize.define(
  "UsageProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: "Cabins",
        key: "id",
      },
    },
    CLIENT: DataTypes.STRING,
    CITY: DataTypes.STRING,
    STATE: DataTypes.STRING,
    COMPLEX: DataTypes.STRING,
    SHORT_THING_NAME: DataTypes.STRING,
    THING_NAME: DataTypes.STRING,
    Fantime: DataTypes.INTEGER,
    Lighttime: DataTypes.INTEGER,
    Manualflush: DataTypes.INTEGER,
    Floorclean: DataTypes.INTEGER,
    Miniflush: DataTypes.INTEGER,
    Preflush: DataTypes.INTEGER,
    Fullflush: DataTypes.INTEGER,
    Airdryer: DataTypes.INTEGER,
    RFID: DataTypes.STRING,
    feedback: DataTypes.STRING,
    Entrytype: DataTypes.STRING,
    Duration: DataTypes.INTEGER, 
    Entry_TIME: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Exit_TIME: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Amountcollected: DataTypes.DECIMAL(10, 2),
    Amountremaining: DataTypes.DECIMAL(10, 2),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "UsageProfile",
    timestamps: false,
    indexes: [
      { fields: ['cabin_id'] },
      { fields: ['Entry_TIME'] },
    ],
  }
);



module.exports = UsageProfile;






// Function to insert 5 records for a given cabin_id
async function insertMultipleRecords(cabin_id) {
  try {
    const records = [];

    // Loop to create 5 records
    for (let i = 0; i < 5; i++) {
      const randomDuration = getRandomDurationMinutes();
      const entryTime = new Date();
      console.log(entryTime , "entryTime");
      const exitTime = new Date(entryTime.getTime() + randomDuration * 60000);  // Add random minutes to Entry_TIME
      console.log(exitTime , "exitTime");
      const record = {
        cabin_id: "1",
        CLIENT: `Client ${i + 1}`,
        CITY: "New York",
        STATE: "NY",
        COMPLEX: "Complex A",
        SHORT_THING_NAME: `Short Thing ${i + 1}`,
        THING_NAME: `Thing ${i + 1}`,
        Fantime: Math.floor(Math.random() * 100),
        Lighttime: Math.floor(Math.random() * 100),
        Manualflush: Math.floor(Math.random() * 2),  // Random 0 or 1
        Floorclean: Math.floor(Math.random() * 2),  // Random 0 or 1
        Miniflush: Math.floor(Math.random() * 2),  // Random 0 or 1
        Preflush: Math.floor(Math.random() * 2),  // Random 0 or 1
        Fullflush: Math.floor(Math.random() * 2),  // Random 0 or 1
        Airdryer: Math.floor(Math.random() * 2),  // Random 0 or 1
        RFID: `RFID${i + 1}`,
        feedback: `Feedback for Client ${i + 1}`,
        Entrytype: "Type A",
        Duration: randomDuration,
        Entry_TIME: entryTime,
        Exit_TIME: exitTime,
        Amountcollected: (Math.random() * 100).toFixed(2),  // Random amount between 0 and 100
        Amountremaining: (Math.random() * 100).toFixed(2),  // Random remaining amount
      };

      records.push(record);
    }

    // Insert all 5 records at once
    // await UsageProfile.bulkCreate(records);
    console.log("5 records inserted successfully!");
  } catch (error) {
    console.error("Error inserting records:", error);
  }
}

// Function to generate random duration in minutes between 2 and 20 minutes
function getRandomDurationMinutes() {
  const minDur = 2;
  const maxDur = 15;
  return Math.floor(Math.random() * (maxDur - minDur + 1) + minDur);
}



// insertMultipleRecords()




