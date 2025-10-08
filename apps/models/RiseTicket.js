const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Ticket = sequelize.define(
  "Ticket",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    complex_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.ENUM(
        "RAISED", // raised by the user
        "QUEUED", // moved to queue
        "SELF_ASSIGNED", // assigned to self
        "TEAM_ASSIGNED", // assigned to a team
        "CLOSED" // completed
      ),
      defaultValue: "RAISED",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Active", // or In Progress, Queued, Closed
    },
    client: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    district: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    criticality: {
      type: DataTypes.STRING, // e.g., Low, Medium, High, Urgent
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Tickets",
    timestamps: false,
  }
);


// Ticket.sync({alter:true}).then(()=>{
//   console.log("ticket")
// })
module.exports = Ticket;
