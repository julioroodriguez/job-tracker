
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { getJobs } from "../services/jobsService";
import type { JobStatus } from "../types/job";

import "../styles/dashboard.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

import { useState } from "react";
import { getAllJobStatusHistory } from "../services/jobHistoryService";

type DashboardJob = {
  id: string;
  status: JobStatus;
  created_at: string;
};


const jobStatuses: {
  value: JobStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pendiente" },
  { value: "applied", label: "Aplicada" },
  { value: "interview", label: "Entrevista" },
  { value: "technical_test", label: "Prueba técnica" },
  { value: "offer", label: "Oferta" },
  { value: "rejected", label: "Rechazada" },
];


function buildWeeklyActivity(jobs: DashboardJob[]) {
  const today = new Date();

  // Obtener el lunes de la semana actual
  const currentMonday = new Date(today);
  currentMonday.setHours(0, 0, 0, 0);

  const daysSinceMonday =
    (currentMonday.getDay() + 6) % 7;

  currentMonday.setDate(
    currentMonday.getDate() - daysSinceMonday
  );

  // Crear las ocho semanas, de la más antigua
  // a la más reciente
  return Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(currentMonday);

    weekStart.setDate(
      currentMonday.getDate() - (7 - index) * 7
    );

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Contar candidaturas creadas en esa semana
    const registered = jobs.filter((job) => {
      const createdTime = new Date(
        job.created_at
      ).getTime();

      return (
        createdTime >= weekStart.getTime() &&
        createdTime < weekEnd.getTime()
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

type DashboardPeriod = "all" | "30" | "90";

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

  
const [period, setPeriod] =
  useState<DashboardPeriod>("all");

const [referenceTime] = useState(() => Date.now());

const {
  data: history = [],
  isPending: historyLoading,
  isError: historyError,
  refetch: refetchHistory,
} = useQuery({
  queryKey: ["all-job-status-history", userId],
  queryFn: getAllJobStatusHistory,
  enabled: Boolean(userId),
});


  const jobs: DashboardJob[] = data ?? [];


const periodJobs = jobs.filter((job) => {
  if (period === "all") {
    return true;
  }

  const days = Number(period);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const cutoff =
    referenceTime - days * millisecondsPerDay;

  const createdAt = new Date(
    job.created_at
  ).getTime();

  return createdAt >= cutoff;
});


  const weeklyActivityData = buildWeeklyActivity(jobs);

const hasRecentActivity = weeklyActivityData.some(
  (week) => week.registered > 0
);

const statusChartData = jobStatuses.map((status) => ({
  status: status.label,
  total: periodJobs.filter(
    (job) => job.status === status.value
  ).length,
}));


  // KPIs calculados a partir de las candidaturas
 
  // Candidaturas que han pasado por entrevista
  const interviewIds = new Set(
    history
      .filter(
        (entry) =>
          entry.old_status === "interview" ||
          entry.new_status === "interview"
      )
      .map((entry) => entry.job_id)
  );

  // Candidaturas que han recibido oferta
  const offerIds = new Set(
    history
      .filter(
        (entry) =>
          entry.old_status === "offer" ||
          entry.new_status === "offer"
      )
      .map((entry) => entry.job_id)
  );

  // Candidaturas con constancia de haber sido enviadas
  const previouslySentIds = new Set(
    history
      .filter(
        (entry) =>
          entry.old_status !== "pending" ||
          entry.new_status !== "pending"
      )
      .map((entry) => entry.job_id)
  );

  const sentPeriodJobs = periodJobs.filter(
    (job) =>
      job.status !== "pending" ||
      previouslySentIds.has(job.id)
  );

  // Indicadores principales
  const totalJobs = periodJobs.length;
  const sentJobs = sentPeriodJobs.length;

  const interviewJobs = periodJobs.filter(
    (job) => job.status === "interview"
  ).length;

  const offerJobs = periodJobs.filter(
    (job) => job.status === "offer"
  ).length;

  // Conversiones históricas
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

<div className="dashboard-period-filter">
  <label htmlFor="dashboard-period">
    Período de registro
  </label>

  <select
    id="dashboard-period"
    value={period}
    onChange={(event) =>
      setPeriod(
        event.target.value as DashboardPeriod
      )
    }
  >
    <option value="all">Todo el período</option>
    <option value="30">Últimos 30 días</option>
    <option value="90">Últimos 90 días</option>
  </select>

  <p>
    El filtro afecta a los indicadores y al gráfico
    por estados.
  </p>
</div>

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

<section
  className="dashboard-conversion"
  aria-labelledby="conversion-title"
>
  <h2 id="conversion-title">
    Tasas de conversión
  </h2>

  {historyLoading ? (
    <p>Cargando historial...</p>
  ) : historyError ? (
    <div role="alert">
      <p>
        No se pudieron calcular las conversiones.
      </p>

      <button
        type="button"
        onClick={() => void refetchHistory()}
      >
        Reintentar
      </button>
    </div>
  ) : (
    <div className="dashboard-stats">
      <article className="dashboard-stat-card">
        <h3>Tasa de entrevistas</h3>

        <p className="dashboard-stat-value">
          {interviewRate === null
            ? "—"
            : `${interviewRate.toFixed(1)}%`}
        </p>

        <p>
          {reachedInterview} de {sentJobs} enviadas
        </p>
      </article>

      <article className="dashboard-stat-card">
        <h3>Tasa de ofertas</h3>

        <p className="dashboard-stat-value">
          {offerRate === null
            ? "—"
            : `${offerRate.toFixed(1)}%`}
        </p>

        <p>
          {reachedOffer} de {sentJobs} enviadas
        </p>
      </article>
    </div>
  )}
</section>


<section
  className="dashboard-chart-card"
  aria-labelledby="status-chart-title"
>

<section
  className="dashboard-conversion"
  aria-labelledby="conversion-title"
>
 
</section>

  <h2 id="status-chart-title">
    Candidaturas por estado
  </h2>

  {totalJobs === 0 ? (
    <p>
      Añade candidaturas para visualizar las
      estadísticas por estado.
    </p>
  ) : (
    <BarChart
      responsive
      layout="vertical"
      data={statusChartData}
      style={{
        width: "100%",
        height: 360,
      }}
      margin={{
        top: 10,
        right: 25,
        bottom: 10,
        left: 10,
      }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        horizontal={false}
      />

      <XAxis
        type="number"
        allowDecimals={false}
      />

      <YAxis
        dataKey="status"
        type="category"
        width={110}
      />

      <Tooltip />

      <Bar
        dataKey="total"
        name="Candidaturas"
        fill="#2563eb"
        radius={[0, 6, 6, 0]}
      />
    </BarChart>
  )}
</section>

<section
  className="dashboard-chart-card"
  aria-labelledby="weekly-activity-title"
>
  <h2 id="weekly-activity-title">
    Evolución semanal
  </h2>

  <p className="dashboard-chart-description">
    Candidaturas registradas durante las últimas
    ocho semanas, incluida la semana actual.
  </p>

  {!hasRecentActivity ? (
    <p>
      No se han registrado candidaturas durante
      las últimas ocho semanas.
    </p>
  ) : (
    <LineChart
      responsive
      data={weeklyActivityData}
      style={{
        width: "100%",
        height: 320,
      }}
      margin={{
        top: 20,
        right: 20,
        bottom: 10,
        left: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="week"
        tickMargin={8}
        minTickGap={12}
      />

      <YAxis
        allowDecimals={false}
        width={35}
      />

      <Tooltip />

      <Line
        type="monotone"
        dataKey="registered"
        name="Candidaturas"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  )}
</section>


      {jobs.length === 0 && (
        <div className="dashboard-empty">
          <p>No hay candidaturas en el período seleccionado.</p>
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
