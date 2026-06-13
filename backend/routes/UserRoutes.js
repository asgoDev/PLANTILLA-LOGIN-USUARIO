import { Router } from "express";
import userController from "../controllers/UserController.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "../validations/user.js";

const router = Router();

router.use(authenticate);
router.use(authorize("admin"));

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", validate(createUserSchema), userController.createUser);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
