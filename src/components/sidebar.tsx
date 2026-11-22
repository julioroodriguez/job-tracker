
import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/jobs", label: "Candidaturas" },
  { to: "/jobs/new", label: "Nueva candidatura" },
  { to: "/board", label: "Kanban" },
];

export function Sidebar() {
  return (
    <nav
      className="sidebar-nav"
      aria-label="Navegación principal"
    >
      {navigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
