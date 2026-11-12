
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { getJobs } from "../services/jobsService";
import type { Job, JobStatus, workMode } from "../types/job";

type JobListItem = Pick<
  Job,
  "id" | "company" | "position" | "status" | "location"
> & {
  work_mode: workMode;
  technologies: string[];
  created_at: string;
};

type SortOption =
  | "newest"
  | "oldest"
  | "company_asc"
  | "company_desc";

export function JobsPage() {
  const { session } = useAuth();
  const userId = session?.user.id;

  // Estados de los filtros
  const [technologyFilter, setTechnologyFilter] =
  useState("all");

const [sortOption, setSortOption] =
  useState<SortOption>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | JobStatus>("all");
  const [workModeFilter, setWorkModeFilter] =
    useState<"all" | workMode>("all");

  // Obtener candidaturas desde TanStack Query
  const {
  data,
  isPending,
  isError,
  isFetching,
  error,
  refetch,
} = useQuery({
  queryKey: ["jobs", userId],
  queryFn: getJobs,
  enabled: Boolean(userId),
});

  const jobs: JobListItem[] = data ?? [];

  const availableTechnologies = [
  ...new Set(
    jobs.flatMap((job) => job.technologies)
  ),
].sort((a, b) =>
  a.localeCompare(b, "es", { sensitivity: "base" })
);

  // Filtrar las candidaturas
  const filteredJobs = jobs.filter((job) => {
    const matchesTechnology =
  technologyFilter === "all" ||
  job.technologies.some(
    (tech) =>
      tech.toLowerCase() === technologyFilter.toLowerCase()
  );
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      job.company.toLowerCase().includes(search) ||
      job.position.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      job.status === statusFilter;

    const matchesWorkMode =
      workModeFilter === "all" ||
      job.work_mode === workModeFilter;

    return  matchesSearch &&
  matchesStatus &&
  matchesWorkMode &&
  matchesTechnology;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
  switch (sortOption) {
    case "newest":
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );

    case "oldest":
      return (
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );

    case "company_asc":
      return a.company.localeCompare(b.company, "es");

    case "company_desc":
      return b.company.localeCompare(a.company, "es");
  }
});

  function clearFilters() {
    setSearchTerm("");
  setStatusFilter("all");
  setWorkModeFilter("all");
  setTechnologyFilter("all");
  setSortOption("newest");
  }

  return (
    <section>
      <h1>Candidaturas</h1>

      <p>
        <Link to="/jobs/new">Nueva candidatura</Link>
      </p>

      {isPending ? (
        <p>Cargando candidaturas...</p>
      ) : isError ? (
        <div role="alert">
          <p>No se pudieron cargar las candidaturas.</p>
          <p>{error.message}</p>
          <button type="button" onClick={() => void refetch()}>
  Reintentar
</button>
        </div>
        
      ) : (
        <>
          {/* BUSCADOR */}
          <label>
            Buscar por empresa o puesto
            <input
              type="search"
              placeholder="Google, Frontend, Java..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </label>

          {/* FILTRO DE ESTADO */}
          <label>
            Estado
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | JobStatus
                )
              }
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="applied">Aplicada</option>
              <option value="interview">Entrevista</option>
              <option value="technical_test">
                Prueba técnica
              </option>
              <option value="offer">Oferta</option>
              <option value="rejected">Rechazada</option>
            </select>
          </label>

          {/* FILTRO DE MODALIDAD */}
          <label>
            Modalidad
            <select
              value={workModeFilter}
              onChange={(event) =>
                setWorkModeFilter(
                  event.target.value as "all" | workMode
                )
              }
            >
              <option value="all">Todas las modalidades</option>
              <option value="remote">Remoto</option>
              <option value="hybrid">Híbrido</option>
              <option value="onsite">Presencial</option>
            </select>
          </label>

              <label>
  Tecnología
  <select
    value={technologyFilter}
    onChange={(event) =>
      setTechnologyFilter(event.target.value)
    }
  >
    <option value="all">Todas las tecnologías</option>

    {availableTechnologies.map((tech) => (
      <option key={tech} value={tech}>
        {tech}
      </option>
    ))}
  </select>
</label>
<label>
  Ordenar por
  <select
    value={sortOption}
    onChange={(event) =>
      setSortOption(event.target.value as SortOption)
    }
  >
    <option value="newest">Más recientes</option>
    <option value="oldest">Más antiguas</option>
    <option value="company_asc">Empresa A-Z</option>
    <option value="company_desc">Empresa Z-A</option>
  </select>
</label>

          <button type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>

          {/* RESULTADOS */}
          <p>
            Mostrando {filteredJobs.length} de {jobs.length} candidaturas
          </p>

          {isFetching && (
            <p>Actualizando candidaturas...</p>
          )}

        {jobs.length === 0 ? (
  <p>Todavía no tienes candidaturas.</p>
) : sortedJobs.length === 0 ? (
  <div>
    <p>No hay candidaturas que coincidan con los filtros.</p>

    <button type="button" onClick={clearFilters}>
      Mostrar todas las candidaturas
    </button>
  </div>
) : (
  <ul>
    {sortedJobs.map((job) => (
      <li key={job.id}>
        <Link to={`/jobs/${job.id}`}>
          <strong>{job.company}</strong>
          <p>{job.position}</p>
          <p>Estado: {job.status}</p>
          <p>Ubicación: {job.location}</p>
          <p>Modalidad: {job.work_mode}</p>
        </Link>
      </li>
    ))}
  </ul>
)}
        </>
      )}
    </section>
  );
}
