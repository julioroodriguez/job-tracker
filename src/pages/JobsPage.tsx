import { Link } from "react-router-dom";

export function JobsPage(){
    return (
    <section>
      <h1>Candidaturas</h1>
      <p>Todavía no hay candidaturas.</p>
      <p>
        <Link to={"/jobs/new"}>Nueva candidatura</Link>
        </p>
    </section>
  );
}