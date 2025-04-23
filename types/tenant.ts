import { z } from "zod";

export enum ROLE {
  AD = "AD",
  SU = "SU",
}
export const TenantEntrySchema = z.object({
  partyId: z
    .string()
    .regex(/^[A-Z]{3}$/, "partyId must be exactly 3 uppercase alphabetical letters"),
  countryCode: z.string(),
  name: z.string(),
  logoImageUrl: z.string().optional(),
  primaryColorCode: z.string().optional(),
  senderEmailId: z.string().optional(),
  androidAppUrl: z.string().optional(),
  iosAppUrl: z.string().optional(),
});

export const UserEntrySchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  country_calling_code: z.string(),
  contact_number: z.string(),
  role: z.nativeEnum(ROLE),
  is_tenant_admin: z.boolean().optional(),
  disable2FA: z.boolean().optional(),
});

export const BusinessDetailEntrySchema = z.object({
  name: z.string(),
  websiteUrl: z.string().url().optional(),
  email: z.string().email(),
  contactNumber: z.string(),
  countryCallingCode: z.string(),
  brandColor: z.string().optional(),
});

export const SettingsEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const OnboardTenantDtoSchema = z.object({
  tenant: TenantEntrySchema,
  users: z.array(UserEntrySchema),
  businessDetail: BusinessDetailEntrySchema,
  settings: z.array(SettingsEntrySchema).optional(),
});

export type TenantEntry = z.infer<typeof TenantEntrySchema>;
export type UserEntry = z.infer<typeof UserEntrySchema>;
export type BusinessDetailEntry = z.infer<typeof BusinessDetailEntrySchema>;
export type SettingsEntry = z.infer<typeof SettingsEntrySchema>;
export type OnboardTenantDto = z.infer<typeof OnboardTenantDtoSchema>;
