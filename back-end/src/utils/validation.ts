import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Phone number must be 7-15 digits and may start with +")
  .transform((value) => (value.startsWith("+") ? value : `+${value}`));

export const checkNumberRiskSchema = z.object({
  phoneNumber: phoneNumberSchema,
  locationLatitude: z.number().min(-90).max(90).optional(),
  locationLongitude: z.number().min(-180).max(180).optional(),
  locationRadiusMeters: z.number().positive().optional(),
  locationMaxAgeSeconds: z.number().int().positive().optional(),
}).superRefine((value, ctx) => {
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

export type CheckNumberRiskInput = z.infer<typeof checkNumberRiskSchema>;
