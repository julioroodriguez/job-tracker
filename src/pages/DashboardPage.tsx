
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { getJobs } from "../services/jobsService";
import type { JobStatus } from "../types/job";

import "../styles/dashboard.css";

type DashboardJob = {
  status: JobStatus;
};

export function DashboardPage() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const {
    data,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["jobs", userId],
    queryFn: getJobs,
    enabled: Boolean(userId),
  });

  const jobs: DashboardJob[] = data ?? [];

  // KPIs calculados a partir de las candidaturas
  const totalJobs = jobs.length;

  const sentJobs = jobs.filter(
    (job) => job.status !== "pending"
  ).length;

  const interviewJobs = jobs.filter(
    (job) => job.status === "interview"
  ).length;

  const offerJobs = jobs.filter(
    (job) => job.status === "offer"
  ).length;

  if (isPending) {
    return <p>Cargando estadísticas...</p>;
  }

  if (isError) {
    return (
      <section>
        <h1>Dashboard</h1>
        <p role="alert">
          No se pudieron cargar las estadísticas.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
        >
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen de tu búsqueda de empleo</p>
        </div>

        <Link to="/jobs/new">
          Nueva candidatura
        </Link>
      </header>

      <div className="dashboard-stats">
        <article className="dashboard-stat-card">
          <h2>Total candidaturas</h2>
          <p className="dashboard-stat-value">
            {totalJobs}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <h2>Enviadas</h2>
          <p className="dashboard-stat-value">
            {sentJobs}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <h2>En entrevista</h2>
          <p className="dashboard-stat-value">
            {interviewJobs}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <h2>Ofertas</h2>
          <p className="dashboard-stat-value">
            {offerJobs}
          </p>
        </article>
      </div>

      {totalJobs === 0 && (
        <div className="dashboard-empty">
          <p>
            Todavía no tienes candidaturas registradas.
          </p>
          <Link to="/jobs/new">
            Crear primera candidatura
          </Link>
        </div>
      )}

      <Link to="/board">
        Ver tablero Kanban
      </Link>
    </section>
  );
}
