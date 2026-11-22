
import { describe, expect, it } from "vitest";

import type { JobStatus } from "../../types/job";
import type { JobHistorySummary } from "../../services/jobHistoryService";

import {
  filterJobsByPeriod,
  calculateDashboardMetrics,
  buildWeeklyActivity,
  type DashboardJob,
} from "./dashboardStats";

function makeJob(
  id: string,
  status: JobStatus,
  created_at = "2026-11-18T12:00:00.000Z"
): DashboardJob {
  return { id, status, created_at };
}

describe("filterJobsByPeriod", () => {
  const now = Date.parse("2026-11-18T12:00:00Z");

  const jobs = [
    makeJob("1", "applied", "2026-11-15T12:00:00Z"),
    makeJob("2", "interview", "2026-10-01T12:00:00Z"),
    makeJob("3", "rejected", "2026-07-01T12:00:00Z"),
  ];

  it("incluye todas las candidaturas sin filtro", () => {
    expect(
      filterJobsByPeriod(jobs, "all", now)
    ).toHaveLength(3);
  });

  it("filtra correctamente los últimos 30 días", () => {
    const result = filterJobsByPeriod(jobs, "30", now);

    expect(result.map((job) => job.id)).toEqual(["1"]);
  });

  it("filtra correctamente los últimos 90 días", () => {
    const result = filterJobsByPeriod(jobs, "90", now);

    expect(result.map((job) => job.id)).toEqual([
      "1",
      "2",
    ]);
  });
});

describe("calculateDashboardMetrics", () => {
  it("cuenta entrevistas históricas aunque la candidatura esté rechazada", () => {
    const jobs = [
      makeJob("1", "rejected"),
      makeJob("2", "interview"),
      makeJob("3", "pending"),
      makeJob("4", "offer"),
    ];

    const history: JobHistorySummary[] = [
      {
        job_id: "1",
        old_status: "applied",
        new_status: "interview",
      },
      {
        job_id: "1",
        old_status: "interview",
        new_status: "rejected",
      },
    ];

    const result = calculateDashboardMetrics(
      jobs,
      history
    );

    expect(result.totalJobs).toBe(4);
    expect(result.sentJobs).toBe(3);
    expect(result.interviewJobs).toBe(1);
    expect(result.reachedInterview).toBe(2);
    expect(result.reachedOffer).toBe(1);
    expect(result.interviewRate).toBeCloseTo(66.67, 1);
    expect(result.offerRate).toBeCloseTo(33.33, 1);
  });

  it("no cuenta dos veces una candidatura entrevistada", () => {
    const jobs = [makeJob("1", "rejected")];

    const history: JobHistorySummary[] = [
      {
        job_id: "1",
        old_status: "applied",
        new_status: "interview",
      },
      {
        job_id: "1",
        old_status: "interview",
        new_status: "applied",
      },
      {
        job_id: "1",
        old_status: "applied",
        new_status: "interview",
      },
    ];

    const result = calculateDashboardMetrics(
      jobs,
      history
    );

    expect(result.reachedInterview).toBe(1);
    expect(result.interviewRate).toBe(100);
  });

  it("no divide entre cero sin candidaturas enviadas", () => {
    const result = calculateDashboardMetrics(
      [makeJob("1", "pending")],
      []
    );

    expect(result.sentJobs).toBe(0);
    expect(result.interviewRate).toBeNull();
    expect(result.offerRate).toBeNull();
  });
});

describe("buildWeeklyActivity", () => {
  it("agrupa las candidaturas en semanas de lunes a domingo", () => {
    const today = new Date(2026, 10, 18, 12);

    const jobs = [
      makeJob(
        "1",
        "applied",
        new Date(2026, 10, 16, 12).toISOString()
      ),
      makeJob(
        "2",
        "applied",
        new Date(2026, 10, 9, 12).toISOString()
      ),
      makeJob(
        "3",
        "applied",
        new Date(2026, 10, 8, 12).toISOString()
      ),
    ];

    const result = buildWeeklyActivity(jobs, today);

    expect(result).toHaveLength(8);
    expect(result.at(-1)?.registered).toBe(1);
    expect(result.at(-2)?.registered).toBe(1);
    expect(result.at(-3)?.registered).toBe(1);
  });
});

