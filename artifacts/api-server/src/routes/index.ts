import { Router, type IRouter } from "express";
import healthRouter from "./health";
import barbersRouter from "./barbers";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(barbersRouter);
router.use(adminRouter);

export default router;
