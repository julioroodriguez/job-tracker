import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export function LoginPage(){

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const navigate = useNavigate();

async function handleSubmit(event: FormEvent<HTMLFormElement>){
event.preventDefault();

  setLoading(true);
setErrorMessage("");

const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});



if (error) {
  setErrorMessage("Email o contraseña incorrectos");
  setLoading(false);
  return;
}

navigate("/dashboard");

}

    return (
        <main>
        <form onSubmit={handleSubmit}>
            <input
            type="email"
            name="email"
            placeholder="E-mail"
            value={email}
            onChange={(event)=>setEmail(event.target.value)}
            />

            <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            />
            <button type="submit" disabled={loading}>
                {loading ? "Iniciando sesion...":"Iniciar sesion"}
            </button>
        </form>
        {errorMessage && <p>{errorMessage}</p>}
        </main>
    );
}