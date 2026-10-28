import { useParams } from "react-router-dom";

export function JobFormPahe() {
  const { id } = useParams();

  return (
    <section>
      <h1>
        {id ? "Editar candidatura" : "Nueva candidatura"}
      </h1>
    </section>
  );
}