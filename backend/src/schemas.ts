import { z } from 'zod';

export const bookingSchema = z.object({
  lr_number: z.string(),
  branch_id: z.string(),
  article_id: z.string(),
  quantity: z.number(),
  actual_weight: z.number(),
  freight_per_qty: z.number(),
});

export const customerSchema = z.object({
  branch_id: z.string(),
  name: z.string(),
  mobile: z.string(),
});

export const vehicleSchema = z.object({
  branch_id: z.string(),
  number: z.string(),
});

export const articleSchema = z.object({
  branch_id: z.string(),
  name: z.string(),
  base_rate: z.number(),
});

export const branchSchema = z.object({
  organization_id: z.string(),
  name: z.string(),
  city: z.string(),
});
