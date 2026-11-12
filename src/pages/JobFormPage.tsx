
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";

import {
  jobFormSchema,
  type JobFormValues,
} from "../features/jobs/jobFormSchema";

import {
  createJob,
  getJobById,
  updateJob,
} from "../services/jobsService";

// Convierte una fecha de Supabase al formato datetime-local
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

  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  // Estados de carga y errores
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  // React Hook Form + Zod
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
      job_url: "",
      notes: "",
      salary_min: "",
      salary_max: "",
      currency: "EUR",
      technologies_input: "",
      next_action: "",
      next_action_at: "",
    },
  });

  // Cargar una candidatura existente en modo edición
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
            job.currency === "USD" || job.currency === "GBP"
              ? job.currency
              : "EUR",

          technologies_input: job.technologies.join(", "),

          next_action: job.next_action ?? "",
          next_action_at: toDatetimeLocal(job.next_action_at),
        });

        reset(values);
      } catch (error) {
        if (!cancelled) {
          console.error("Error al cargar candidatura:", error);
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

  // Crear o editar candidatura
  async function onValidSubmit(values: JobFormValues) {
    setSaveError("");

    if (!userId) {
      setSaveError("No hay una sesión activa.");
      return;
    }

    // Convertir tecnologías a un array
    const { technologies_input, ...otherValues } = values;

    const technologies = [
      ...new Set(
        technologies_input
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean)
      ),
    ];

    // Preparar datos para Supabase
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
        // ACTUALIZAR CANDIDATURA
        await updateJob(id, payload);

        // Actualizar listado y detalle en caché
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["jobs", userId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["job", userId, id],
          }),
        ]);

        navigate(`/jobs/${id}`);
      } else {
        // CREAR CANDIDATURA
        const newJob = await createJob(payload);

        // Actualizar listado en caché
        await queryClient.invalidateQueries({
          queryKey: ["jobs", userId],
        });

        navigate(`/jobs/${newJob.id}`);
      }
    } catch (error) {
      console.error("Error al guardar candidatura:", error);
      setSaveError("No se pudo guardar la candidatura.");
    }
  }

  // Estados de carga y error
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
        {/* EMPRESA */}
        <label>
          Empresa
          <input {...register("company")} />
        </label>

        {errors.company && (
          <p className="form-error" role="alert">
            {errors.company.message}
          </p>
        )}

        {/* PUESTO */}
        <label>
          Puesto
          <input {...register("position")} />
        </label>

        {errors.position && (
          <p className="form-error" role="alert">
            {errors.position.message}
          </p>
        )}

        {/* ESTADO */}
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

        {/* UBICACIÓN */}
        <label>
          Ubicación
          <input {...register("location")} />
        </label>

        {errors.location && (
          <p className="form-error" role="alert">
            {errors.location.message}
          </p>
        )}

        {/* MODALIDAD */}
        <label>
          Modalidad
          <select {...register("work_mode")}>
            <option value="remote">Remoto</option>
            <option value="hybrid">Híbrido</option>
            <option value="onsite">Presencial</option>
          </select>
        </label>

        {/* URL DE LA OFERTA */}
        <label>
          URL de la oferta
          <input
            type="url"
            placeholder="https://empresa.com/oferta"
            {...register("job_url")}
          />
        </label>

        {errors.job_url && (
          <p className="form-error" role="alert">
            {errors.job_url.message}
          </p>
        )}

        {/* SALARIO MÍNIMO */}
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

        {/* SALARIO MÁXIMO */}
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

        {/* MONEDA */}
        <label>
          Moneda
          <select {...register("currency")}>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </label>

        {/* NOTAS */}
        <label>
          Notas
          <textarea
            rows={5}
            placeholder="Información sobre la candidatura..."
            {...register("notes")}
          />
        </label>

        {errors.notes && (
          <p className="form-error" role="alert">
            {errors.notes.message}
          </p>
        )}

        {/* TECNOLOGÍAS */}
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

        {/* PRÓXIMA ACCIÓN */}
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

        {/* FECHA DE SEGUIMIENTO */}
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

        {/* ERROR AL GUARDAR */}
        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}

        {/* BOTÓN DE ENVÍO */}
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
