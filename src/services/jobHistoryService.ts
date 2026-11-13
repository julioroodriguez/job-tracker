import { supabase } from "../lib/supabase";

export type JobStatusHistoryEntry = {
  id: string;
  job_id: string;
  old_status: string;
  new_status: string;
  changed_at: string;
};

export async function getJobStatusHistory(
  jobId: string
): Promise<JobStatusHistoryEntry[]> {
  const { data, error } = await supabase
    .from("job_status_history")
    .select("id, job_id, old_status, new_status, changed_at")
    .eq("job_id", jobId)
    .order("changed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}