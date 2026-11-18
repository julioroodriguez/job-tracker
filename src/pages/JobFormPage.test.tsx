
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { JobFormPahe } from "./JobFormPage";
import { createJob } from "../services/jobsService";

// Simulamos un usuario autenticado
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    session: {
      user: {
        id: "test-user-id",
      },
    },
  }),
}));

// Simulamos los servicios de Supabase
vi.mock("../services/jobsService", () => ({
  createJob: vi.fn().mockResolvedValue({
    id: "test-job-id",
  }),
  getJobById: vi.fn(),
  updateJob: vi.fn(),
}));

// Renderizar el formulario con sus providers
function renderJobForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/jobs/new"]}>
        <Routes>
          <Route
            path="/jobs/new"
            element={<JobFormPahe />}
          />

          <Route
            path="/jobs/:id"
            element={<h1>Detalle de prueba</h1>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("JobFormPahe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el formulario de creación", () => {
    renderJobForm();

    expect(
      screen.getByRole("heading", {
        name: "Nueva candidatura",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Empresa",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Crear candidatura",
      })
    ).toBeInTheDocument();
  });

  it("muestra errores si faltan campos obligatorios", async () => {
    const user = userEvent.setup();

    renderJobForm();

    await user.click(
      screen.getByRole("button", {
        name: "Crear candidatura",
      })
    );

    expect(
      await screen.findByText(
        "La empresa es obligatoria"
      )
    ).toBeInTheDocument();

    expect(createJob).not.toHaveBeenCalled();
  });

  it("crea una candidatura con datos válidos", async () => {
    const user = userEvent.setup();

    renderJobForm();

    await user.type(
      screen.getByRole("textbox", {
        name: "Empresa",
      }),
      "Google"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Puesto",
      }),
      "Frontend Developer"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Ubicación",
      }),
      "Bilbao"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Crear candidatura",
      })
    );

    await waitFor(() => {
      expect(createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "Google",
          position: "Frontend Developer",
          location: "Bilbao",
          status: "pending",
          work_mode: "hybrid",
        })
      );
    });

    expect(
      await screen.findByRole("heading", {
        name: "Detalle de prueba",
      })
    ).toBeInTheDocument();
  });

  it("impide guardar un salario máximo inferior al mínimo", async () => {
    const user = userEvent.setup();

    renderJobForm();

    await user.type(
      screen.getByRole("textbox", {
        name: "Empresa",
      }),
      "Microsoft"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Puesto",
      }),
      "React Developer"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Ubicación",
      }),
      "Madrid"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Salario mínimo bruto anual",
      }),
      "35000"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Salario máximo bruto anual",
      }),
      "25000"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Crear candidatura",
      })
    );

    expect(
      await screen.findByText(
        "El salario máximo no puede ser inferior al mínimo"
      )
    ).toBeInTheDocument();

    expect(createJob).not.toHaveBeenCalled();
  });
});
