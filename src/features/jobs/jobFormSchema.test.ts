
import { describe, expect, it } from "vitest";
import { jobFormSchema } from "./jobFormSchema";

const validJob = {
  company: "Google",
  position: "Frontend Developer",
  status: "applied",
  location: "Bilbao",
  work_mode: "remote",
  job_url: "https://example.com",
  notes: "",
  salary_min: "25000",
  salary_max: "35000",
  currency: "EUR",
  technologies_input: "React, TypeScript",
  next_action: "",
  next_action_at: "",
};

describe("jobFormSchema", () => {
  it("acepta una candidatura válida", () => {
    const result = jobFormSchema.safeParse(validJob);

    expect(result.success).toBe(true);
  });

  it("rechaza una empresa vacía", () => {
    const result = jobFormSchema.safeParse({
      ...validJob,
      company: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rechaza un salario máximo inferior al mínimo", () => {
    const result = jobFormSchema.safeParse({
      ...validJob,
      salary_min: "35000",
      salary_max: "25000",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === "salary_max"
        )
      ).toBe(true);
    }
  });

  it("rechaza una URL no válida", () => {
    const result = jobFormSchema.safeParse({
      ...validJob,
      job_url: "esto-no-es-una-url",
    });

    expect(result.success).toBe(false);
  });
});
