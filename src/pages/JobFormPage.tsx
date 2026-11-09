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

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

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
      technologies_input: "",
next_action: "",
next_action_at: "",
      company: "",
      position: "",
      status: "pending",
      location: "",
      work_mode: "hybrid",
      job_url: "",
      notes: "",
      salary_min: "",
      salary_max: "",
      currency: "EUR",
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
          job_url: job.job_url ?? "",
          notes: job.notes ?? "",
          salary_min: job.salary_min?.toString() ?? "",
          salary_max: job.salary_max?.toString() ?? "",
          currency:
          job.currency === "USD" 
          || job.currency === "GBP"
          ? job.currency
          : "EUR",
          technologies_input: job.technologies.join(", "),
next_action: job.next_action ?? "",
next_action_at: toDatetimeLocal(job.next_action_at),
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

const { technologies_input, ...otherValues } = values;

const technologies = [
  ...new Set(
    technologies_input
      .split(",")
      .map((tech) => tech.trim())
      .filter(Boolean)
  ),
];

const payload = {
  ...otherValues,

  job_url: values.job_url || null,
  notes: values.notes || null,

  salary_min:
    values.salary_min === ""
      ? null
      : Number(values.salary_min),

  salary_max:
    values.salary_max === ""
      ? null
      : Number(values.salary_max),

  currency:
    values.salary_min !== "" || values.salary_max !== ""
      ? values.currency
      : null,

  technologies,

  next_action: values.next_action || null,

  next_action_at:
    values.next_action_at
      ? new Date(values.next_action_at).toISOString()
      : null,
};
    try {
      if (id) {
        await updateJob(id, payload);
        navigate(`/jobs/${id}`);
      } else {
        const newJob = await createJob(payload);
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

        <label>
  URL de la oferta
  <input
    type="url"
    placeholder="https://empresa.com/oferta"
    {...register("job_url")}
  />
</label>

<label>
  Salario mínimo bruto anual
  <input
    type="text"
    inputMode="numeric"
    placeholder="25000"
    {...register("salary_min")}
  />
</label>

{errors.salary_min && (
  <p className="form-error" role="alert">
    {errors.salary_min.message}
  </p>
)}

<label>
  Salario máximo bruto anual
  <input
    type="text"
    inputMode="numeric"
    placeholder="35000"
    {...register("salary_max")}
  />
</label>

{errors.salary_max && (
  <p className="form-error" role="alert">
    {errors.salary_max.message}
  </p>
)}

<label>
  Moneda
  <select {...register("currency")}>
    <option value="EUR">EUR (€)</option>
    <option value="USD">USD ($)</option>
    <option value="GBP">GBP (£)</option>
  </select>
</label>

{errors.job_url && (
  <p className="form-error" role="alert">
    {errors.job_url.message}
  </p>
)}

<label>
  Notas
  <textarea
    rows={5}
    placeholder="Información sobre la candidatura..."
    {...register("notes")}
  />
</label>

<label>
  Tecnologías
  <input
    type="text"
    placeholder="React, Angular, Java, TypeScript"
    {...register("technologies_input")}
  />
</label>

{errors.technologies_input && (
  <p className="form-error" role="alert">
    {errors.technologies_input.message}
  </p>
)}

<label>
  Próxima acción
  <input
    type="text"
    placeholder="Enviar seguimiento a RR. HH."
    {...register("next_action")}
  />
</label>

{errors.next_action && (
  <p className="form-error" role="alert">
    {errors.next_action.message}
  </p>
)}

<label>
  Fecha de seguimiento
  <input
    type="datetime-local"
    {...register("next_action_at")}
  />
</label>

{errors.next_action_at && (
  <p className="form-error" role="alert">
    {errors.next_action_at.message}
  </p>
)}

{errors.notes && (
  <p className="form-error" role="alert">
    {errors.notes.message}
  </p>
)}

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

