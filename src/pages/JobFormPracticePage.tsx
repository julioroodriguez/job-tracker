import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  jobFormSchema,
  type JobFormValues,
} from "../features/jobs/jobFormSchema";

export function JobFormPracticePage() {
  const {
    register,
    handleSubmit,
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

  function onValidSubmit(data: JobFormValues) {
    console.log("Datos válidos:", data);
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
      </form>
    </section>
  );
}