import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export function RegisterPage(){

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [successMessage, setSuccessMessage] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>){
event.preventDefault();

 setLoading(true);
setErrorMessage("");
setSuccessMessage("");

const { error } = await supabase.auth.signUp({
  email,
  password,
});

if (error) {
  setErrorMessage(error.message);
  setLoading(false);
  return;
}

setSuccessMessage(
  "Cuenta creada. Revisa tu correo para confirmar tu cuenta."
);

setEmail("");
setPassword("");
setLoading(false);


}

    return (
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
                {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
        {errorMessage && <p>{errorMessage}</p>}
        {successMessage && <p>{successMessage}</p>}
        </form>
        
    );
}