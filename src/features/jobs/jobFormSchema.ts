import { z } from "zod";

const salarySchema = z.string().trim().refine(
  (value) =>
    value === "" ||
    (
      /^\d+$/.test(value) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) > 0
    ),
  {
    message: "Introduce un salario positivo, sin puntos ni comas",
  }
);

export const jobFormSchema = z.object({
  technologies_input: z.string().trim().max(500, {
  message: "La lista de tecnologías es demasiado larga",
}),

next_action: z.string().trim().max(200, {
  message: "La próxima acción no puede superar los 200 caracteres",
}),

next_action_at: z.string().refine(
  (value) =>
    value === "" ||
    (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
      !Number.isNaN(new Date(value).getTime())
    ),
  {
    message: "Introduce una fecha y hora válidas",
  }
),
  salary_min: salarySchema,
  salary_max: salarySchema,
  currency: z.enum(["EUR", "USD", "GBP"]),

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

  job_url: z.string().trim().refine(
  (value) =>
    value === "" ||
    z.url({ protocol: /^https?$/ }).safeParse(value).success,
  {
    message: "Introduce una URL válida (http:// o https://)",
  }
),

notes: z.string().trim().max(2000, {
  message: "Las notas no pueden superar los 2000 caracteres",
}),
}).refine(
  (values) => {
    if (!values.salary_min || !values.salary_max) {
      return true;
    }

    if (
      !salarySchema.safeParse(values.salary_min).success ||
      !salarySchema.safeParse(values.salary_max).success
    ) {
      return true;
    }

    return Number(values.salary_max) >= Number(values.salary_min);
  },
  {
    message: "El salario máximo no puede ser inferior al mínimo",
    path: ["salary_max"],
  }
);;

export type JobFormValues = z.infer<typeof jobFormSchema>;