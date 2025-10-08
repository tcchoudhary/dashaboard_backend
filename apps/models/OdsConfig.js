const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance




  const OdsConfig = sequelize.define("OdsConfig", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    Seatthreshold: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Ambientseatfactor: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Ambientfloorfactor: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Seatfloorratio: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
     created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: "OdsConfig",
    timestamps: false
  });


// OdsConfig.sync({alter:true}).then(()=>{
//     console.log("OdsConfig model created")
// })

  module.exports = OdsConfig;
