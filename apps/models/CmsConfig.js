const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance


  const CmsConfig = sequelize.define("CmsConfig", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cabin_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    Autolightenabled: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Lightautoofftime: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Lightautoontimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Fanautoontimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Fanautoofftimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    fullflushactivationtimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    fullflushdurationtimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Miniflushactivationtimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Miniflushdurationtimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Airdryerautoontimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Airdryerdurationtimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Autofullflushenabled: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Autopreflush: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Autominiflushenabled: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Autoairdryerenabled: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Autofloorenabled: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Autofanenabled: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Floorcleancount: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Floorcleandurationtimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Exitafterawaytimer: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    created_at:{
      type:DataTypes.DATE,
    }
  }, {
    tableName: "CmsConfig",
    timestamps: false,
  });

// CmsConfig.sync({ alter: true }).then(() => {
//   console.log("CmsConfig table created");
// });

module.exports = CmsConfig;
