import { NavLink } from "react-router-dom";

export function Sidebar(){
   return <aside>
    <nav>
    <NavLink
  to="/dashboard"
  className={({ isActive }) => isActive ? "active" : ""}
>
  Dashboard
</NavLink>
</nav>
<nav>
 <NavLink
  to="/jobs"
  className={({ isActive }) => isActive ? "active" : ""}
>
  Candidaturas
</NavLink>
</nav>
<nav>
 <NavLink
  to="/jobs/new"
  className={({ isActive }) => isActive ? "active" : ""}
>
  Nueva Candidatura
</NavLink>
</nav>
<nav>
 <NavLink
  to="/board"
  className={({ isActive }) => isActive ? "active" : ""}
>
  Kanban
</NavLink>
</nav>
</aside>
}