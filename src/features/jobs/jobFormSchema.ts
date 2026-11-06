import { z } from "zod";

export const jobFormSchema = z.object({
  company: z.string().trim().min(1, {
    message: "La empresa es obligatoria",
  }),

  position: z.string().trim().min(1, {
    message: "El puesto es obligatorio",
  }),

  status: z.enum([
    "pending",
    "applied",
    "interview",
    "technical_test",
    "offer",
    "rejected",
  ]),

  location: z.string().trim().min(1, {
    message: "La ubicación es obligatoria",
  }),

  work_mode: z.enum([
    "remote",
    "hybrid",
    "onsite",
  ]),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;