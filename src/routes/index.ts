import { Router } from "express";

import docsRoutes from "@/routes/docs.routes";
import healthRoutes from "@/routes/health.routes";
import userRoutes from "@/routes/users.routes";

const router = Router();

router.use(healthRoutes);
router.use(docsRoutes);
router.use("/api/v1/users", userRoutes);

export default router;
