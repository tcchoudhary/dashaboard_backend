const { Sequelize, DataTypes, Op } = require('sequelize');
const sequelize = require("../config/database");

const UsageAndFeedback = sequelize.define(
  "UsageAndFeedback",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Cabins', // Reference to Cabins table
        key: 'id',
      },
    },
    CLIENT: DataTypes.STRING,
    TotalWaterRecycled: DataTypes.STRING,
    TotalUsage: DataTypes.STRING,
    ttl: DataTypes.BIGINT,
    Lon: DataTypes.STRING,
    NH3concentration: DataTypes.STRING,
    COconcentration: DataTypes.STRING,
    SHORT_THING_NAME: DataTypes.STRING,
    ShortThingName: DataTypes.STRING,
    SendToDevic: DataTypes.STRING,
    Fanhealth: DataTypes.STRING,
    Lat: DataTypes.STRING,
    INITIATED: DataTypes.STRING,
    IsDeviceStolen: DataTypes.STRING,
    version_code: DataTypes.INTEGER,
    SendToAws: DataTypes.STRING,
    Floorcleanhealth: DataTypes.STRING,
    Freshwaterlevel: DataTypes.STRING,
    Lighthealth: DataTypes.STRING,
    LuminosityStatus: DataTypes.STRING,
    ThingName: DataTypes.STRING,
    AverageFeedback: DataTypes.STRING,
    Recyclewaterlevel: DataTypes.STRING,
    COMPLEX: DataTypes.STRING,
    THING_NAME: DataTypes.STRING,
    CH4concentration: DataTypes.STRING,
    Flushhealth: DataTypes.STRING,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "UsageAndFeedback",
    timestamps: false,
  }
);

//   UsageAndFeedback.sync({alter:true}).then(()=>{
//     console.log("health model created")
// })
module.exports = UsageAndFeedback;


