import { Router, type IRouter } from "express";
import healthRouter from "./health";
import barbersRouter from "./barbers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(barbersRouter);

export default router;
