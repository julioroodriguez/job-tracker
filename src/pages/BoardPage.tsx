
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DragDropProvider,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";

import { useAuth } from "../hooks/useAuth";
import { getJobs, updateJob } from "../services/jobsService";
import type { JobStatus } from "../types/job";

import "../styles/board.css";

type BoardJob = {
  id: string;
  company: string;
  position: string;
  status: JobStatus;
  location: string;
};

const columns: {
  status: JobStatus;
  title: string;
}[] = [
  { status: "pending", title: "Pendiente" },
  { status: "applied", title: "Aplicada" },
  { status: "interview", title: "Entrevista" },
  { status: "technical_test", title: "Prueba técnica" },
  { status: "offer", title: "Oferta" },
  { status: "rejected", title: "Rechazada" },
];

// Tarjeta arrastrable
function KanbanCard({ job }: { job: BoardJob }) {
  const {
    ref,
    handleRef,
    isDragging,
  } = useDraggable({
    id: job.id,
  });

  return (
    <article
      ref={ref}
      className={`kanban-card ${
        isDragging ? "kanban-card-dragging" : ""
      }`}
    >
      <button
        ref={handleRef}
        type="button"
        className="kanban-drag-handle"
        aria-label={`Mover candidatura de ${job.company}`}
      >
        ⠿ Arrastrar
      </button>

      <Link
        to={`/jobs/${job.id}`}
        className="kanban-card-link"
      >
        <strong>{job.company}</strong>
        <p>{job.position}</p>
        <small>{job.location}</small>
      </Link>
    </article>
  );
}

// Columna que acepta tarjetas
function KanbanColumn({
  status,
  title,
  jobs,
}: {
  status: JobStatus;
  title: string;
  jobs: BoardJob[];
}) {
  const { ref, isDropTarget } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={ref}
      className={`kanban-column ${
        isDropTarget ? "kanban-drop-target" : ""
      }`}
    >
      <div className="kanban-column-header">
        <h2>{title}</h2>
        <span>{jobs.length}</span>
      </div>

      <div className="kanban-cards">
        {jobs.length === 0 ? (
          <p className="kanban-empty">Sin candidaturas</p>
        ) : (
          jobs.map((job) => (
            <KanbanCard key={job.id} job={job} />
          ))
        )}
      </div>
    </div>
  );
}

export function BoardPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const [moveError, setMoveError] = useState("");

  const jobsKey = ["jobs", userId] as const;
  // Cambios temporales de estado en la interfaz

  const {
    data,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: jobsKey,
    queryFn: getJobs,
    enabled: Boolean(userId),
  });

  const moveJobMutation = useMutation({
  mutationFn: async ({
    jobId,
    status,
  }: {
    jobId: string;
    status: JobStatus;
  }) => {
    return updateJob(jobId, { status });
  },

  onMutate: async ({ jobId, status }) => {
    setMoveError("");

    // Cancelar consultas que puedan sobrescribir
    // nuestro cambio temporal
    await queryClient.cancelQueries({
      queryKey: jobsKey,
    });

    // Guardar una copia de los datos anteriores
    const previousJobs =
      queryClient.getQueryData<BoardJob[]>(jobsKey);

    // Mover la candidatura inmediatamente
    queryClient.setQueryData<BoardJob[]>(
      jobsKey,
      (currentJobs) =>
        currentJobs?.map((job) =>
          job.id === jobId
            ? { ...job, status }
            : job
        )
    );

    return { previousJobs };
  },

  onError: (error, _variables, context) => {
    // Recuperar los datos anteriores si falla
    if (context?.previousJobs !== undefined) {
      queryClient.setQueryData(
        jobsKey,
        context.previousJobs
      );
    }

    console.error("Error al mover candidatura:", error);

    setMoveError(
      "No se pudo guardar el cambio. Se ha restaurado el estado anterior."
    );
  },

  onSettled: async (_data, _error, variables) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: jobsKey,
    }),

    queryClient.invalidateQueries({
      queryKey: ["job", userId, variables.jobId],
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "job-status-history",
        userId,
        variables.jobId,
      ],
    }),
  ]);
},
});

  const jobs: BoardJob[] = data ?? [];

  // Aplicar cambios locales sin modificar Supabase

  if (isPending) {
    return <p>Cargando tablero...</p>;
  }

  if (isError) {
    return (
      <section>
        <p role="alert">No se pudo cargar el tablero.</p>
        <button type="button" onClick={() => void refetch()}>
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Tablero Kanban</h1>
      <p>Arrastra una candidatura para cambiar su estado.</p>
{moveJobMutation.isPending && (
  <p role="status">Guardando movimiento...</p>
)}

{moveError && (
  <p role="alert" className="kanban-move-error">
    {moveError}
  </p>
)}
      <DragDropProvider
       onDragEnd={({ operation, canceled }) => {
  if (
    canceled ||
    !operation.source ||
    !operation.target ||
    moveJobMutation.isPending
  ) {
    return;
  }

  const jobId = String(operation.source.id);

  const destination = columns.find(
    (column) => column.status === operation.target?.id
  );

  if (!destination) return;

  const job = jobs.find((item) => item.id === jobId);

  if (!job || job.status === destination.status) {
    return;
  }

  moveJobMutation.mutate({
    jobId,
    status: destination.status,
  });
}}
      >
        <div className="kanban-board">
          {columns.map((column) => {
           const columnJobs = jobs.filter(
  (job) => job.status === column.status
);

            return (
              <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                jobs={columnJobs}
              />
            );
          })}
        </div>
      </DragDropProvider>
    </section>
  );
}
