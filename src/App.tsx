import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { JobFormPahe } from "./pages/JobFormPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { BoardPage } from "./pages/BoardPage";
import { NotFoundPage } from "./pages/NotFoundPage";


function App() {
  return (

        <Routes>
  <Route
    path="/"
    element={<Navigate to="/dashboard" replace />}
  />

  <Route element={<AppLayout />}>
    <Route
      path="/dashboard"
      element={<DashboardPage />}
    />

    <Route
      path="/jobs"
      element={<JobsPage />}
    />

    <Route
      path="/jobs/new"
      element={<JobFormPahe />}
    />

    <Route
      path="/jobs/:id"
      element={<JobDetailPage />}
    />

    <Route
      path="/jobs/:id/edit"
      element={<JobFormPahe />}
    />

    <Route
      path="/board"
      element={<BoardPage />}
    />
  </Route>

  <Route
    path="*"
    element={<NotFoundPage />}
  />
</Routes>

 
  );
}

export default App;