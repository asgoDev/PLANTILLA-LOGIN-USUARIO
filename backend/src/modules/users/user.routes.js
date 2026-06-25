import { Router } from "express";
import { authenticate, authorize } from "../../shared/middleware/auth.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./user.validation.js";

const createUserRoutes = (userController) => {
  const router = Router();

  router.use(authenticate);
  router.use(authorize("admin"));

  router.get("/", (req, res, next) => userController.getUsers(req, res, next));
  router.get("/:id", (req, res, next) => userController.getUserById(req, res, next));
  router.post("/", validate(createUserSchema), (req, res, next) => userController.createUser(req, res, next));
  router.put("/:id", validate(updateUserSchema), (req, res, next) => userController.updateUser(req, res, next));
  router.delete("/:id", (req, res, next) => userController.deleteUser(req, res, next));

  return router;
};

export default createUserRoutes;
