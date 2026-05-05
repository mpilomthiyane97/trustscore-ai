import { Router } from "express";
import {
  checkNumberRiskController,
  createNumberVerificationAuthorizationLinkController,
  getRiskLogsController,
  numberVerificationCallbackController,
} from "../controllers/risk.controller";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.middleware";

const riskRouter = Router();

riskRouter.post("/check-number-risk", apiKeyAuth, checkNumberRiskController);
riskRouter.get("/logs", apiKeyAuth, getRiskLogsController);
riskRouter.post(
  "/number-verification/authorization-link",
  apiKeyAuth,
  createNumberVerificationAuthorizationLinkController
);
riskRouter.get("/number-verification/callback", numberVerificationCallbackController);

export { riskRouter };
