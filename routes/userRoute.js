const express = require("express");
const { registerUser, loginUser, getUser, getUserOrganisations, getOrganizationById, createOrganization, addUserToOrganization } = require("../controller/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", authMiddleware, loginUser);
router.get("/api/users/:id", authMiddleware, getUser);
router.get("/api/organisations", authMiddleware, getUserOrganisations);
router.get("/api/organisations/:orgId", authMiddleware, getOrganizationById);
router.post("/api/organisations", authMiddleware, createOrganization);
router.post("/api/organisations/:orgId/users", addUserToOrganization);



module.exports = router;