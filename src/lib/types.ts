export interface Session {
  id: number;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

export interface Exercise {
  id: number;
  user_id: string;
  name: string;
  category: string | null;
  default_rest_s: number;
  created_at: string;
}

export interface ExerciseSet {
  id: number;
  user_id: string;
  session_id: number;
  exercise_id: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  rest_s: number | null;
  notes: string | null;
  completed_at: string;
}

export interface SessionData {
  active: boolean;
  session: Session | null;
  last_exercise: string | null;
  last_rest_s: number | null;
  last_set: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  preferred_rest_s: number;
  created_at: string;
}

export interface ApiError {
  error: string;
}
