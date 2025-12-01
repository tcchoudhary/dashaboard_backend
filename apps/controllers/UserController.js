const jwt = require("jsonwebtoken");
const Joi = require("joi");
const md5 = require("md5");
const secretKey = "bidgrid277833";
const getCurrentDateTime = () => new Date();
require("dotenv").config();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const Users = require("../../apps/models/Users");
const Complex = require("../models/Complex");
const CabinModel = require("../models/Cabin");
const UsageAndFeedback = require("../models/UsageAndFeedback");
const UsageProfile = require("../models/UsageProfile");
const ResetProfile = require("../models/ResetProfile");
const DeviceHealthStatus = require("../models/Health");
const UcemsConfig = require("../models/UcemsConfig");
const CmsConfig = require("../models/CmsConfig");
const GasConcentration = require("../models/GasConcentration");
const OdsConfig = require("../models/OdsConfig");
const TicketModel = require("../models/RiseTicket");
const { Op, where } = require("sequelize");
const sequelize = require("../config/database"); // Ensure this path is correct

const userlogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const schema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  const dataToValidate = {
    email: email,
    password: password,
  };
  const result = schema.validate(dataToValidate);
  if (result.error) {
    res.status(400).send({
      error: true,
      success: false,
      status: "0",
      message: result.error.details[0].message,
    });
  } else {
    try {
      const user = await Users.findOne({
        where: {
          email: req.body.email,
          password: md5(req.body.password),
          isactive: "1",
        },
      });
      if (!user) {
        res.status(401).send({
          message: "Invalid credentials",
          error: true,
          success: false,
          status: "0",
        });
      } else {
        const token = jwt.sign(
          { id: user?.id, emp_role: user?.permanent_sys_adm },
          secretKey,
          {
            expiresIn: "24h",
          }
        );
        res.status(200).send({
          message: "Login successful",
          error: false,
          success: true,
          status: "1",
          data: user,
          token,
        });
      }
    } catch (error) {
      res.status(500).send({
        message: process.env.ERROR_MSG,
        error: error.message,
        success: false,
        status: "0",
      });
    }
  }
};

//User Add ...
const sanitizeInput = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
};

const useradd = async (req, res) => {
  const schema = Joi.object().keys({
    firstname: Joi.string().required(),
    lastname: Joi.string().allow(null).optional(),
    email: Joi.string().email().required(),
    contactnumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .allow(null)
      .optional(),
    password: Joi.string().required(),
    created_at: Joi.date().iso().required(),
  });
  const dataToValidate = {
    firstname: sanitizeInput(req.body.firstname),
    lastname: sanitizeInput(req.body.lastname),
    email: sanitizeInput(req.body.email),
    contactnumber: sanitizeInput(req.body.contactnumber),
    password: req.body.password,
    created_at: getCurrentDateTime(),
  };

  const result = schema.validate(dataToValidate, { abortEarly: false });
  // const result = validatedData.value;
  if (result.error) {
    res.status(401).send({
      error: true,
      success: false,
      status: "0",
      message: result.error.details[0].message,
    });
  } else {
    try {
      const EmailExistCheck = await Users.findOne({
        where: { email: req.body.email, isactive: 1 },
        attributes: ["id"],
      });

      if (EmailExistCheck) {
        return res.status(402).send({
          message: "Email already exists",
          error: true,
          success: false,
          status: "0",
        });
      } else {
        dataToValidate["password"] = md5(req.body.password);
        const insert = await Users.create(dataToValidate);
        if (insert) {
          res.status(200).send({
            message: "User created",
            error: false,
            success: true,
            status: "1",
            data: insert,
          });
        }
      }
    } catch (error) {
      res.status(500).send({
        message: "somthing went wrong",
        error: error.message,
        success: false,
        status: "0",
      });
    }
  }
};

const userList = async (req, res) => {
  let wherecondition = {};

  if (req.emp_role == "0") {
    wherecondition = {
      created_by: req.userId,
    };
  }

  try {
    const userlist = await Users.findAll({
      where: wherecondition, // ✅ This is correct
    });

    if (userlist.length === 0) {
      return res.status(404).send({
        message: "Record not found",
        status: "0",
      });
    }

    return res.status(200).send({
      message: "Record found",
      status: "1",
      data: userlist, // ✅ You had written userList here which is your function name
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong",
      err: error.message,
      status: "0",
    });
  }
};

//Change Password..
const changepassword = async (req, res) => {
  const schema = Joi.object().keys({
    password: Joi.string().required(),
  });

  const dataToValidate = {
    password: req.body.password,
  };

  const result = schema.validate(dataToValidate);
  if (result.error) {
    res.status(400).send({
      error: true,
      success: false,
      status: "0",
      message: result.error.details[0].message,
    });
  } else {
    try {
      const user = await Users.update(
        { password: md5(req.body.password) },
        { where: { id: req.userId } }
      );
      if (!user[0]) {
        return res.status(400).send({
          message: "something went wrong",
          error: true,
          success: false,
          status: "0",
        });
      }
      res.send({
        message: "Password change successfully done.",
        error: false,
        success: true,
        status: "1",
        data: user,
      });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  }
};

const UserActiveInActive = async (req, res) => {
  const schema = Joi.object({
    user_id: Joi.number().required(),
  });

  const { error } = schema.validate({ user_id: req.body.user_id });
  if (error) {
    return res.status(400).send({
      error: true,
      success: false,
      status: "0",
      message: error.details[0].message,
    });
  }

  const user_id = req.body.user_id;
  try {
    const user = await Users.findOne({ where: { id: user_id } });
    if (!user) {
      return res.status(404).send({
        message: "User not found",
        error: true,
        success: false,
        status: "0",
      });
    }
    const newStatus = user.isactive == "1" ? "2" : "1";

    await Users.update({ isactive: newStatus }, { where: { id: user_id } });

    return res.status(200).send({
      message: `User is now ${newStatus === "1" ? "active" : "inactive"}`,
      error: false,
      success: true,
      status: "1",
      data: { user_id, isactive: newStatus },
    });
  } catch (err) {
    return res.status(500).send({
      error: err.message,
      success: false,
      status: "0",
      message: "Something went wrong",
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { id: req.userId },
      attributes: {
        exclude: ["password"], // ⛔ Exclude password from response
      },
    });

    if (!user) {
      return res.status(404).send({
        message: "User not found",
        error: true,
        success: false,
        status: "0",
      });
    }

    return res.status(200).send({
      message: "User details fetched successfully",
      error: false,
      success: true,
      status: "1",
      data: user,
    });
  } catch (err) {
    return res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      success: false,
      status: "0",
    });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = `uploads/public_${req.userId}/profile/`;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });

const ProfileUpdate = async (req, res) => {
  upload.single("file")(req, res, async function (err) {
    // Handle file upload error
    if (err) {
      return res.status(500).send({
        message: "Error in file upload",
        error: true,
        success: false,
        status: "0",
        msg: err,
      });
    }

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).send({
        message: "Please upload a profile picture.",
        status: "0",
        error: true,
        success: false,
      });
    }

    try {
      // Find user by ID (make sure user is active)
      const user = await Users.findOne({
        where: { id: req.userId, isactive: true },
      });

      // Check if user exists
      if (!user) {
        return res.status(404).send({
          message: "User not found.",
          error: true,
          success: false,
          status: "0",
        });
      }

      // Prepare file path and name to store in the database
      const filePath = `uploads/public_${req.userId}/profile/${req.file.filename}`;

      // Update the user's profile image in the database
      const updatedUser = await user.update({
        profileimg: req.file.filename, // Store the file name
        profileimg_path: filePath, // Store the file path (absolute or relative based on your needs)
      });

      // Return success response
      res.send({
        message: "Profile picture updated successfully.",
        error: false,
        success: true,
        status: "1",
        data: updatedUser,
      });
    } catch (error) {
      // Catch any error that occurs and send a generic message
      return res.status(500).send({
        message: process.env.ERROR_MSG || "Something went wrong.",
        error: error.message,
        success: false,
        status: "0",
      });
    }
  });
};

const Sitelist = async (req, res) => {
  try {
    // const data = await Complex.findAll();
    const data = await Complex.findAll({
      attributes: ["id", "name", "address", "city"], // ✅ Only these columns
    });

    if (data.length == 0) {
      return res.status(404).json({ status: 0, message: "data not found" });
    }
    return res
      .status(200)
      .json({ status: 1, message: "data  found", data: data });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

const ComplexData = async (req, res) => {
  try {
    const complex_id = req.body.id;
    if (!complex_id) {
      return res
        .status(401)
        .json({ status: 0, message: "complex id is required" });
    }

    const data = await Complex.findAll({
      where: { id: complex_id },
      include: [
        {
          model: CabinModel,
          as: "cabins",
        },
      ],
    });

    if (!data || data.length === 0) {
      return res.status(404).json({ status: 0, message: "data not found" });
    }

    return res.status(200).json({ status: 1, message: "data found", data });
  } catch (error) {
    return res.status(500).json({ status: 0, message: error.message });
  }
};

const LiveStatusForCabin = async (req, res) => {
  try {
    const complexes = await Complex.findAll({
      include: [
        {
          model: CabinModel,
          as: "cabins",
          attributes: ["connection_status", "cabin_name"],
        },
      ],
      attributes: ["id", "name"],
    });

    const statusSummary = complexes.map((complex) => {
      const cabins = complex.cabins || [];

      const offlineCabins = cabins.filter(
        (cabin) => cabin.connection_status === "OFFLINE"
      );

      return {
        complex_id: complex.id,
        complex_name: complex.name,
        total_cabins: cabins.length,
        online_cabins: cabins.filter(
          (cabin) => cabin.connection_status === "ONLINE"
        ).length,
        offline_cabins: offlineCabins.length,
        offline_cabin_names: offlineCabins.map(
          (cabin) => cabin.cabin_name || "UNKNOWN"
        ), // ✅ Safely map names
      };
    });

    res.json({
      message: "Live Status fatched",
      status: "1",
      complexes: statusSummary,
      total_cabins: statusSummary.reduce((acc, c) => acc + c.total_cabins, 0),
      total_online: statusSummary.reduce((acc, c) => acc + c.online_cabins, 0),
      total_offline: statusSummary.reduce(
        (acc, c) => acc + c.offline_cabins,
        0
      ),
    });
  } catch (error) {
    console.error("LiveStatusForCabin Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const LiveStatusUpdate = async (req, res) => {
  try {
    // Step 1: Fetch all 40 cabins
    const cabins = await CabinModel.findAll({
      attributes: ["id", "complex_id", "cabin_name", "connection_status"],
    });

    // Step 2: Validate cabin count
    if (cabins.length !== 40) {
      return res
        .status(400)
        .json({ error: `Expected 40 cabins, found ${cabins.length}` });
    }

    // Step 3: Randomly decide total number of OFFLINE cabins
    const totalOffline =
      Math.random() < 0.5
        ? Math.floor(Math.random() * 16) // 0–15
        : Math.floor(Math.random() * 21) + 20; // 20–40
    const totalOnline = 40 - totalOffline;

    // Step 4: Group cabins by complex_id
    const cabinsByComplex = cabins.reduce((acc, cabin) => {
      if (!acc[cabin.complex_id]) acc[cabin.complex_id] = [];
      acc[cabin.complex_id].push(cabin);
      return acc;
    }, {});

    const complexIds = Object.keys(cabinsByComplex).map((id) => parseInt(id));
    complexIds.sort(() => Math.random() - 0.5); // Shuffle complex order

    // Step 5: Distribute OFFLINE cabins across complexes (max 4 per complex)
    const offlineCounts = {};
    let remainingOffline = totalOffline;

    complexIds.forEach((complexId, index) => {
      if (index === complexIds.length - 1) {
        offlineCounts[complexId] = Math.min(remainingOffline, 4);
      } else {
        const rand = Math.random();
        const maxPossible = Math.min(4, remainingOffline);
        if (rand < 0.3) {
          offlineCounts[complexId] = 0;
        } else if (rand < 0.6) {
          offlineCounts[complexId] = maxPossible;
        } else {
          offlineCounts[complexId] = Math.floor(
            Math.random() * (maxPossible + 1)
          );
        }
      }
      remainingOffline -= offlineCounts[complexId];
    });

    // Step 6: Prepare updates and summary
    const summary = {};
    const updates = [];

    // Step 7: Transactionally update status
    await sequelize.transaction(async (t) => {
      for (const complexId in cabinsByComplex) {
        const complexCabins = cabinsByComplex[complexId];
        const offlineCount = offlineCounts[complexId];

        // Shuffle cabins in this complex
        const shuffledCabins = complexCabins.sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffledCabins.length; i++) {
          const cabin = shuffledCabins[i];
          const newStatus = i < offlineCount ? "OFFLINE" : "ONLINE";

          updates.push({
            id: cabin.id,
            complex_id: cabin.complex_id,
            cabin_name: cabin.cabin_name,
            connection_status: newStatus,
          });

          await CabinModel.update(
            { connection_status: newStatus },
            { where: { id: cabin.id }, transaction: t }
          );

          if (!summary[complexId]) {
            summary[complexId] = {
              complex_id: parseInt(complexId),
              online_cabins: 0,
              offline_cabins: 0,
            };
          }
          summary[complexId][newStatus.toLowerCase() + "_cabins"]++;
        }
      }
    });

    // Step 8: Response summary
    const summaryArray = Object.values(summary);
    const totalSummary = {
      total_cabins: cabins.length,
      total_online: summaryArray.reduce(
        (acc, curr) => acc + curr.online_cabins,
        0
      ),
      total_offline: summaryArray.reduce(
        (acc, curr) => acc + curr.offline_cabins,
        0
      ),
    };

    console.log(
      "🔁 Cabin Statuses Updated:",
      updates.map((c) => `${c.cabin_name} → ${c.connection_status}`)
    );

    res.json({
      message: "Cabin statuses updated successfully",
      complexes: summaryArray,
      totalSummary,
    });
  } catch (error) {
    console.error("Error in LiveStatusUpdate:", error.message, error.stack);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const SpecificCabinConnectionStatusUpdate = async (req, res) => {
  try {
    const { complex_id, cabin_name, status } = req.body;

    // Validate inputs
    if (!complex_id || isNaN(complex_id)) {
      return res.status(400).json({ error: "Invalid or missing complex_id" });
    }
    if (!cabin_name || !["MWC", "FWC", "PWC", "MUW"].includes(cabin_name)) {
      return res.status(400).json({
        error: "Invalid or missing cabin_name. Must be MWC, FWC, PWC, or MUW",
      });
    }
    if (
      !status ||
      !["ONLINE", "OFFLINE", "Low data network", "Working"].includes(status)
    ) {
      return res.status(400).json({
        error:
          "Invalid or missing status. Must be ONLINE, OFFLINE, Low data network, or Working",
      });
    }

    // Fetch the specific cabin
    const cabin = await CabinModel.findOne({
      attributes: ["id", "cabin_name", "connection_status"],
      where: {
        complex_id: parseInt(complex_id),
        cabin_name,
      },
      include: [
        {
          model: Complex,
          as: "complex",
          attributes: ["name"],
          required: true,
        },
      ],
    });

    // Check if cabin exists
    if (!cabin) {
      return res.status(404).json({
        error: `Cabin ${cabin_name} not found in complex_id ${complex_id}`,
      });
    }

    // Update connection_status
    await sequelize.transaction(async (t) => {
      await CabinModel.update(
        { connection_status: status },
        {
          where: { id: cabin.id },
          transaction: t,
        }
      );
    });

    // Fetch updated status for summary
    const updatedCabins = await CabinModel.findAll({
      attributes: ["cabin_name", "connection_status"],
      where: { complex_id: parseInt(complex_id) },
      include: [
        {
          model: Complex,
          as: "complex",
          attributes: ["name"],
          required: true,
        },
      ],
    });

    // Generate summary
    const summary = {
      complex_name: cabin.complex.name,
      updated_cabin: {
        cabin_name: cabin.cabin_name,
        connection_status: status,
      },
      status_summary: {
        online_cabins: 0,
        offline_cabins: 0,
        low_data_network_cabins: 0,
        working_cabins: 0,
        non_online_cabin_names: [],
      },
    };

    updatedCabins.forEach((c) => {
      if (c.connection_status === "ONLINE") {
        summary.status_summary.online_cabins++;
      } else if (c.connection_status === "OFFLINE") {
        summary.status_summary.offline_cabins++;
        summary.status_summary.non_online_cabin_names.push(c.cabin_name);
      } else if (c.connection_status === "Low data network") {
        summary.status_summary.low_data_network_cabins++;
        summary.status_summary.non_online_cabin_names.push(c.cabin_name);
      } else if (c.connection_status === "Working") {
        summary.status_summary.working_cabins++;
        summary.status_summary.non_online_cabin_names.push(c.cabin_name);
      }
    });

    res.json({
      message: `Connection status updated successfully for cabin ${cabin_name} in complex_id ${complex_id}`,
      complex: summary,
    });
  } catch (error) {
    console.error(
      "Error in SpecificCabinConnectionStatusUpdate:",
      error.message
    );
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// const ComplexwiseLowWaterLevelList = async (req, res) => {
//   try {
//     const devices = await DeviceHealthStatus.findAll({
//       attributes: ["cabin_id", "freshWaterLevel", "recycleWaterLevel"],
//       // where: {
//       //   [Op.or]: [{ freshWaterLevel: "LOW" }, { recycleWaterLevel: "LOW" }],
//       // },
//       include: [
//         {
//           model: CabinModel,
//           as: "cabin",
//           attributes: ["complex_id", "cabin_name"],
//           required: true,
//           include: [
//             {
//               model: Complex,
//               as: "complex",
//               attributes: ["name"],
//               required: true,
//             },
//           ],
//         },
//       ],
//     });

//     const summary = devices.reduce((acc, device) => {
//       const complexId = device.cabin.complex_id;
//       const complexName = device.cabin.complex.name;
//       const cabinName = device.cabin.cabin_name;
//       if (!acc[complexId]) {
//         acc[complexId] = {
//           complexId: complexId,
//           complex_name: complexName,
//           low_water_cabins: 0,
//           low_water_cabin_names: [],
//         };
//       }
//       acc[complexId].low_water_cabins++;
//       acc[complexId].low_water_cabin_names.push(cabinName);
//       return acc;
//     }, {});

//     const summaryArray = Object.values(summary);

//     res.json({
//       message: "Low water level complexes retrieved successfully",
//       complexes: summaryArray,
//       devices,
//     });
//   } catch (error) {
//     console.error("Error in ComplexwiseLowWaterLevelList:", error.message);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };



const ComplexwiseLowWaterLevelList = async (req, res) => {
  try {
    const devices = await DeviceHealthStatus.findAll({
      attributes: ["cabin_id", "freshWaterLevel", "recycleWaterLevel"],
      where: {
        [Op.or]: [{ freshWaterLevel: "LOW" }, { recycleWaterLevel: "LOW" }],
      },
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });

    const summary = devices.reduce((acc, device) => {
      const complexId = device.cabin.complex_id;
      const complexName = device.cabin.complex.name;
      const cabinName = device.cabin.cabin_name;
      if (!acc[complexId]) {
        acc[complexId] = {
          complexId: complexId,
          complex_name: complexName,
          low_water_cabins: 0,
          low_water_cabin_names: [],
        };
      }
      acc[complexId].low_water_cabins++;
      acc[complexId].low_water_cabin_names.push(cabinName);
      return acc;
    }, {});

    const summaryArray = Object.values(summary);

    res.json({
      message: "Low water level complexes retrieved successfully",
      complexes: summaryArray,
      devices,
    });
  } catch (error) {
    console.error("Error in ComplexwiseLowWaterLevelList:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const WaterLevelStatusUpdate = async (req, res) => {
  try {
    // Fetch current water levels
    const devices = await DeviceHealthStatus.findAll({
      attributes: ["id", "cabin_id", "freshWaterLevel", "recycleWaterLevel"],
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });

    // Validate device count
    if (devices.length !== 40) {
      return res
        .status(400)
        .json({ error: `Expected 40 devices, found ${devices.length}` });
    }

    // Define toggle logic
    const waterLevels = ["HIGH", "MEDIUM", "LOW"];
    const toggleWaterLevel = (current) => {
      const currentIndex = waterLevels.indexOf(current);
      return waterLevels[(currentIndex + 1) % 3]; // Cycle: HIGH -> MEDIUM -> LOW -> HIGH
    };

    // Randomly decide total LOW count (skewed distribution)
    const totalLow =
      Math.random() < 0.5
        ? Math.floor(Math.random() * 31) // 0 to 30
        : Math.floor(Math.random() * 41) + 40; // 40 to 80 (out of 80 fields: 2 fields * 40 cabins)

    // Group devices by complex
    const devicesByComplex = devices.reduce((acc, device) => {
      const complexId = device.cabin.complex_id; // Fixed: Use device.cabin.complex_id
      if (!acc[complexId]) acc[complexId] = [];
      acc[complexId].push(device);
      return acc;
    }, {});

    // Distribute LOW counts across complexes
    const lowCounts = {};
    let remainingLow = totalLow;
    const complexIds = Object.keys(devicesByComplex).map((id) => parseInt(id));
    complexIds.sort(() => Math.random() - 0.5); // Shuffle complexes

    complexIds.forEach((complexId, index) => {
      if (index === complexIds.length - 1) {
        lowCounts[complexId] = Math.min(remainingLow, 8); // Max 8 (2 fields * 4 cabins)
      } else {
        const maxLow = Math.min(8, remainingLow);
        const rand = Math.random();
        lowCounts[complexId] =
          rand < 0.3
            ? 0
            : rand < 0.6
              ? maxLow
              : Math.floor(Math.random() * (maxLow + 1));
      }
      remainingLow -= lowCounts[complexId];
    });

    // Generate updates
    const summary = {};
    const updates = [];

    await sequelize.transaction(async (t) => {
      for (const complexId in devicesByComplex) {
        const complexDevices = devicesByComplex[complexId];
        let lowAssigned = 0;
        const shuffledDevices = complexDevices.sort(() => Math.random() - 0.5);

        for (const device of shuffledDevices) {
          const updateData = {};
          const fields = ["freshWaterLevel", "recycleWaterLevel"];
          fields.forEach((field) => {
            if (lowAssigned < lowCounts[complexId]) {
              updateData[field] = toggleWaterLevel(device[field]);
              if (updateData[field] === "LOW") lowAssigned++;
            } else {
              updateData[field] = toggleWaterLevel(device[field]);
              if (updateData[field] === "LOW") {
                // If LOW is assigned but quota is full, toggle again
                updateData[field] = toggleWaterLevel(updateData[field]);
              }
            }
          });

          // Update the device
          await DeviceHealthStatus.update(updateData, {
            where: { id: device.id },
            transaction: t,
          });

          // Track summary
          if (!summary[complexId]) {
            summary[complexId] = {
              complex_name: device.cabin.complex.name,
              low_water_cabins: 0,
              low_water_cabin_names: [],
            };
          }
          if (
            updateData.freshWaterLevel === "LOW" ||
            updateData.recycleWaterLevel === "LOW"
          ) {
            summary[complexId].low_water_cabins++;
            summary[complexId].low_water_cabin_names.push(
              device.cabin.cabin_name
            );
          }

          updates.push({
            id: device.id,
            cabin_id: device.cabin_id,
            complex_id: parseInt(complexId),
            ...updateData,
          });
        }
      }
    });

    // Convert summary to array
    const summaryArray = Object.values(summary);
    const totalSummary = {
      total_cabins_with_low_water: summaryArray.reduce(
        (acc, curr) => acc + curr.low_water_cabins,
        0
      ),
    };

    res.json({
      message: "Water level statuses updated successfully",
      complexes: summaryArray,
      totalSummary,
    });
  } catch (error) {
    console.error("Error in WaterLevelStatusUpdate:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const SpecificCabinWaterLevelUpdate = async (req, res) => {
  try {
    const { complex_id, cabin_name, freshWaterLevel, recycleWaterLevel } =
      req.body;

    // Validate inputs
    if (!complex_id || isNaN(complex_id)) {
      return res.status(400).json({ error: "Invalid or missing complex_id" });
    }
    if (!cabin_name || !["MWC", "FWC", "PWC", "MUW"].includes(cabin_name)) {
      return res.status(400).json({
        error: "Invalid or missing cabin_name. Must be MWC, FWC, PWC, or MUW",
      });
    }
    if (!freshWaterLevel && !recycleWaterLevel) {
      return res.status(400).json({
        error:
          "At least one of freshWaterLevel or recycleWaterLevel must be provided",
      });
    }
    if (
      freshWaterLevel &&
      !["HIGH", "MEDIUM", "LOW", "NORMAL"].includes(freshWaterLevel)
    ) {
      return res.status(400).json({
        error: "Invalid freshWaterLevel. Must be HIGH, MEDIUM, or LOW",
      });
    }
    if (
      recycleWaterLevel &&
      !["HIGH", "MEDIUM", "LOW", 'NORMAL'].includes(recycleWaterLevel)
    ) {
      return res.status(400).json({
        error: "Invalid recycleWaterLevel. Must be HIGH, MEDIUM, or LOW",
      });
    }

    // Fetch the specific cabin
    const device = await DeviceHealthStatus.findOne({
      attributes: ["id", "cabin_id", "freshWaterLevel", "recycleWaterLevel"],
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          where: {
            complex_id: parseInt(complex_id),
            cabin_name,
          },
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });

    // Check if device exists
    if (!device) {
      return res.status(404).json({
        error: `Cabin ${cabin_name} not found in complex_id ${complex_id}`,
      });
    }

    // Prepare update data
    const updateData = {};
    if (freshWaterLevel) updateData.freshWaterLevel = freshWaterLevel;
    if (recycleWaterLevel) updateData.recycleWaterLevel = recycleWaterLevel;

    // Update the device
    await sequelize.transaction(async (t) => {
      await DeviceHealthStatus.update(updateData, {
        where: { id: device.id },
        transaction: t,
      });
    });

    // Fetch updated data for summary
    const updatedDevices = await DeviceHealthStatus.findAll({
      attributes: ["cabin_id", "freshWaterLevel", "recycleWaterLevel"],
      where: {
        [Op.or]: [{ freshWaterLevel: "LOW" }, { recycleWaterLevel: "LOW" }],
      },
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          where: { complex_id: parseInt(complex_id) },
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });

    // Generate summary
    const summary = {
      complex_name: device.cabin.complex.name,
      low_water_cabins: 0,
      low_water_cabin_names: [],
    };
    updatedDevices.forEach((device) => {
      summary.low_water_cabins++;
      summary.low_water_cabin_names.push(device.cabin.cabin_name);
    });

    const totalSummary = {
      total_cabins_with_low_water: summary.low_water_cabins,
    };

    res.json({
      message: `Water level status updated successfully for cabin ${cabin_name} in complex_id ${complex_id}`,
      complex: summary,
      totalSummary,
    });
  } catch (error) {
    console.error("Error in SpecificCabinWaterLevelUpdate:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};



const UserDelete = async (req, res) => {
  try {
    const { user_id } = { ...req.body, ...req.query }; // Allow both query or body input

    // ✅ Validation
    if (!user_id) {
      return res.status(400).json({
        status: 0,
        message: "user_id is required",
      });
    }

    // ✅ Check if user exists
    const user = await Users.findOne({ where: { id: user_id } });
    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found",
      });
    }

    // ✅ Delete user
    await Users.destroy({ where: { id: user_id } });

    return res.status(200).json({
      status: 1,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in UserDelete:", error);
    return res.status(500).json({
      status: 0,
      message: "Server error",
      error: error.message,
    });
  }
};



// const AllComplexesFaultList = async (req, res) => {
//   try {
//     // Fetch all DeviceHealthStatus records with Cabin and Complex
//     const devices = await DeviceHealthStatus.findAll({
//       attributes: [
//         "cabin_id",
//         "flushHealth",
//         "floorCleanHealth",
//         "fanHealth",
//         "lightHealth",
//         "lockHealth",
//         "odsHealth",
//       ],
//       include: [
//         {
//           model: CabinModel,
//           as: "cabin",
//           attributes: ["complex_id", "cabin_name"],
//           required: true,
//           include: [
//             {
//               model: Complex,
//               as: "complex",
//               attributes: ["name"],
//               required: true,
//             },
//           ],
//         },
//       ],
//     });

//     // Validate device count
//     if (devices.length !== 40) {
//       return res
//         .status(400)
//         .json({ error: `Expected 40 devices, found ${devices.length}` });
//     }

//     // Check for undefined cabin_name
//     const invalidDevices = devices.filter(
//       (device) => !device.cabin || !device.cabin.cabin_name
//     );
//     if (invalidDevices.length > 0) {
//       return res.status(400).json({
//         error: "Invalid data",
//         details: `Found ${invalidDevices.length} devices with undefined cabin_name`,
//       });
//     }
//     const isFaulty = (field, value) => {
//       return value !== "OK" && value !== "Working" && value !== "GOOD";
//     };

//     // Group devices by complex and process faults
//     const summary = devices.reduce((acc, device) => {
//       const complexId = device.cabin.complex_id;
//       const complexName = device.cabin.complex.name;
//       const cabinName = device.cabin.cabin_name;

//       // Initialize complex in accumulator
//       if (!acc[complexId]) {
//         acc[complexId] = {
//           complex_name: complexName,
//           cabins: {},
//           total_faults: 0,
//         };
//       }

//       // Initialize cabin in complex
//       if (!acc[complexId].cabins[cabinName]) {
//         acc[complexId].cabins[cabinName] = {
//           cabin_name: cabinName,
//           faults: [],
//           fault_count: 0,
//         };
//       }

//       // Check each field for faults
//       const fields = [
//         "flushHealth",
//         "floorCleanHealth",
//         "fanHealth",
//         "lightHealth",
//         "lockHealth",
//         "odsHealth",
//       ];

//       fields.forEach((field) => {
//         if (isFaulty(field, device[field])) {
//           acc[complexId].cabins[cabinName].faults.push(
//             `${field}: ${device[field]}`
//           );
//           acc[complexId].cabins[cabinName].fault_count++;
//           acc[complexId].total_faults++;
//         }
//       });

//       return acc;
//     }, {});

//     // Convert summary to array
//     const complexes = Object.values(summary).map((complex) => ({
//       complex_name: complex.complex_name,
//       cabins: Object.values(complex.cabins),
//       total_faults: complex.total_faults,
//     }));

//     // Calculate total summary
//     const totalSummary = {
//       total_faulty_cabins: complexes.reduce((acc, complex) => {
//         return (
//           acc + complex.cabins.filter((cabin) => cabin.fault_count > 0).length
//         );
//       }, 0),
//       total_faults: complexes.reduce(
//         (acc, complex) => acc + complex.total_faults,
//         0
//       ),
//     };

//     res.json({
//       message: "Faults retrieved successfully for all complexes",
//       complexes,
//       totalSummary,
//     });
//   } catch (error) {
//     console.error("Error in AllComplexesFaultList:", error.message);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };



// const AllComplexesFaultList = async (req, res) => {
//   try {
//     // Fetch all DeviceHealthStatus records with Cabin and Complex
//     const devices = await DeviceHealthStatus.findAll({
//       attributes: [
//         "cabin_id",
//         "flushHealth",
//         "floorCleanHealth",
//         "fanHealth",
//         "lightHealth",
//         "lockHealth",
//         "odsHealth",
//       ],
//       include: [
//         {
//           model: CabinModel,
//           as: "cabin",
//           attributes: ["complex_id", "cabin_name"],
//           required: true,
//           include: [
//             {
//               model: Complex,
//               as: "complex",
//               attributes: ["name"],
//               required: true,
//             },
//           ],
//         },
//       ],
//     });

//     // Validate device count
//     if (devices.length !== 40) {
//       return res
//         .status(400)
//         .json({ error: `Expected 40 devices, found ${devices.length}` });
//     }

//     // Check for undefined cabin_name
//     const invalidDevices = devices.filter(
//       (device) => !device.cabin || !device.cabin.cabin_name
//     );
//     if (invalidDevices.length > 0) {
//       return res.status(400).json({
//         error: "Invalid data",
//         details: `Found ${invalidDevices.length} devices with undefined cabin_name`,
//       });
//     }

//     const isFaulty = (field, value) => {
//       return value !== "OK" && value !== "Working" && value !== "GOOD" && value !== "LOW";
//     };

//     // Group devices by complex and process faults
//     const summary = devices.reduce((acc, device) => {
//       const complexId = device.cabin.complex_id;
//       const complexName = device.cabin.complex.name;
//       const cabinName = device.cabin.cabin_name;

//       // Initialize complex in accumulator
//       if (!acc[complexId]) {
//         acc[complexId] = {
//           complex_name: complexName,
//           cabins: {},
//           total_faults: 0,
//         };
//       }

//       // Initialize cabin in complex
//       if (!acc[complexId].cabins[cabinName]) {
//         acc[complexId].cabins[cabinName] = {
//           cabin_name: cabinName,
//           faults: [],
//           fault_count: 0,
//         };
//       }

//       // Check each field for faults
//       const fields = [
//         "flushHealth",
//         "floorCleanHealth",
//         "fanHealth",
//         "lightHealth",
//         "lockHealth",
//         "odsHealth",
//       ];

//       fields.forEach((field) => {
//         if (isFaulty(field, device[field])) {
//           acc[complexId].cabins[cabinName].faults.push(
//             `${field}: ${device[field]}`
//           );
//           // Increment fault count by 1 per faulty cabin, not by number of faults
//           if (acc[complexId].cabins[cabinName].fault_count === 0) {
//             acc[complexId].cabins[cabinName].fault_count = 1;
//           }
//           acc[complexId].total_faults++;
//         }
//       });

//       return acc;
//     }, {});

//     // Convert summary to array
//     const complexes = Object.values(summary).map((complex) => ({
//       complex_name: complex.complex_name,
//       cabins: Object.values(complex.cabins),
//       total_faults: complex.total_faults,
//     }));

//     // Calculate total summary
//     const totalSummary = {
//       total_faulty_cabins: complexes.reduce((acc, complex) => {
//         return (
//           acc + complex.cabins.filter((cabin) => cabin.fault_count > 0).length
//         );
//       }, 0),
//       total_faults: complexes.reduce(
//         (acc, complex) => acc + complex.total_faults,
//         0
//       ),
//     };

//     res.json({
//       message: "Faults retrieved successfully for all complexes",
//       complexes,
//       totalSummary,
//     });
//   } catch (error) {
//     console.error("Error in AllComplexesFaultList:", error.message);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };



const AllComplexesFaultList = async (req, res) => {
  try {
    // Fetch all DeviceHealthStatus records with Cabin and Complex
    const devices = await DeviceHealthStatus.findAll({
      attributes: [
        "cabin_id",
        "flushHealth",
        "floorCleanHealth",
        "fanHealth",
        "lightHealth",
        "lockHealth",
        "odsHealth",
      ],
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });



    // Check for undefined cabin_name
    const invalidDevices = devices.filter(
      (device) => !device.cabin || !device.cabin.cabin_name
    );
    if (invalidDevices.length > 0) {
      return res.status(400).json({
        error: "Invalid data",
        details: `Found ${invalidDevices.length} devices with undefined cabin_name`,
      });
    }

    const isFaulty = (field, value) => {
      return value !== "OK" && value !== "Working" && value !== "GOOD" && value !== "NORMAL";
    };

    // Group devices by complex and process faults
    const summary = devices.reduce((acc, device) => {
      const complexId = device.cabin.complex_id;
      const complexName = device.cabin.complex.name;
      const cabinName = device.cabin.cabin_name;

      // Initialize complex in accumulator
      if (!acc[complexId]) {
        acc[complexId] = {
          complex_name: complexName,
          cabins: {},
          total_faulty_cabins: 0, // Initialize faulty cabins count
          total_faults: 0,         // Initialize total faults
        };
      }

      // Initialize cabin in complex
      if (!acc[complexId].cabins[cabinName]) {
        acc[complexId].cabins[cabinName] = {
          cabin_name: cabinName,
          faults: [],
          fault_count: 0,
        };
      }

      // Check each field for faults
      const fields = [
        "flushHealth",
        "floorCleanHealth",
        "fanHealth",
        "lightHealth",
        "lockHealth",
        "odsHealth",
      ];

      let cabinFaults = [];

      fields.forEach((field) => {
        if (isFaulty(field, device[field])) {
          cabinFaults.push(`${field}: ${device[field]}`);
        }
      });

      if (cabinFaults.length > 0) {
        acc[complexId].cabins[cabinName].faults = cabinFaults;
        acc[complexId].cabins[cabinName].fault_count = cabinFaults.length;

        // Increase total faults and faulty cabin count
        acc[complexId].total_faults += cabinFaults.length;
        acc[complexId].total_faulty_cabins += 1;
      }

      return acc;
    }, {});

    // Convert summary to array
    const complexes = Object.values(summary).map((complex) => ({
      complex_name: complex.complex_name,
      cabins: Object.values(complex.cabins),
      total_faulty_cabins: complex.total_faulty_cabins,
      total_faults: complex.total_faults,
    }));

    // Organize the response
    res.json({
      message: "Faults retrieved successfully for all complexes",
      complexes,
      totalSummary: {
        total_faulty_cabins: complexes.reduce((sum, complex) => sum + complex.total_faulty_cabins, 0),
        total_faults: complexes.reduce((sum, complex) => sum + complex.total_faults, 0),
      },
    });
  } catch (error) {
    console.error("Error in AllComplexesFaultList:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};




const SpecificCabinFaultUpdateByComplexName = async (req, res) => {
  try {
    const { complex_name, cabin_name, fault_key, new_value } = req.body;

    // Validate inputs
    if (!complex_name || typeof complex_name !== "string") {
      return res.status(400).json({ error: "Invalid or missing complex_name" });
    }
    if (!cabin_name || !["MWC", "FWC", "PWC", "MUW"].includes(cabin_name)) {
      return res.status(400).json({
        error: "Invalid or missing cabin_name. Must be MWC, FWC, PWC, or MUW",
      });
    }
    const validFields = [
      "flushHealth",
      "floorCleanHealth",
      "fanHealth",
      "freshWaterLevel",
      "lightHealth",
      "recycleWaterLevel",
      "tapHealth",
      "lockHealth",
      "odsHealth",
      "airDryerHealth",
      "chokeHealth",
    ];
    if (!fault_key || !validFields.includes(fault_key)) {
      return res.status(400).json({
        error:
          "Invalid or missing fault_key. Must be one of: " +
          validFields.join(", "),
      });
    }
    const waterLevelFields = ["freshWaterLevel", "recycleWaterLevel"];
    const validValues = waterLevelFields.includes(fault_key)
      ? ["HIGH", "MEDIUM", "LOW"]
      : ["OK", "Working", "Faulty", "Not Working", "GOOD"];
    if (!new_value || !validValues.includes(new_value)) {
      return res.status(400).json({
        error: `Invalid or missing new_value for ${fault_key}. Must be one of: ${validValues.join(
          ", "
        )}`,
      });
    }

    // Fetch complex_id from complex_name
    const complex = await Complex.findOne({
      attributes: ["id"],
      where: { name: complex_name },
    });

    if (!complex) {
      return res
        .status(404)
        .json({ error: `Complex ${complex_name} not found` });
    }
    const complex_id = complex.id;

    // Fetch the specific device
    const device = await DeviceHealthStatus.findOne({
      attributes: ["id", "cabin_id", ...validFields],
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          where: {
            complex_id,
            cabin_name,
          },
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });

    // Check if device exists
    if (!device) {
      return res.status(404).json({
        error: `Cabin ${cabin_name} not found in complex ${complex_name}`,
      });
    }

    // Check for undefined cabin_name
    if (!device.cabin || !device.cabin.cabin_name) {
      return res
        .status(400)
        .json({ error: "Cabin data is incomplete: cabin_name is undefined" });
    }

    // Update the specified field
    const updateData = { [fault_key]: new_value };
    await sequelize.transaction(async (t) => {
      await DeviceHealthStatus.update(updateData, {
        where: { id: device.id },
        transaction: t,
      });
    });

    // Fetch updated devices for the complex
    const updatedDevices = await DeviceHealthStatus.findAll({
      attributes: ["cabin_id", ...validFields],
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: ["complex_id", "cabin_name"],
          required: true,
          where: { complex_id },
          include: [
            {
              model: Complex,
              as: "complex",
              attributes: ["name"],
              required: true,
            },
          ],
        },
      ],
    });

    // Define fault conditions
    const isFaulty = (field, value) => {
      if (field === "freshWaterLevel" || field === "recycleWaterLevel") {
        return value === "LOW";
      }
      return value !== "OK" && value !== "Working" && value !== "GOOD";
    };

    // Generate summary
    const summary = {
      complex_name: device.cabin.complex.name,
      updated_cabin: {
        cabin_name,
        fault_key,
        new_value,
      },
      cabins: [],
      total_faults: 0,
    };

    updatedDevices.forEach((device) => {
      const cabinSummary = {
        cabin_name: device.cabin.cabin_name,
        faults: [],
        fault_count: 0,
      };

      validFields.forEach((f) => {
        if (isFaulty(f, device[f])) {
          cabinSummary.faults.push(`${f}: ${device[f]}`);
          cabinSummary.fault_count++;
          summary.total_faults++;
        }
      });

      summary.cabins.push(cabinSummary);
    });

    res.json({
      message: `Fault status updated successfully for cabin ${cabin_name} in complex ${complex_name}`,
      complex: summary,
    });
  } catch (error) {
    console.error(
      "Error in SpecificCabinFaultUpdateByComplexName:",
      error.message
    );
    res.status(500).json({ error: "Server error", details: error.message });
  }
};



// const TicketRisedList = async (req, res) => {
//   try {
//     const {
//       type,
//       status,
//       complex_id,
//       limit = 10,
//       offset = 0,
//     } = { ...req.query, ...req.body };

//     const whereClause = {};

//     if (!type || type === "ACTIVE") {
//       // ✅ All except closed
//       whereClause.status = { [Op.ne]: "Closed" };
//     } else if (type === "Closed") {
//       // ✅ Only closed
//       whereClause.status = "Closed";
//     } else if (
//       ["RAISED", "QUEUED", "SELF_ASSIGNED", "TEAM_ASSIGNED"].includes(type)
//     ) {
//       // ✅ Only that type + ignore closed
//       whereClause.type = type;
//       whereClause.status = { [Op.ne]: "Closed" };
//     }

//     // Optional: status filter override (only if needed separately)
//     if (
//       status &&
//       ["Active", "In Progress", "Queued", "Resolved"].includes(status) &&
//       type !== "ACTIVE" &&
//       type !== "CLOSED"
//     ) {
//       whereClause.status = status;
//     }

//     // Optional: Filter by complex
//     if (complex_id) {
//       whereClause.complex_id = complex_id;
//     }

//     const tickets = await TicketModel.findAll({
//       attributes: [
//         "id",
//         "ticket_id",
//         "complex_id",
//         "user_id",
//         "title",
//         "type",
//         "status",
//         "created_at",
//       ],
//       where: whereClause,
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       order: [["created_at", "DESC"]],
//     });
//     const total = await TicketModel.count({ where: whereClause });
//     if (tickets.length === 0) {
//       return res.status(404).send({
//         message: "Record not found",
//         status: "0",
//       });
//     }
//     res.json({
//       message: "Tickets retrieved successfully",
//       data: tickets,
//       pagination: {
//         total,
//         limit: parseInt(limit),
//         offset: parseInt(offset),
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Error in TicketRisedList:", error.message);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };


const TicketRisedList = async (req, res) => {
  try {
    const {
      type,
      status,
      complex_id,
      limit = 10,
      offset = 0,
    } = { ...req.query, ...req.body };

    const whereClause = {};

    if (!type || type === "ACTIVE") {
      // ✅ All except closed
      whereClause.status = { [Op.ne]: "Closed" };
    } else if (type === "Closed") {
      // ✅ Only closed
      whereClause.status = "Closed";
    } else if (
      ["RAISED", "QUEUED", "SELF_ASSIGNED", "TEAM_ASSIGNED"].includes(type)
    ) {
      // ✅ Only that type + ignore closed
      whereClause.type = type;
      whereClause.status = { [Op.ne]: "Closed" };
    }

    // Optional: status filter override (only if needed separately)
    if (
      status &&
      ["Active", "In Progress", "Queued", "Resolved"].includes(status) &&
      type !== "ACTIVE" &&
      type !== "CLOSED"
    ) {
      whereClause.status = status;
    }

    // Optional: Filter by complex
    if (complex_id) {
      whereClause.complex_id = complex_id;
    }

    const tickets = await TicketModel.findAll({
      attributes: [
        "id",
        "ticket_id",
        "title",
        "type",
        "status",
        "created_at",
        [TicketModel.sequelize.col("user.firstname"), "user_firstname"],
        [TicketModel.sequelize.col("user.lastname"), "user_lastname"],
        [TicketModel.sequelize.col("complex.name"), "complex_name"], // Assuming 'name' field in Complex model
      ],
      where: whereClause,
      include: [
        {
          model: Users,
          as: "user",
          attributes: [],
          required: true,
        },
        {
          model: Complex,
          as: "complex",
          attributes: [],
          required: true,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });
    const total = await TicketModel.count({
      where: whereClause,
      include: [
        {
          model: Users,
          as: "user",
          attributes: [],
          required: true,
        },
        {
          model: Complex,
          as: "complex",
          attributes: [],
          required: true,
        },
      ],
    });
    if (tickets.length === 0) {
      return res.status(404).send({
        message: "Record not found",
        status: "0",
      });
    }
    res.json({
      message: "Tickets retrieved successfully",
      data: tickets,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in TicketRisedList:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};


const TicketCreate = async (req, res) => {
  try {
    const {
      complex_id,
      title,
      description,
      client,
      city,
      district,
      state,
      criticality,
    } = req.body;
    const user_id = req.userId;
    const ticket_id = "TCKT_" + Date.now(); // 👈 fallback generate

    if (!complex_id || !user_id) {
      return res
        .status(400)
        .json({ error: "ticket_id, complex_id, and user_id are required" });
    }
    const ticket = await TicketModel.create({
      ticket_id,
      complex_id,
      user_id: req.userId,
      title,
      description,
      client,
      city,
      district,
      state,
      criticality,
      created_at: new Date(), // Current time: 02:43 AM IST, July 13, 2025
    });

    res.status(201).json({
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error in CreateTicket:", error.message);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Ticket ID must be unique" });
    }
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const UpdateTicketStatus = async (req, res) => {
  try {
    const { ticket_id, type, status } = req.body;

    if (!ticket_id) {
      return res.status(400).json({ error: "ticket_id is required" });
    }

    const updateData = {};
    if (
      type &&
      ["RAISED", "QUEUED", "SELF_ASSIGNED", "TEAM_ASSIGNED", "CLOSED"].includes(
        type
      )
    ) {
      updateData.type = type;
    }
    if (
      status &&
      ["Active", "In Progress", "Queued", "Closed"].includes(status)
    ) {
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one of type or status is required" });
    }

    const [updated] = await TicketModel.update(updateData, {
      where: { ticket_id },
      returning: true,
    });

    if (updated === 0) {
      return res
        .status(404)
        .json({ error: `Ticket with ticket_id ${ticket_id} not found` });
    }

    const ticket = await TicketModel.findOne({
      attributes: [
        "id",
        "ticket_id",
        "complex_id",
        "user_id",
        "title",
        "type",
        "status",
        "created_at",
      ],
      where: { ticket_id },
    });

    res.json({
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error in UpdateTicketStatus:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};


const getUsageProfile = async (req, res) => {
  try {
    const { days = 30, ComplexId } = req.body;
    const daysInt = parseInt(days);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - daysInt);
    const isMonthly = daysInt > 90;
    const dateGrouping = isMonthly
      ? [
        sequelize.literal("DATE_FORMAT(`UsageProfile`.`created_at`, '%Y-%m')"),
        "period",
      ]
      : [sequelize.literal("DATE(`UsageProfile`.`created_at`)"), "period"];

    const groupBy = ["period", "UsageProfile.cabin_id", "cabin.cabin_name"];
    const orderBy = [
      [sequelize.literal("period"), "ASC"],
      ["cabin_id", "ASC"],
    ];

    const whereConditions = {
      created_at: {
        [Op.gte]: daysAgo,
      },
    };



    const whereConditions2 = {}

    if (ComplexId) {
      whereConditions2["complex_id"] = ComplexId; // Assuming ComplexId is a field in the CabinModel
    }

    const userCounts = await UsageProfile.findAll({
      attributes: [
        [sequelize.col("UsageProfile.cabin_id"), "cabin_id"],
        [
          sequelize.fn("COUNT", sequelize.col("UsageProfile.id")),
          "total_entries",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.where(sequelize.col("UsageProfile.Entrytype"), "Entry")
          ),
          "user_count",
        ],
        [sequelize.col("cabin.cabin_name"), "cabin_name"],
        ...[dateGrouping], // ⬅️ adds period
      ],
      include: [
        {
          model: CabinModel,
          as: "cabin",
          attributes: [],
          required: true,
          where: whereConditions2, // This condition will be applied here
        },
      ],
      where: whereConditions,
      group: groupBy,
      order: orderBy,
    });

    const formattedData = userCounts.map((record) => ({
      period: record.get("period"), // 👈 period = date or month
      cabin_id: record.get("cabin_id"),
      cabin_name: record.get("cabin_name"),
      total_entries: record.get("total_entries"),
      user_count: record.get("user_count"),
    }));

    res.json({
      message: "Usage data retrieved successfully",
      data: formattedData,
      aggregation: isMonthly ? "monthly" : "daily",
    });
  } catch (error) {
    console.error("❌ Error in getUsageProfile:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};


const getUsageAndFeedback = async (req, res) => {
  try {
    const { days = 30, ComplexId } = req.body;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const whereConditions2 = {}

    if (ComplexId) {
      whereConditions2["complex_id"] = ComplexId; // Assuming ComplexId is a field in the CabinModel
    }


    const usageAndFeedbacks = await UsageAndFeedback.findAll({
      attributes: [
        "id",
        "cabin_id",
        "AverageFeedback",
        "created_at",
        "TotalUsage",
        "TotalWaterRecycled",
        // ... (jo aur chahiye wo bhi)
      ],
      where: {
        created_at: {
          [Op.gte]: daysAgo,
        },
      },
      include: [
        {
          model: CabinModel,
          where: whereConditions2, // This condition will be applied here
          as: "cabin",
          attributes: ["cabin_name"], // 🔥 yahi chahiye
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({
      message: "Usage and feedback data retrieved successfully",
      data: usageAndFeedbacks,
    });
  } catch (error) {
    console.error("Error in getUsageAndFeedback:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const CabinwiseHealthStatus = async (req, res) => {
  try {
    const { cabin_id } = req.body; // Get cabin_id from query string

    if (!cabin_id) {
      return res.status(400).json({ error: "cabin_id is required" });
    }
    const alldata = await CabinModel.findOne({
      where: { id: cabin_id },
      // attributes:["id"],
      include: [
        {
          model: DeviceHealthStatus,
          as: "deviceHealthStatus",
          required: false,
        },
        {
          model: GasConcentration,
          as: "gasReadings",
          required: false,
        },
        {
          model: CmsConfig,
          as: "cmsConfig",
          required: false,
        },
        {
          model: UcemsConfig,
          as: "ucemsConfig",
          required: false,
        },
        {
          model: OdsConfig,
          as: "odsConfig",
          required: false,
        },
        {
          model: UsageProfile,
          as: "usageProfiles",
          required: false,
        },
      ],
      // order: [["created_at", "DESC"]],
    });
    // Handle not found
    if (!alldata) {
      return res.status(404).json({ error: "No data found for this cabin_id" });
    }
    res.json({
      message: "Cabin health status retrieved successfully",
      alldata,
    });
  } catch (error) {
    console.error("Error in CabinwiseHealthStatus:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};



module.exports = {
  userlogin,
  changepassword,
  useradd,
  UserActiveInActive,
  getUserDetails,
  ProfileUpdate,
  Sitelist,
  ComplexData,
  LiveStatusForCabin,
  LiveStatusUpdate,
  ComplexwiseLowWaterLevelList,
  AllComplexesFaultList,
  SpecificCabinFaultUpdateByComplexName,
  TicketRisedList,
  TicketCreate,
  UpdateTicketStatus,
  userList,
  WaterLevelStatusUpdate,
  SpecificCabinWaterLevelUpdate,
  SpecificCabinConnectionStatusUpdate,
  getUsageProfile,
  getUsageAndFeedback,
  CabinwiseHealthStatus,
  UserDelete
  // AllComplexData,
};
