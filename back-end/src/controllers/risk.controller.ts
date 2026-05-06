import { Request, Response, NextFunction } from "express";
import {
  checkDeviceStatusDetailed,
  checkSimSwapDetailed,
  verifyLocationDetailed,
} from "../services/telecom.service";
import { calculateRisk } from "../services/riskEngine.service";
import { addRiskLog, getLastRiskLogs } from "../services/logStore.service";
import {
  checkNumberRiskSchema,
} from "../utils/validation";
import { logInfo } from "../utils/logger";
import {
  LocationVerificationInput,
} from "../types/risk.types";

export async function checkNumberRiskController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      phoneNumber,
      locationLatitude,
      locationLongitude,
      locationRadiusMeters,
      locationMaxAgeSeconds,
    } = checkNumberRiskSchema.parse(req.body);

    const [simSwapInsight, deviceInsight, locationInsight] = await Promise.all([
      checkSimSwapDetailed(phoneNumber),
      checkDeviceStatusDetailed(phoneNumber),
      verifyLocationDetailed(phoneNumber, {
        latitude: locationLatitude,
        longitude: locationLongitude,
        radiusMeters: locationRadiusMeters,
        maxAgeSeconds: locationMaxAgeSeconds,
      } as LocationVerificationInput),
    ]);

    const result = calculateRisk(phoneNumber, {
      simSwapRecent: simSwapInsight.value,
      newDevice: deviceInsight.value,
      locationAnomaly: locationInsight.value,
    });

    result.telecomInsights = {
      simSwapRecent: simSwapInsight,
      newDevice: deviceInsight,
      locationAnomaly: locationInsight,
      capabilitiesUsed: [
      "SIM swap check",
      "Device status",
      "Location verification",
      ],
    };

    addRiskLog({
      timestamp: new Date().toISOString(),
      phoneNumber,
      trustScore: result.trustScore,
      riskLevel: result.riskLevel,
      recommendedAction: result.recommendedAction,
    });

    logInfo("Risk check completed", {
      timestamp: new Date().toISOString(),
      phoneNumber,
      trustScore: result.trustScore,
      riskLevel: result.riskLevel,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRiskLogsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({ logs: getLastRiskLogs(20) });
  } catch (error) {
    next(error);
  }
}
