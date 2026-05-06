import { Router } from "express";
import {
  checkNumberRiskController,
  getRiskLogsController,
} from "../controllers/risk.controller";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.middleware";

const riskRouter = Router();

riskRouter.post("/check-number-risk", apiKeyAuth, checkNumberRiskController);
riskRouter.get("/logs", apiKeyAuth, getRiskLogsController);

export { riskRouter };
