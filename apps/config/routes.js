const express = require('express');
const authMiddleware = require('../../apps/middleware/auth.js');
const Router = express.Router();
const userController = require('../../apps/controllers/UserController');

Router.post('/user-login', userController.userlogin); // Use userController.createUser
Router.get('/user-list', userController.userList); // Use userController.createUser
Router.post('/user-add', authMiddleware, userController.useradd);
Router.post('/change-password', authMiddleware, userController.changepassword);
Router.post('/profile-update',authMiddleware,userController.ProfileUpdate);
Router.post('/User-Status-update',authMiddleware,userController.UserActiveInActive);
Router.get('/User-details',authMiddleware,userController.getUserDetails);


Router.get("/health-status",authMiddleware,userController.AllComplexesFaultList)
Router.get("/live-status",authMiddleware,userController.LiveStatusForCabin)
Router.get("/water-level-status",authMiddleware,userController.ComplexwiseLowWaterLevelList)

Router.post("/live-status-update",authMiddleware,userController.LiveStatusUpdate)
Router.post("/water-level-status-update",authMiddleware,userController.WaterLevelStatusUpdate)
Router.post("/update-single-cabin-water-level",authMiddleware,userController.SpecificCabinWaterLevelUpdate)
Router.post("/update-single-live-status",authMiddleware,userController.SpecificCabinConnectionStatusUpdate)
Router.post("/complexwise-cabin-list",authMiddleware,userController.ComplexData)
Router.post("/cabinwise-health-status",authMiddleware,userController.CabinwiseHealthStatus)


Router.post("/health-status-update",authMiddleware,userController.SpecificCabinFaultUpdateByComplexName)
Router.post("/ticket-list",authMiddleware,userController.TicketRisedList);
Router.post("/ticket-create",authMiddleware,userController.TicketCreate);
Router.post("/ticket-status-update",authMiddleware,userController.UpdateTicketStatus);

Router.post("/usage-profile",authMiddleware,userController.getUsageProfile);
Router.post("/usage-and-feedback",authMiddleware,userController.getUsageAndFeedback);

Router.get("/complex-list",authMiddleware,userController.Sitelist)

module.exports = Router;


