
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getJobById, deleteJob } from "../services/jobsService";
import { useAuth } from "../hooks/useAuth";

import { getJobStatusHistory } from "../services/jobHistoryService";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  applied: "Aplicada",
  interview: "Entrevista",
  technical_test: "Prueba técnica",
  offer: "Oferta",
  rejected: "Rechazada",
};

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { session } = useAuth();
  const userId = session?.user.id;

  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const {
    data: job,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["job", userId, id],
    queryFn: () => {
      if (!id) {
        throw new Error("ID de candidatura no válido");
      }

      return getJobById(id);
    },
    enabled: Boolean(userId && id),
  });

  const {
  data: history = [],
  isPending: historyLoading,
  isError: historyError,
  refetch: refetchHistory,
} = useQuery({
  queryKey: ["job-status-history", userId, id],

  queryFn: () => {
    if (!id) {
      throw new Error("ID de candidatura no válido");
    }

    return getJobStatusHistory(id);
  },

  enabled: Boolean(userId && id),
});

  async function handleDelete() {
    if (!job || deleting) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la candidatura de ${job.company}?`
    );

    if (!confirmed) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteJob(job.id);

      queryClient.removeQueries({
  queryKey: ["job-status-history", userId, job.id],
  exact: true,
});

      await queryClient.invalidateQueries({
        queryKey: ["jobs", userId],
      });

      queryClient.removeQueries({
        queryKey: ["job", userId, job.id],
        exact: true,
      });

      navigate("/jobs", { replace: true });
    } catch (error) {
      console.error("Error al eliminar candidatura:", error);
      setDeleteError("No se pudo eliminar la candidatura.");
    } finally {
      setDeleting(false);
    }
  }

  if (!id) {
    return <p>ID de candidatura no válido.</p>;
  }

  if (isPending) {
    return <p>Cargando candidatura...</p>;
  }

  if (isError) {
    console.error("Error al cargar candidatura:", error);
    return <p role="alert">Error al cargar la candidatura.</p>;
  }

  if (!job) {
    return <p>Candidatura no encontrada.</p>;
  }

  return (
    <section>
      <Link to="/jobs">Volver a candidaturas</Link>

      <h1>{job.company}</h1>
      <h2>{job.position}</h2>

      <p>Estado: {job.status}</p>
      <p>Ubicación: {job.location}</p>
      <p>Modalidad: {job.work_mode}</p>

      <h3>Notas</h3>
      <p>{job.notes || "Sin notas"}</p>

      {job.job_url && (
        <p>
          Oferta:{" "}
          <a
            href={job.job_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver oferta original
          </a>
        </p>
      )}

      {(job.salary_min !== null || job.salary_max !== null) && (
        <p>
          Salario bruto anual: {job.salary_min ?? "Sin mínimo"} -{" "}
          {job.salary_max ?? "Sin máximo"} {job.currency ?? ""}
        </p>
      )}

      {job.technologies.length > 0 && (
        <div>
          <h3>Tecnologías</h3>
          <ul>
            {job.technologies.map((tech: string) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      )}

      {job.next_action && (
        <p>Próxima acción: {job.next_action}</p>
      )}

      {job.next_action_at && (
        <p>
          Fecha de seguimiento:{" "}
          {new Date(job.next_action_at).toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      )}
<section aria-labelledby="history-title">
  <h3 id="history-title">Historial de estados</h3>

  {historyLoading ? (
    <p>Cargando historial...</p>
  ) : historyError ? (
    <div role="alert">
      <p>No se pudo cargar el historial.</p>

      <button
        type="button"
        onClick={() => void refetchHistory()}
      >
        Reintentar
      </button>
    </div>
  ) : history.length === 0 ? (
    <p>Todavía no hay cambios de estado registrados.</p>
  ) : (
    <ol>
      {history.map((entry) => (
        <li key={entry.id}>
          <p>
            {statusLabels[entry.old_status] ?? entry.old_status}
            {" → "}
            {statusLabels[entry.new_status] ?? entry.new_status}
          </p>

          <small>
            {new Date(entry.changed_at).toLocaleString(
              "es-ES",
              {
                dateStyle: "short",
                timeStyle: "short",
              }
            )}
          </small>
        </li>
      ))}
    </ol>
  )}
</section>
      <Link to={`/jobs/${job.id}/edit`}>
        Editar candidatura
      </Link>

      {deleteError && (
        <p role="alert">{deleteError}</p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Eliminando..." : "Eliminar candidatura"}
      </button>
    </section>
  );
}
