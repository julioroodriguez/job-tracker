import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  jobFormSchema,
  type JobFormValues,
} from "../features/jobs/jobFormSchema";

import {
  createJob,
  getJobById,
  updateJob,
} from "../services/jobsService";

export function JobFormPahe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      company: "",
      position: "",
      status: "pending",
      location: "",
      work_mode: "hybrid",
    },
  });

  // Precargar datos cuando estamos editando
  useEffect(() => {
    if (!id) return;

    const jobId = id;
    let cancelled = false;

    async function loadJob() {
      try {
        const job = await getJobById(jobId);

        if (cancelled) return;

        if (!job) {
          setLoadError("Candidatura no encontrada.");
          return;
        }

        const values = jobFormSchema.parse({
          company: job.company,
          position: job.position,
          status: job.status,
          location: job.location,
          work_mode: job.work_mode,
        });

        reset(values);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setLoadError("Error al cargar la candidatura.");
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
  }, [id, reset]);

  // Crear o editar según exista un ID
  async function onValidSubmit(values: JobFormValues) {
    setSaveError("");

    try {
      if (id) {
        await updateJob(id, values);
        navigate(`/jobs/${id}`);
      } else {
        const newJob = await createJob(values);
        navigate(`/jobs/${newJob.id}`);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setSaveError("No se pudo guardar la candidatura.");
    }
  }

  if (id && loading) {
    return <p>Cargando candidatura...</p>;
  }

  if (id && loadError) {
    return <p role="alert">{loadError}</p>;
  }

  return (
    <section>
      <h1>
        {id ? "Editar candidatura" : "Nueva candidatura"}
      </h1>

      <form noValidate onSubmit={handleSubmit(onValidSubmit)}>
        <label>
          Empresa
          <input {...register("company")} />
        </label>
        {errors.company && (
          <p className="form-error" role="alert">
            {errors.company.message}
          </p>
        )}

        <label>
          Puesto
          <input {...register("position")} />
        </label>
        {errors.position && (
          <p className="form-error" role="alert">
            {errors.position.message}
          </p>
        )}

        <label>
          Estado
          <select {...register("status")}>
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
          <input {...register("location")} />
        </label>
        {errors.location && (
          <p className="form-error" role="alert">
            {errors.location.message}
          </p>
        )}

        <label>
          Modalidad
          <select {...register("work_mode")}>
            <option value="remote">Remoto</option>
            <option value="hybrid">Híbrido</option>
            <option value="onsite">Presencial</option>
          </select>
        </label>

        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : id
              ? "Guardar cambios"
              : "Crear candidatura"}
        </button>
      </form>
    </section>
  );
}