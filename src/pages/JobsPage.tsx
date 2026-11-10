import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { getJobs } from "../services/jobsService";
import type { Job } from "../types/job";

type JobListItem = Pick<
  Job,
  "id" | "company" | "position" | "status" | "location"
>;

export function JobsPage() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const {
    data,
    isPending,
    isError,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["jobs", userId],
    queryFn: getJobs,
    enabled: Boolean(userId),
  });

  const jobs: JobListItem[] = data ?? [];

  return (
    <section>
      <h1>Candidaturas</h1>

      <p>
        <Link to="/jobs/new">Nueva candidatura</Link>
      </p>

      {isPending ? (
        <p>Cargando candidaturas...</p>
      ) : isError ? (
        <div role="alert">
          <p>No se pudieron cargar las candidaturas.</p>
          <p>{error.message}</p>
        </div>
      ) : jobs.length === 0 ? (
        <p>Todavía no tienes candidaturas.</p>
      ) : (
        <>
          {isFetching && <p>Actualizando candidaturas...</p>}

          <ul>
            {jobs.map((job) => (
              <li key={job.id}>
                <Link to={`/jobs/${job.id}`}>
                  <strong>{job.company}</strong>
                  <p>{job.position}</p>
                  <p>Estado: {job.status}</p>
                  <p>Ubicación: {job.location}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}