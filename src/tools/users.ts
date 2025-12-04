import { z } from 'zod';
import { getApiClient, ApiError } from '../api/client.js';

export const listUsersSchema = z.object({});

export const getUserSchema = z.object({
  id: z.number().int().positive().describe('User ID'),
});

export const createUserSchema = z.object({
  name: z.string().min(1).describe('User name'),
  email: z.string().email().describe('User email'),
  password: z.string().min(8).describe('User password (min 8 characters)'),
  role: z.number().int().describe('User role'),
  admin: z.boolean().optional().default(false).describe('Is admin (default: false)'),
});

export const updateUserEmailSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  email: z.string().email().describe('New email'),
});

export const updateUserNameSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  name: z.string().min(1).describe('New name'),
});

export const updateUserPasswordSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  password: z.string().min(8).describe('New password (min 8 characters)'),
});

export const updateUserAdminSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  admin: z.boolean().describe('Admin status'),
});

export const updateUserRoleSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  role: z.number().int().describe('New role'),
});

export type ListUsersParams = z.infer<typeof listUsersSchema>;
export type GetUserParams = z.infer<typeof getUserSchema>;
export type CreateUserParams = z.infer<typeof createUserSchema>;
export type UpdateUserEmailParams = z.infer<typeof updateUserEmailSchema>;
export type UpdateUserNameParams = z.infer<typeof updateUserNameSchema>;
export type UpdateUserPasswordParams = z.infer<typeof updateUserPasswordSchema>;
export type UpdateUserAdminParams = z.infer<typeof updateUserAdminSchema>;
export type UpdateUserRoleParams = z.infer<typeof updateUserRoleSchema>;

export async function listUsers(): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.listUsers();

    const usersSummary = response.data.map(user => {
      const exchanges = user.exchanges?.length > 0
        ? user.exchanges.map(e => `${e.name} (${e.exchange}, ID: ${e.id})`).join(', ')
        : 'None';
      return `- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Admin: ${user.admin ? 'Yes' : 'No'}, Role: ${user.role}
  Exchanges: ${exchanges}`;
    }).join('\n');

    return `Users (Total: ${response.data.length}):\n\n${usersSummary}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching users: ${error.message}`;
    }
    throw error;
  }
}

export async function getUser(params: GetUserParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getUser(params.id);
    const user = response.data;

    return `User Details:
- ID: ${user.id}
- Name: ${user.name}
- Email: ${user.email}
- Admin: ${user.admin ? 'Yes' : 'No'}
- Role: ${user.role}
- Timezone: ${user.timezone || 'Not set'}
- Last Seen: ${user.last_seen || 'Never'}
- Created: ${user.created_at}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `User with ID ${params.id} not found.`;
      }
      return `Error fetching user: ${error.message}`;
    }
    throw error;
  }
}

export async function createUser(params: CreateUserParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.createUser({
      name: params.name,
      email: params.email,
      password: params.password,
      role: params.role,
      admin: params.admin,
    });
    const user = response.data;

    return `User created successfully:
- ID: ${user.id}
- Name: ${user.name}
- Email: ${user.email}
- Admin: ${user.admin ? 'Yes' : 'No'}
- Role: ${user.role}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error creating user: ${error.message}`;
    }
    throw error;
  }
}

export async function updateUserEmail(params: UpdateUserEmailParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.updateUser(params.user_id, { email: params.email });
    return `User ${response.data.id} email updated to: ${response.data.email}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `User with ID ${params.user_id} not found.`;
      }
      return `Error updating email: ${error.message}`;
    }
    throw error;
  }
}

export async function updateUserName(params: UpdateUserNameParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.updateUser(params.user_id, { name: params.name });
    return `User ${response.data.id} name updated to: ${response.data.name}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `User with ID ${params.user_id} not found.`;
      }
      return `Error updating name: ${error.message}`;
    }
    throw error;
  }
}

export async function updateUserPassword(params: UpdateUserPasswordParams): Promise<string> {
  try {
    const client = getApiClient();
    await client.updateUser(params.user_id, { password: params.password });
    return `User ${params.user_id} password updated successfully.`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `User with ID ${params.user_id} not found.`;
      }
      return `Error updating password: ${error.message}`;
    }
    throw error;
  }
}

export async function updateUserAdmin(params: UpdateUserAdminParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.updateUser(params.user_id, { admin: params.admin });
    return `User ${response.data.id} admin status set to: ${response.data.admin ? 'Yes' : 'No'}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `User with ID ${params.user_id} not found.`;
      }
      return `Error updating admin status: ${error.message}`;
    }
    throw error;
  }
}

export async function updateUserRole(params: UpdateUserRoleParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.updateUser(params.user_id, { role: params.role });
    return `User ${response.data.id} role updated to: ${response.data.role}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `User with ID ${params.user_id} not found.`;
      }
      return `Error updating role: ${error.message}`;
    }
    throw error;
  }
}

export function listRoles(): string {
  return `Available Roles:
- Role 1: Admin
- Role 2: User`;
}
