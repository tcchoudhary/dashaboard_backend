
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance


const UcemsConfig = sequelize.define("UcemsConfig", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    CITY: DataTypes.STRING,
    Collexpirytime: DataTypes.STRING,
    Entrychargeamount: DataTypes.STRING,
    LockType: DataTypes.STRING,
    Edis_airDryr: DataTypes.STRING,
    Characteristic: DataTypes.STRING,
    Edis_recWtr: DataTypes.STRING,
    Edis_flush: DataTypes.STRING,
    Edis_floor: DataTypes.STRING,
    SHORT_THING_NAME: DataTypes.STRING,
    ShortThingName: DataTypes.STRING,
    SendToDevic: DataTypes.STRING,
    Edis_choke: DataTypes.STRING,
    Edis_tap: DataTypes.STRING,
    Occwaitexpirytime: DataTypes.STRING,
    Edis_cms: DataTypes.STRING,
    Edis_lock: DataTypes.STRING,
    version_code: DataTypes.INTEGER,
    SendToAws: DataTypes.STRING,
    Edis_fan: DataTypes.STRING,
    Cabinpaymentmode: DataTypes.STRING,
    Edis_light: DataTypes.STRING,
    ThingName: DataTypes.STRING,
    Exitdoortriggertimer: DataTypes.STRING,
    Feedbackexpirytime: DataTypes.STRING,
    COMPLEX: DataTypes.STRING,
    Edis_ods: DataTypes.STRING,
    Edis_freshWtr: DataTypes.STRING,
    STATE: DataTypes.STRING,
    THING_NAME: DataTypes.STRING,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: "UcemsConfig",
    timestamps: false
  });


  // UcemsConfig.sync({alter:true}).then(()=>{
  //   console.log("UcemsConfig table created")
  // })
module.exports = UcemsConfig;