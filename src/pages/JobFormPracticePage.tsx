import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJobById } from "../services/jobsService";
import {
  jobFormSchema,
  type JobFormValues,
} from "../features/jobs/jobFormSchema";

export function JobFormPracticePage() {
  const { id } = useParams<{ id: string }>();

const [loading, setLoading] = useState(Boolean(id));
const [loadError, setLoadError] = useState("");
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
          setLoadError("No se pudo cargar la candidatura.");
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

  function onValidSubmit(data: JobFormValues) {
    console.log("Datos válidos:", data);
  }

  if (loading) {
    return <p>Cargando candidatura...</p>;
  }
  
  if (loadError) {
    return <p role="alert">{loadError}</p>;
  }

  return (
    <section>
      <h1>Práctica React Hook Form</h1>
    
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

        <button type="submit" disabled={isSubmitting}>
  Validar formulario
</button>
<button type="button" onClick={() => reset()}>
  Descartar cambios
</button>
      </form>
    </section>
  );
}