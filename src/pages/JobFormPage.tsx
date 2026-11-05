import { useParams, useNavigate } from "react-router-dom";
import { getJobById, updateJob, createJob } from "../services/jobsService";
import { useState, useEffect } from "react";
import type { JobStatus } from "../types/job";
import type { FormEvent } from "react";

export function JobFormPahe() {

  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<JobStatus>("pending");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(Boolean(id));
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

const [saving, setSaving] = useState(false);
const [saveError, setSaveError] = useState("");

  useEffect(() => {
    
  if (!id) return;

  const jobId = id;
  let cancelled = false;

  async function loadJob() {
    try {
      const job = await getJobById(jobId);

      if (cancelled) return;

      if (!job) {
        setErrorMessage("Candidatura no encontrada.");
        return;
      }

      setCompany(job.company);
      setPosition(job.position);
      setStatus(job.status as JobStatus);
      setLocation(job.location);
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

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!company.trim() || !position.trim() || !location.trim()) {
    setSaveError("Todos los campos son obligatorios.");
    return;
  }

  setSaving(true);
  setSaveError("");

  try {
  if (id) {
    // EDITAR una candidatura existente
    await updateJob(id, {
      company: company.trim(),
      position: position.trim(),
      status,
      location: location.trim(),
    });

    navigate(`/jobs/${id}`);
  } else {
    // CREAR una candidatura nueva
    const newJob = await createJob({
      company: company.trim(),
      position: position.trim(),
      status,
      location: location.trim(),
      work_mode: "hybrid",
    });

    navigate(`/jobs/${newJob.id}`);
  }
} catch (error) {
    console.error("Error al actualizar:", error);
    setSaveError("No se pudieron guardar los cambios.");
  } finally {
    setSaving(false);
  }
}
if (id && loading) {
  return <p>Cargando candidatura...</p>;
}

if (id && errorMessage) {
  return <p role="alert">{errorMessage}</p>;
}
  return (
    
    <section>
      <h1>
        {id ? "Editar candidatura" : "Nueva candidatura"}
      </h1>
      <form onSubmit={handleSubmit}>
  <label>
    Empresa
    <input
      value={company}
      onChange={(event) => setCompany(event.target.value)}
    />
  </label>

  <label>
    Puesto
    <input
      value={position}
      onChange={(event) => setPosition(event.target.value)}
    />
  </label>

  <label>
    Estado
    <select
      value={status}
      onChange={(event) =>
        setStatus(event.target.value as JobStatus)
      }
    >
      <option value="pending">Pendiente</option>
      <option value="applied">Aplicada</option>
      <option value="interview">Entrevista</option>
      <option value="technical_test">Prueba técnica</option>
      <option value="offer">Oferta</option>
      <option value="rejected">Rechazada</option>
    </select>
  </label>

  <label>
    Ubicación
    <input
      value={location}
      onChange={(event) => setLocation(event.target.value)}
    />
  </label>
  
  {saveError && <p role="alert">{saveError}</p>}


  <button type="submit" disabled={saving}>
  {saving
    ? "Guardando..."
    : id
      ? "Guardar cambios"
      : "Crear candidatura"}
</button>

</form>
    </section>
  );
}