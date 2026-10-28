import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import "../styles/layout.css";

export function AppLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>

      <div className="app-content">
        <header className="app-header">
          <Header />
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}