const express = require("express");
const { registerUser, loginUser, getUser, getUserOrganisations, getOrganizationById, createOrganization, addUserToOrganization } = require("../controller/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", authMiddleware, loginUser);
router.get("/users/:id", authMiddleware, getUser);
router.get("/organisations", authMiddleware, getUserOrganisations);
router.get("/organisations/:orgId", authMiddleware, getOrganizationById);
router.post("/organisations", authMiddleware, createOrganization);
router.post("/organisations/:orgId/users", addUserToOrganization);



module.exports = router;