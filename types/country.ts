import { z } from "zod";

export const StateSchema = z.object({
  code: z.string().length(2),
  name: z.string().min(1),
  cities: z.array(z.string()).min(1),
});

export const CurrencySchema = z.object({
  code: z.string().length(3).toUpperCase(),
  currency: z.string(),
  number: z.number().int().max(999),
});

export const CountrySchema = z.object({
  name: z.string().min(1),
  code_alpha_2: z.string().length(2).toUpperCase(),
  code_alpha_3: z.string().length(3).toUpperCase(),
  countryCallingCode: z.string().regex(/^\+\d{1,5}$/),
  currencies: z.array(CurrencySchema).min(1),
  timezones: z.array(z.string()).min(1),
  states: z.array(StateSchema).min(1).optional(),
});

export type State = z.infer<typeof StateSchema>;
export type Country = z.infer<typeof CountrySchema>;
export type Currency = z.infer<typeof CurrencySchema>;
