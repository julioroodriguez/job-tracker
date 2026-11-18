
import type { JobStatus } from "../../types/job";
import type { JobHistorySummary } from "../../services/jobHistoryService";

export type DashboardJob = {
  id: string;
  status: JobStatus;
  created_at: string;
};

export type DashboardPeriod = "all" | "30" | "90";

// Filtrar candidaturas por período
export function filterJobsByPeriod(
  jobs: DashboardJob[],
  period: DashboardPeriod,
  referenceTime: number
): DashboardJob[] {
  if (period === "all") {
    return jobs;
  }

  const days = Number(period);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const cutoff =
    referenceTime - days * millisecondsPerDay;

  return jobs.filter((job) => {
    const createdAt = new Date(job.created_at).getTime();

    return (
      createdAt >= cutoff &&
      createdAt <= referenceTime
    );
  });
}

// Agrupar candidaturas por semana
export function buildWeeklyActivity(
  jobs: DashboardJob[],
  today: Date = new Date()
) {
  const currentMonday = new Date(today);
  currentMonday.setHours(0, 0, 0, 0);

  const daysSinceMonday =
    (currentMonday.getDay() + 6) % 7;

  currentMonday.setDate(
    currentMonday.getDate() - daysSinceMonday
  );

  return Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(currentMonday);

    weekStart.setDate(
      currentMonday.getDate() - (7 - index) * 7
    );

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const registered = jobs.filter((job) => {
      const createdAt = new Date(
        job.created_at
      ).getTime();

      return (
        createdAt >= weekStart.getTime() &&
        createdAt < weekEnd.getTime()
      );
    }).length;

    return {
      week: weekStart.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      }),
      registered,
    };
  });
}

// Calcular los indicadores y las conversiones
export function calculateDashboardMetrics(
  jobs: DashboardJob[],
  history: JobHistorySummary[]
) {
  const interviewIds = new Set(
    history
      .filter(
        (entry) =>
          entry.old_status === "interview" ||
          entry.new_status === "interview"
      )
      .map((entry) => entry.job_id)
  );

  const offerIds = new Set(
    history
      .filter(
        (entry) =>
          entry.old_status === "offer" ||
          entry.new_status === "offer"
      )
      .map((entry) => entry.job_id)
  );

  const previouslySentIds = new Set(
    history
      .filter(
        (entry) =>
          entry.old_status !== "pending" ||
          entry.new_status !== "pending"
      )
      .map((entry) => entry.job_id)
  );

  const sentPeriodJobs = jobs.filter(
    (job) =>
      job.status !== "pending" ||
      previouslySentIds.has(job.id)
  );

  const totalJobs = jobs.length;
  const sentJobs = sentPeriodJobs.length;

  const interviewJobs = jobs.filter(
    (job) => job.status === "interview"
  ).length;

  const offerJobs = jobs.filter(
    (job) => job.status === "offer"
  ).length;

  const reachedInterview = sentPeriodJobs.filter(
    (job) =>
      job.status === "interview" ||
      interviewIds.has(job.id)
  ).length;

  const reachedOffer = sentPeriodJobs.filter(
    (job) =>
      job.status === "offer" ||
      offerIds.has(job.id)
  ).length;

  const interviewRate =
    sentJobs === 0
      ? null
      : (reachedInterview / sentJobs) * 100;

  const offerRate =
    sentJobs === 0
      ? null
      : (reachedOffer / sentJobs) * 100;

  return {
    totalJobs,
    sentJobs,
    interviewJobs,
    offerJobs,
    reachedInterview,
    reachedOffer,
    interviewRate,
    offerRate,
  };
}
