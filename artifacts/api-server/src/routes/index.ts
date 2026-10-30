import { Router, type IRouter } from "express";
import healthRouter from "./health";
import barbersRouter from "./barbers";
import adminRouter from "./admin";
import barberPortalRouter from "./barber-portal";
import paymentCountriesRouter from "./payment-countries";
import customersRouter from "./customers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(barbersRouter);
router.use(adminRouter);
router.use(barberPortalRouter);
router.use(paymentCountriesRouter);
router.use(customersRouter);

export default router;
