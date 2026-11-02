import { supabase } from "../lib/supabase";

const { data } = await supabase.auth.getSession();
console.log(data.session);

export function DashboardPage() {
  
  return <h1>Dashboard</h1>;
}