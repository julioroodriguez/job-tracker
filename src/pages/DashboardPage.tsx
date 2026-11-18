
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useAuth } from "../hooks/useAuth";
import { getJobs } from "../services/jobsService";
import { getAllJobStatusHistory } from "../services/jobHistoryService";
import type { JobStatus } from "../types/job";

import {
  buildWeeklyActivity,
  calculateDashboardMetrics,
  filterJobsByPeriod,
  type DashboardJob,
  type DashboardPeriod,
} from "../features/dashboard/dashboardStats";

import "../styles/dashboard.css";

// Estados utilizados en el gráfico de barras
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

export function DashboardPage() {
  const { session } = useAuth();
  const userId = session?.user.id;

  // Filtro temporal
  const [period, setPeriod] =
    useState<DashboardPeriod>("all");

  const [referenceTime] = useState(() => Date.now());

  // Consulta de candidaturas
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

  // Consulta del historial global
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

  // Filtrar candidaturas por período
  const periodJobs = filterJobsByPeriod(
    jobs,
    period,
    referenceTime
  );

  // Datos del gráfico semanal
  const weeklyActivityData = buildWeeklyActivity(jobs);

  const hasRecentActivity = weeklyActivityData.some(
    (week) => week.registered > 0
  );

  // Datos del gráfico por estados
  const statusChartData = jobStatuses.map((status) => ({
    status: status.label,
    total: periodJobs.filter(
      (job) => job.status === status.value
    ).length,
  }));

  // KPIs y conversiones
  const {
    totalJobs,
    sentJobs,
    interviewJobs,
    offerJobs,
    reachedInterview,
    reachedOffer,
    interviewRate,
    offerRate,
  } = calculateDashboardMetrics(periodJobs, history);

  // Estado de carga
  if (isPending) {
    return <p>Cargando estadísticas...</p>;
  }

  // Error al cargar candidaturas
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
      {/* CABECERA */}
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen de tu búsqueda de empleo</p>
        </div>

        <Link to="/jobs/new">
          Nueva candidatura
        </Link>
      </header>

      {/* FILTRO TEMPORAL */}
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
          <option value="all">
            Todo el período
          </option>
          <option value="30">
            Últimos 30 días
          </option>
          <option value="90">
            Últimos 90 días
          </option>
        </select>

        <p>
          El filtro afecta a los indicadores
          y al gráfico por estados.
        </p>
      </div>

      {/* INDICADORES PRINCIPALES */}
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

      {/* TASAS DE CONVERSIÓN */}
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

      {/* GRÁFICO DE CANDIDATURAS POR ESTADO */}
      <section
        className="dashboard-chart-card"
        aria-labelledby="status-chart-title"
      >
        <h2 id="status-chart-title">
          Candidaturas por estado
        </h2>

        {totalJobs === 0 ? (
          <p>
            No hay candidaturas en el período
            seleccionado.
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

      {/* GRÁFICO DE EVOLUCIÓN SEMANAL */}
      <section
        className="dashboard-chart-card"
        aria-labelledby="weekly-activity-title"
      >
        <h2 id="weekly-activity-title">
          Evolución semanal
        </h2>

        <p className="dashboard-chart-description">
          Candidaturas registradas durante las
          últimas ocho semanas, incluida la
          semana actual.
        </p>

        {!hasRecentActivity ? (
          <p>
            No se han registrado candidaturas
            durante las últimas ocho semanas.
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

      {/* ESTADO VACÍO */}
      {jobs.length === 0 && (
        <div className="dashboard-empty">
          <p>
            Todavía no tienes candidaturas
            registradas.
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
