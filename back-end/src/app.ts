import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./utils/env";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware";
import { healthRouter } from "./routes/health.routes";
import { riskRouter } from "./routes/risk.routes";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.middleware";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(requestLogger);
app.use(apiRateLimiter);

app.use(healthRouter);
app.use("/api", riskRouter);

app.use(notFoundHandler);
app.use(errorHandler);
