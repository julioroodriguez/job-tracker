import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";



export function Header(){

const queryClient = useQueryClient();

    const navigate = useNavigate();
async function handleLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return;
  }
await queryClient.cancelQueries();
queryClient.clear();

navigate("/login", { replace: true });
}


    return <header>
        <button onClick={handleLogout}>
  Cerrar sesión
</button>
    <h1>Job Tracker</h1>
    <h2>Manage your job search</h2>
    </header>
}