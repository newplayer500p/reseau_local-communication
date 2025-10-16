
import express from 'express';
import { adminDeleteUser, adminUpdateUserStatus, comparePassword, deleteCompte, getAProfile, listUsersForAdmin, updateProfile } from '../controllers/user.controller.js';
import upload from '../middlewars/multerMiddlewar.js';
import { checkAdmin } from '../middlewars/adminMiddlewar.js';

const router_user = express.Router();

router_user.get("/admin/users", checkAdmin, listUsersForAdmin);
router_user.patch("/admin/users/:email/status", checkAdmin, adminUpdateUserStatus);
router_user.delete("/admin/users/:email", checkAdmin, adminDeleteUser);

router_user.get("/profile", getAProfile);
router_user.post("/verifyPassword", comparePassword);
router_user.post("/changeProfile", upload.single("avatar"), updateProfile);
router_user.delete("/deleteProfile", deleteCompte);

export default router_user;