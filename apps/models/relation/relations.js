const Complex = require("../Complex")
const Ticket = require("../RiseTicket");



Complex.hasMany(Ticket, { foreignKey: "complex_id", as: "tickets" });
Ticket.belongsTo(Complex, { foreignKey: "complex_id", as: "complex" });

module.exports = { Complex, Ticket };
