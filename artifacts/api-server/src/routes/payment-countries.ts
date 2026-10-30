import { Router, type IRouter } from "express";
import { ListPaymentCountriesResponse } from "@workspace/api-zod";
import { getPaymentCountries } from "../lib/payment-countries";

const router: IRouter = Router();

router.get("/payment-countries", async (_req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  res.json(ListPaymentCountriesResponse.parse(await getPaymentCountries()));
});

export default router;
