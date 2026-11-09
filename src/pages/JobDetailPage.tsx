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
    Salario bruto anual: {job.salary_min ?? "Sin mínimo"} -
    {" "}{job.salary_max ?? "Sin máximo"}
    {" "}{job.currency ?? ""}
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
    </section>
  );
}