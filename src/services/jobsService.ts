import { supabase } from "../lib/supabase";
import type { JobStatus, workMode } from "../types/job";

type NewJob = {
  company: string;
  position: string;
  location: string;
  work_mode: "remote" | "hybrid" | "onsite";
  status?: JobStatus;
  job_url?: string | null;
notes?: string | null;
salary_min?: number | null;
salary_max?: number | null;
currency?: string | null;
technologies?: string[];
next_action?: string | null;
next_action_at?: string | null;
};

export async function createJob(job: NewJob) {
  const { data, error } = await supabase
    .from("jobs")
    .insert(job)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, company, position, status, location, work_mode")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getJobById(id: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


// Añade este tipo y la función al servicio.

type UpdateJobData = {
  company?: string;
  position?: string;
  status?: JobStatus;
  location?: string;
  work_mode?: workMode;
  job_url?: string | null;
notes?: string | null;
salary_min?: number | null;
salary_max?: number | null;
currency?: string | null;
technologies?: string[];
next_action?: string | null;
next_action_at?: string | null;
};

export async function updateJob(
  id: string,
  changes: UpdateJobData
) {
  const { data, error } = await supabase
    .from("jobs")
    .update({
      ...changes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Candidatura no encontrada o sin permisos");
  }

  return data;
}

export async function deleteJob(id: string) {
  const { data, error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Candidatura no encontrada o sin permisos.");
  }

  return data;
}