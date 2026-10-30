// import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";

import type { Application } from "express";

export const registerRoutes = (app: Application): void => {
  // app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
};
