const API_BASE_URL = "http://localhost:8000";

export type AuthUser = {
  id: number;
  email: string;
  created_at: string;
};

export type Profile = {
  user_id: number;
  display_name: string | null;
  age_range: string | null;
  primary_goal: string | null;
  main_difficulty: string | null;
  focus_range: string | null;
  days_per_week: number | null;
  onboarding_completed: boolean;
};

export type Preferences = {
  user_id: number;
  focus_minutes: number;
  rest_minutes: number;
  long_rest_minutes: number;
  sessions_before_long_rest: number;
  auto_start_rest: boolean;
  auto_start_focus: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  theme: "natural" | "ember" | "ocean" | "system";
  locale: "pt-BR" | "en";
};

export type Account = { user: AuthUser; profile: Profile; preferences: Preferences };

type AuthCredentials = {
  email: string;
  password: string;
};

async function parseResponse(response: Response) {
  if (response.ok) return response.json();
  const body = (await response.json().catch(() => null)) as { detail?: string } | null;
  throw new Error(body?.detail ?? "Não foi possível concluir a operação.");
}

export async function register(credentials: AuthCredentials): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });
  return parseResponse(response) as Promise<AuthUser>;
}

export async function login(credentials: AuthCredentials): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });
  return parseResponse(response) as Promise<AuthUser>;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
    signal,
  });
  return parseResponse(response) as Promise<AuthUser>;
}

export async function getCurrentAccount(signal?: AbortSignal): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/me`, { credentials: "include", signal });
  return parseResponse(response) as Promise<Account>;
}

export async function completeOnboarding(data: Record<string, unknown>): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/me/onboarding/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseResponse(response) as Promise<Account>;
}

export async function updateProfile(data: Record<string, unknown>): Promise<Profile> {
  const response = await fetch(`${API_BASE_URL}/me/profile`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data),
  });
  return parseResponse(response) as Promise<Profile>;
}

export async function updatePreferences(data: Partial<Preferences>): Promise<Preferences> {
  const response = await fetch(`${API_BASE_URL}/me/preferences`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data),
  });
  return parseResponse(response) as Promise<Preferences>;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Não foi possível sair da conta.");
}
