import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Phone number must be 7-15 digits and may start with +")
  .transform((value) => (value.startsWith("+") ? value : `+${value}`));

export const checkNumberRiskSchema = z.object({
  phoneNumber: phoneNumberSchema,
  numberVerificationCode: z.string().trim().min(1).optional(),
  numberVerificationState: z.string().trim().min(1).optional(),
  locationLatitude: z.number().min(-90).max(90).optional(),
  locationLongitude: z.number().min(-180).max(180).optional(),
  locationRadiusMeters: z.number().positive().optional(),
  locationMaxAgeSeconds: z.number().int().positive().optional(),
}).superRefine((value, ctx) => {
  const hasCode = Boolean(value.numberVerificationCode);
  const hasState = Boolean(value.numberVerificationState);

  if (hasCode !== hasState) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "numberVerificationCode and numberVerificationState must be provided together",
      path: [hasCode ? "numberVerificationState" : "numberVerificationCode"],
    });
  }

  const locationFields = [
    value.locationLatitude,
    value.locationLongitude,
    value.locationRadiusMeters,
  ];
  const providedCount = locationFields.filter((field) => field !== undefined).length;
  if (providedCount > 0 && providedCount < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "locationLatitude, locationLongitude, and locationRadiusMeters must be provided together",
      path: ["locationLatitude"],
    });
  }
});

export const numberVerificationAuthorizationLinkSchema = z.object({
  phoneNumber: phoneNumberSchema,
  redirectUri: z.string().url().optional(),
  scope: z.string().trim().min(1).optional(),
});

export const numberVerificationCallbackSchema = z.object({
  code: z.string().trim().min(1),
  state: z.string().trim().min(1),
});

export type CheckNumberRiskInput = z.infer<typeof checkNumberRiskSchema>;
