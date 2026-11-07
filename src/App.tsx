import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { JobFormPahe } from "./pages/JobFormPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { BoardPage } from "./pages/BoardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { JobFormPracticePage } from "./pages/JobFormPracticePage";


function App() {
  return (

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
    path="/register"
    element={<RegisterPage />}
  />
  
<Route element={<ProtectedRoute />}>
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
  path="/practice/job-form"
  element={<JobFormPracticePage />}
/>
<Route
  path="/practice/job-form/:id"
  element={<JobFormPracticePage />}
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
</Route>
  
  
</Routes>

 
  );
}

export default App;