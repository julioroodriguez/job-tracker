import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJobs } from "../services/jobsService";

export function JobsPage(){

const [jobs, setJobs] = useState<Awaited<ReturnType<typeof getJobs>>>([]);
const [loading, setLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState("");

useEffect(() => {
  let cancelled = false;

  async function loadJobs() {
    try {
      const data = await getJobs();

      if (!cancelled) {
        setJobs(data);
      }
    } catch (error) {
      if (!cancelled) {
        setErrorMessage("No se pudieron cargar las candidaturas.");
        console.error(error);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadJobs();

  return () => {
    cancelled = true;
  };
}, []);

    return (
    <section>
      <h1>Candidaturas</h1>
      <p>Todavía no hay candidaturas.</p>
      <p>
        <Link to={"/jobs/new"}>Nueva candidatura</Link>
        </p>
        {loading ? (
  <p>Cargando candidaturas...</p>
) : errorMessage ? (
  <p role="alert">{errorMessage}</p>
) : jobs.length === 0 ? (
  <p>Todavía no tienes candidaturas.</p>
) : (
  <ul>
    {jobs.map((job) => (
     
  <Link to={`/jobs/${job.id}`}>
    <strong>{job.company}</strong>
    <p>{job.position}</p>
    <p>{job.status}</p>
  </Link>

    ))}
  </ul>
)}
    </section>
  );
}