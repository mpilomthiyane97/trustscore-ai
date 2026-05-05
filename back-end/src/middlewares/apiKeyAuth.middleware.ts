import { NextFunction, Request, Response } from "express";
import { env } from "../utils/env";
import { HttpError } from "../utils/httpError";

export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return next(new HttpError(401, "Missing API key. Use x-api-key header."));
  }

  if (apiKey !== env.apiKey) {
    return next(new HttpError(401, "Invalid API key."));
  }

  return next();
}
