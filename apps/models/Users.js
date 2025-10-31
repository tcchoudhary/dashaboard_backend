const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance
const TicketModel = require("./RiseTicket");

const Users = sequelize.define("users", {
  id: {
    type: DataTypes.BIGINT(20).UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  lastname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactnumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isactive: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: "1",
    comment: "1-Active,2-deleted",
  },
  profileimg: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profileimg_path: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  permanent_sys_adm: {
    type: DataTypes.ENUM,
    values: ["1", "2"],
    defaultValue: "2",
    comment: "1-yes,2-no",
  },
},
  {
    timestamps: false,
  }
);



Users.hasMany(TicketModel, {
  foreignKey: "user_id",
});


TicketModel.belongsTo(Users, {
  foreignKey: "user_id",
  targetKey: "id",
  as: "user",
});


module.exports = Users;
