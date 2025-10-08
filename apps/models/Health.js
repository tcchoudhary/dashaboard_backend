const { DataTypes,Op } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance

const DeviceHealthStatus = sequelize.define(
  "DeviceHealthStatus",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    CLIENT: {
      type: DataTypes.STRING,
    },
    CITY: {
      type: DataTypes.STRING,
    },
    flushHealth: {
      type: DataTypes.STRING,
    },
    floorCleanHealth: {
      type: DataTypes.STRING,
    },
    fanHealth: {
      type: DataTypes.STRING,
    },
    freshWaterLevel: {
      type: DataTypes.STRING,
    },
    lightHealth: {
      type: DataTypes.STRING,
    },
    recycleWaterLevel: {
      type: DataTypes.STRING,
    },
    tapHealth: {
      type: DataTypes.STRING,
    },
    lockHealth: {
      type: DataTypes.STRING,
    },
    odsHealth: {
      type: DataTypes.STRING,
    },
    airDryerHealth: {
      type: DataTypes.STRING,
    },
    chokeHealth: {
      type: DataTypes.STRING,
    },
    lockStatus: {
      type: DataTypes.STRING,
    },
    ThingName: {
      type: DataTypes.STRING,
    },
    SHORT_THING_NAME: {
      type: DataTypes.STRING,
    },
    STATE: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW, 
    },
  },
  {
    tableName: "DeviceHealthStatus",
    timestamps: false,
  }
);

// DeviceHealthStatus.sync({alter:true}).then(()=>{
//     console.log("health model created")
// })
module.exports = DeviceHealthStatus;


