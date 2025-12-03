import { z } from 'zod';
import { getApiClient, ApiError, RoutineAction } from '../api/client.js';

export const getRoutineParametersSchema = z.object({});

export const listRoutinesSchema = z.object({});

export const getRoutineSchema = z.object({
  id: z.string().uuid().describe('Routine ID (UUID)'),
});

export const createRoutineSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  name: z.string().min(1).max(52).describe('Routine name'),
  grid_mode: z.enum(['recursive', 'neat', 'static', 'clock', 'custom']).describe('Grid mode'),
  grid_id: z.number().int().min(0).describe('Grid ID (0 for none)'),
  lm: z.enum(['n', 'm', 'gs', 't', 'p']).describe('Long mode: n=normal, m=manual, gs=graceful stop, t=take profit, p=panic'),
  lwe: z.number().min(0).max(11).describe('Long wallet exposure (0-11)'),
  sm: z.enum(['n', 'm', 'gs', 't', 'p']).describe('Short mode: n=normal, m=manual, gs=graceful stop, t=take profit, p=panic'),
  swe: z.number().min(0).max(11).describe('Short wallet exposure (0-11)'),
});

export const updateRoutineSchema = z.object({
  id: z.string().uuid().describe('Routine ID (UUID)'),
  name: z.string().min(1).max(52).optional().describe('Routine name'),
  grid_mode: z.enum(['recursive', 'neat', 'static', 'clock', 'custom']).optional().describe('Grid mode'),
  grid_id: z.number().int().min(0).optional().describe('Grid ID (0 for none)'),
  lm: z.enum(['n', 'm', 'gs', 't', 'p']).optional().describe('Long mode'),
  lwe: z.number().min(0).max(11).optional().describe('Long wallet exposure (0-11)'),
  sm: z.enum(['n', 'm', 'gs', 't', 'p']).optional().describe('Short mode'),
  swe: z.number().min(0).max(11).optional().describe('Short wallet exposure (0-11)'),
});

export const runRoutineSchema = z.object({
  id: z.string().uuid().describe('Routine ID (UUID)'),
});

export type GetRoutineParametersParams = z.infer<typeof getRoutineParametersSchema>;
export type ListRoutinesParams = z.infer<typeof listRoutinesSchema>;
export type GetRoutineParams = z.infer<typeof getRoutineSchema>;
export type CreateRoutineParams = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineParams = z.infer<typeof updateRoutineSchema>;
export type RunRoutineParams = z.infer<typeof runRoutineSchema>;

export async function getRoutineParameters(): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getRoutineParameters();
    const params = response.data;

    const gridModes = Object.entries(params.grid_modes)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const botModes = Object.entries(params.bot_modes)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const grids = params.grids
      .map(g => `  - ID: ${g.id}, Name: ${g.name}, User: ${g.user_id}`)
      .join('\n');

    return `Routine Parameters:

Grid Modes:
${gridModes}

Bot Modes (for lm/sm):
${botModes}

Available Grids:
${grids || '  (none)'}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching routine parameters: ${error.message}`;
    }
    throw error;
  }
}

export async function listRoutines(): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.listRoutines();

    if (response.data.length === 0) {
      return 'No routines found.';
    }

    const routinesSummary = response.data.map(routine =>
      `- ID: ${routine.id}
  Name: ${routine.name}
  User: ${routine.user_id}
  Type: ${routine.type}
  Grid Mode: ${routine.action.grid_mode}, Grid ID: ${routine.action.grid_id}
  Long: ${routine.action.lm} (WE: ${routine.action.lwe})
  Short: ${routine.action.sm} (WE: ${routine.action.swe})
  Last Run: ${routine.triggered_at || 'Never'}`
    ).join('\n\n');

    return `Routines (Total: ${response.data.length}):\n\n${routinesSummary}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching routines: ${error.message}`;
    }
    throw error;
  }
}

export async function getRoutine(params: GetRoutineParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getRoutine(params.id);
    const routine = response.data;

    return `Routine Details:
- ID: ${routine.id}
- Name: ${routine.name}
- User ID: ${routine.user_id}
- Type: ${routine.type}
- Grid Mode: ${routine.action.grid_mode}
- Grid ID: ${routine.action.grid_id}
- Long Mode: ${routine.action.lm}
- Long Wallet Exposure: ${routine.action.lwe}
- Short Mode: ${routine.action.sm}
- Short Wallet Exposure: ${routine.action.swe}
- Last Run: ${routine.triggered_at || 'Never'}
- Triggered By: ${routine.triggered_by || 'N/A'}
- Created: ${routine.created_at}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Routine with ID ${params.id} not found.`;
      }
      return `Error fetching routine: ${error.message}`;
    }
    throw error;
  }
}

export async function createRoutine(params: CreateRoutineParams): Promise<string> {
  try {
    const client = getApiClient();
    const action: RoutineAction = {
      grid_mode: params.grid_mode,
      grid_id: params.grid_id,
      lm: params.lm,
      lwe: params.lwe,
      sm: params.sm,
      swe: params.swe,
    };

    const response = await client.createRoutine({
      user_id: params.user_id,
      name: params.name,
      action,
    });
    const routine = response.data;

    return `Routine created successfully:
- ID: ${routine.id}
- Name: ${routine.name}
- User ID: ${routine.user_id}
- Grid Mode: ${routine.action.grid_mode}
- Grid ID: ${routine.action.grid_id}
- Long Mode: ${routine.action.lm} (WE: ${routine.action.lwe})
- Short Mode: ${routine.action.sm} (WE: ${routine.action.swe})`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error creating routine: ${error.message}`;
    }
    throw error;
  }
}

export async function updateRoutine(params: UpdateRoutineParams): Promise<string> {
  try {
    const client = getApiClient();

    const updateData: {
      name?: string;
      action?: Partial<RoutineAction>;
    } = {};

    if (params.name) {
      updateData.name = params.name;
    }

    const actionUpdates: Partial<RoutineAction> = {};
    if (params.grid_mode !== undefined) actionUpdates.grid_mode = params.grid_mode;
    if (params.grid_id !== undefined) actionUpdates.grid_id = params.grid_id;
    if (params.lm !== undefined) actionUpdates.lm = params.lm;
    if (params.lwe !== undefined) actionUpdates.lwe = params.lwe;
    if (params.sm !== undefined) actionUpdates.sm = params.sm;
    if (params.swe !== undefined) actionUpdates.swe = params.swe;

    if (Object.keys(actionUpdates).length > 0) {
      updateData.action = actionUpdates;
    }

    const response = await client.updateRoutine(params.id, updateData);
    const routine = response.data;

    return `Routine updated successfully:
- ID: ${routine.id}
- Name: ${routine.name}
- Grid Mode: ${routine.action.grid_mode}
- Grid ID: ${routine.action.grid_id}
- Long Mode: ${routine.action.lm} (WE: ${routine.action.lwe})
- Short Mode: ${routine.action.sm} (WE: ${routine.action.swe})`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Routine with ID ${params.id} not found.`;
      }
      return `Error updating routine: ${error.message}`;
    }
    throw error;
  }
}

export async function runRoutine(params: RunRoutineParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.runRoutine(params.id);

    return `${response.message}
- Routine: ${response.data.name}
- Triggered At: ${response.data.triggered_at}
- Triggered By: ${response.data.triggered_by}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Routine with ID ${params.id} not found.`;
      }
      return `Error running routine: ${error.message}`;
    }
    throw error;
  }
}
