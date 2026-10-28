import { useParams } from "react-router-dom";

export function JobDetailPage() {
  const { id } = useParams();

  return (
    <section>
      <h1>Detalle de candidatura: {id}</h1>
    </section>
  );
}