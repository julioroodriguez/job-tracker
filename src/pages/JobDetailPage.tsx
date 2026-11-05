import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJobById, updateJob } from "../services/jobsService";
import { useNavigate } from "react-router-dom";
import { deleteJob } from "../services/jobsService";

type JobDetail = Awaited<ReturnType<typeof getJobById>>;

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<JobDetail>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
const navigate = useNavigate();

const [deleting, setDeleting] = useState(false);
const [deleteError, setDeleteError] = useState("");


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
    navigate("/jobs");
  } catch (error) {
    console.error("Error al eliminar:", error);
    setDeleteError("No se pudo eliminar la candidatura.");
  } finally {
    setDeleting(false);
  }
}
  useEffect(() => {
  if (!id) {
    return;
  }

  const jobId = id;
  let cancelled = false;

  async function loadJob() {
    try {
      const data = await getJobById(jobId);

      if (!cancelled) {
        setJob(data);
      }
    } catch (error) {
      if (!cancelled) {
        console.error(error);
        setErrorMessage("Error al cargar la candidatura.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadJob();

  return () => {
    cancelled = true;
  };
}, [id]);

  if (!id) return <p>ID de candidatura no válido.</p>;
  if (loading) return <p>Cargando candidatura...</p>;
  if (errorMessage) return <p role="alert">{errorMessage}</p>;
  if (!job) return <p>Candidatura no encontrada.</p>;

  return (
    <section>
      <Link to="/jobs">Volver a candidaturas</Link>

      <h1>{job.company}</h1>
      <h2>{job.position}</h2>

      <p>Estado: {job.status}</p>
      <p>Ubicación: {job.location}</p>
      <p>Modalidad: {job.work_mode}</p>
      <p>Notas: {job.notes ?? "Sin notas"}</p>

      <Link to={`/jobs/${job.id}/edit`}>
        Editar candidatura
      </Link>
      {deleteError && <p role="alert">{deleteError}</p>}

<button
  type="button"
  onClick={handleDelete}
  disabled={deleting}
>
  {deleting ? "Eliminando..." : "Eliminar candidatura"}
</button>
      <button
  type="button"
  onClick={async () => {
    try {
      const updatedJob = await updateJob(job.id, {
        status: "interview",
      });

      setJob(updatedJob);
    } catch (error) {
      console.error("Error actualizando candidatura:", error);
    }
  }}
>
  Marcar como entrevista (prueba)
</button>
    </section>
  );
}