const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance

const GasConcentration = sequelize.define(
  "GasConcentration",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    concentrationLuminosityStatus: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    concentrationNH3: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    concentrationCH4: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    concentrationCO: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "GasConcentration", // or your table name
    timestamps: false,
  }
);

// GasConcentration.sync({alter:true}).then(()=>{
//     console.log("GasConcentration table created")
// })



module.exports = GasConcentration;
