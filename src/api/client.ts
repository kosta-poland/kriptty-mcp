import { getConfig } from '../config.js';

export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
  role: number;
  timezone: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface RoutineAction {
  grid_mode: string;
  grid_id: number;
  lm: string;
  lwe: number;
  sm: string;
  swe: number;
}

export interface Routine {
  id: string;
  user_id: number;
  name: string;
  type: string;
  action: RoutineAction;
  triggered_at: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface GridSummary {
  id: number;
  user_id: number;
  name: string;
}

export interface RoutineParameters {
  grid_modes: Record<string, string>;
  bot_modes: Record<string, string>;
  grids: GridSummary[];
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  data: T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export class KripttyApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.apiUrl.replace(/\/$/, '');
    this.token = config.apiToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ApiError(
        response.status,
        response.statusText,
        `API request failed: ${response.status} ${response.statusText}. ${errorBody}`
      );
    }

    return response.json() as Promise<T>;
  }

  async listUsers(): Promise<{ data: User[] }> {
    return this.request<{ data: User[] }>('/users');
  }

  async getUser(id: number): Promise<SingleResponse<User>> {
    return this.request<SingleResponse<User>>(`/users/${id}`);
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: number;
    admin?: boolean;
  }): Promise<SingleResponse<User>> {
    return this.request<SingleResponse<User>>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: {
    name?: string;
    email?: string;
    password?: string;
    admin?: boolean;
    role?: number;
  }): Promise<SingleResponse<User>> {
    return this.request<SingleResponse<User>>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Routine endpoints
  async getRoutineParameters(): Promise<SingleResponse<RoutineParameters>> {
    return this.request<SingleResponse<RoutineParameters>>('/routine-parameters');
  }

  async listRoutines(): Promise<{ data: Routine[] }> {
    return this.request<{ data: Routine[] }>('/routines');
  }

  async getRoutine(id: string): Promise<SingleResponse<Routine>> {
    return this.request<SingleResponse<Routine>>(`/routines/${id}`);
  }

  async createRoutine(data: {
    user_id: number;
    name: string;
    type?: string;
    action: RoutineAction;
  }): Promise<SingleResponse<Routine>> {
    return this.request<SingleResponse<Routine>>('/routines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoutine(id: string, data: {
    name?: string;
    type?: string;
    action?: Partial<RoutineAction>;
  }): Promise<SingleResponse<Routine>> {
    return this.request<SingleResponse<Routine>>(`/routines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async runRoutine(id: string): Promise<{ message: string; data: Routine }> {
    return this.request<{ message: string; data: Routine }>(`/routines/${id}/run`, {
      method: 'POST',
    });
  }
}

let client: KripttyApiClient | null = null;

export function getApiClient(): KripttyApiClient {
  if (!client) {
    client = new KripttyApiClient();
  }
  return client;
}
