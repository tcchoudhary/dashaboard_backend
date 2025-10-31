const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance
const Cabin = require("./Cabin")
const Ticket = require("./RiseTicket")

const Complex = sequelize.define("Complex_tbl", {
  id: {
    type: DataTypes.BIGINT(20).UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
});




Complex.hasMany(Cabin, { foreignKey: "complex_id", as: "cabins" });
Cabin.belongsTo(Complex, { foreignKey: "complex_id", as: "complex" });




module.exports = Complex;

