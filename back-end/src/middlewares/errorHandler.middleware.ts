import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "Route not found"));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    "statusCode" in err &&
    (err as { type?: string }).type === "entity.parse.failed" &&
    (err as { statusCode?: number }).statusCode === 400
  ) {
    res.status(400).json({
      error: "Validation failed",
      message: "Malformed JSON payload.",
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      message: "Request payload is invalid.",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  console.error("Unhandled error", err);
  res.status(500).json({
    error: "Internal server error",
    message: "Unexpected server error occurred.",
  });
}
