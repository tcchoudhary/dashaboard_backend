  const { DataTypes } = require("sequelize");
  const sequelize = require("../config/database");
  const GasConcentration = require("./GasConcentration");
  const DeviceHealthStatus = require("./Health");
  const UcemsConfig = require("./UcemsConfig");
  const CmsConfig = require("./CmsConfig");
  const OdsConfig = require("./OdsConfig");
  const UsageProfile = require("./UsageProfile");
  const ResetProfile = require("./ResetProfile");
  const UsageAndFeedback = require("./UsageAndFeedback");

  const Cabin = sequelize.define("Cabins", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    complex_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    cabin_name: {
      type: DataTypes.STRING,
    },
    smartness_level: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.DATEONLY,
    },
    cabin_type: {
      type: DataTypes.ENUM("WC", "URINAL"),
    },
    user_type: {
      type: DataTypes.ENUM("Male", "Female", "PD"),
    },
    usage_charge_type: {
      type: DataTypes.ENUM("COIN", "None"),
    },
    connection_status: {
      type: DataTypes.ENUM("ONLINE", "OFFLINE","Low data network","Working"),
    },
  });

  // Cabin.sync({ alter: true }).then(() => {
  //   console.log("Cabin table created");
  // });

  Cabin.hasMany(GasConcentration, {
    foreignKey: "cabin_id",
    as: "gasReadings",
  });

  GasConcentration.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin",
  });

  Cabin.hasMany(DeviceHealthStatus, {
    foreignKey: "cabin_id",
    as: "deviceHealthStatus",
  });

  DeviceHealthStatus.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin",
  });

  Cabin.hasOne(UcemsConfig, {
    foreignKey: "cabin_id",
    as: "ucemsConfig",
  });

  UcemsConfig.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin",
  });

  Cabin.hasOne(CmsConfig, {
    foreignKey: "cabin_id",
    as: "cmsConfig",
  });

  CmsConfig.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin",
  });

  Cabin.hasOne(OdsConfig, {
    foreignKey: "cabin_id",
    as: "odsConfig"
  });

  OdsConfig.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin"
  });

  Cabin.hasMany(UsageProfile, {
    foreignKey: "cabin_id",
    as: "usageProfiles"
  });

  UsageProfile.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin"
  });

  Cabin.hasMany(ResetProfile, {
    foreignKey: "cabin_id",
    as: "resetProfiles"
  });

  ResetProfile.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin"
  });

  Cabin.hasMany(UsageAndFeedback, {
    foreignKey: "cabin_id",
    as: "usageAndFeedbacks"
  });

  UsageAndFeedback.belongsTo(Cabin, {
    foreignKey: "cabin_id",
    as: "cabin"
  });


  module.exports = Cabin;



  