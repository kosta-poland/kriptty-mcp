#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  listUsers,
  getUser,
  createUser,
  updateUserEmail,
  updateUserName,
  updateUserPassword,
  updateUserAdmin,
  updateUserRole,
  listRoles,
} from './tools/users.js';
import {
  getRoutineParameters,
  listRoutines,
  getRoutine,
  createRoutine,
  updateRoutine,
  runRoutine,
} from './tools/routines.js';

const server = new McpServer({
  name: 'kriptty-mcp',
  version: '1.0.0',
});

server.registerTool(
  'list_users',
  {
    title: 'List Users',
    description: 'List all users from Kriptty',
    inputSchema: {},
  },
  async () => {
    const result = await listUsers();
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'get_user',
  {
    title: 'Get User',
    description: 'Get a single user by ID from Kriptty',
    inputSchema: {
      id: z.number().int().positive().describe('User ID'),
    },
  },
  async (params) => {
    const result = await getUser({ id: params.id });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'create_user',
  {
    title: 'Create User',
    description: 'Create a new user in Kriptty',
    inputSchema: {
      name: z.string().min(1).describe('User name'),
      email: z.string().email().describe('User email'),
      password: z.string().min(8).describe('User password (min 8 characters)'),
      role: z.number().int().describe('User role'),
      admin: z.boolean().optional().default(false).describe('Is admin (default: false)'),
    },
  },
  async (params) => {
    const result = await createUser({
      name: params.name,
      email: params.email,
      password: params.password,
      role: params.role,
      admin: params.admin ?? false,
    });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'update_user_email',
  {
    title: 'Update User Email',
    description: 'Update email for a user',
    inputSchema: {
      user_id: z.number().int().positive().describe('User ID'),
      email: z.string().email().describe('New email'),
    },
  },
  async (params) => {
    const result = await updateUserEmail({ user_id: params.user_id, email: params.email });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'update_user_name',
  {
    title: 'Update User Name',
    description: 'Update name for a user',
    inputSchema: {
      user_id: z.number().int().positive().describe('User ID'),
      name: z.string().min(1).describe('New name'),
    },
  },
  async (params) => {
    const result = await updateUserName({ user_id: params.user_id, name: params.name });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'update_user_password',
  {
    title: 'Update User Password',
    description: 'Set a new password for a user',
    inputSchema: {
      user_id: z.number().int().positive().describe('User ID'),
      password: z.string().min(8).describe('New password (min 8 characters)'),
    },
  },
  async (params) => {
    const result = await updateUserPassword({ user_id: params.user_id, password: params.password });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'update_user_admin',
  {
    title: 'Update User Admin Status',
    description: 'Set admin status for a user',
    inputSchema: {
      user_id: z.number().int().positive().describe('User ID'),
      admin: z.boolean().describe('Admin status (true/false)'),
    },
  },
  async (params) => {
    const result = await updateUserAdmin({ user_id: params.user_id, admin: params.admin });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'update_user_role',
  {
    title: 'Update User Role',
    description: 'Update role for a user',
    inputSchema: {
      user_id: z.number().int().positive().describe('User ID'),
      role: z.number().int().describe('New role'),
    },
  },
  async (params) => {
    const result = await updateUserRole({ user_id: params.user_id, role: params.role });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'list_roles',
  {
    title: 'List Roles',
    description: 'List available user roles',
    inputSchema: {},
  },
  async () => {
    const result = listRoles();
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

// Routine tools
server.registerTool(
  'list_routine_parameters',
  {
    title: 'List Routine Parameters',
    description: 'List available routine parameters (grid modes, bot modes, and custom grids)',
    inputSchema: {},
  },
  async () => {
    const result = await getRoutineParameters();
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'list_routines',
  {
    title: 'List Routines',
    description: 'List all routines from Kriptty',
    inputSchema: {},
  },
  async () => {
    const result = await listRoutines();
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'get_routine',
  {
    title: 'Get Routine',
    description: 'Get a single routine by ID from Kriptty',
    inputSchema: {
      id: z.string().uuid().describe('Routine ID (UUID)'),
    },
  },
  async (params) => {
    const result = await getRoutine({ id: params.id });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'create_routine',
  {
    title: 'Create Routine',
    description: 'Create a new routine in Kriptty',
    inputSchema: {
      user_id: z.number().int().positive().describe('User ID'),
      name: z.string().min(1).max(52).describe('Routine name'),
      grid_mode: z.enum(['recursive', 'neat', 'static', 'clock', 'custom']).describe('Grid mode'),
      grid_id: z.number().int().min(0).describe('Grid ID (0 for none)'),
      lm: z.enum(['n', 'm', 'gs', 't', 'p']).describe('Long mode: n=normal, m=manual, gs=graceful stop, t=take profit, p=panic'),
      lwe: z.number().min(0).max(11).describe('Long wallet exposure (0-11)'),
      sm: z.enum(['n', 'm', 'gs', 't', 'p']).describe('Short mode: n=normal, m=manual, gs=graceful stop, t=take profit, p=panic'),
      swe: z.number().min(0).max(11).describe('Short wallet exposure (0-11)'),
    },
  },
  async (params) => {
    const result = await createRoutine({
      user_id: params.user_id,
      name: params.name,
      grid_mode: params.grid_mode,
      grid_id: params.grid_id,
      lm: params.lm,
      lwe: params.lwe,
      sm: params.sm,
      swe: params.swe,
    });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'update_routine',
  {
    title: 'Update Routine',
    description: 'Update an existing routine in Kriptty',
    inputSchema: {
      id: z.string().uuid().describe('Routine ID (UUID)'),
      name: z.string().min(1).max(52).optional().describe('Routine name'),
      grid_mode: z.enum(['recursive', 'neat', 'static', 'clock', 'custom']).optional().describe('Grid mode'),
      grid_id: z.number().int().min(0).optional().describe('Grid ID (0 for none)'),
      lm: z.enum(['n', 'm', 'gs', 't', 'p']).optional().describe('Long mode'),
      lwe: z.number().min(0).max(11).optional().describe('Long wallet exposure (0-11)'),
      sm: z.enum(['n', 'm', 'gs', 't', 'p']).optional().describe('Short mode'),
      swe: z.number().min(0).max(11).optional().describe('Short wallet exposure (0-11)'),
    },
  },
  async (params) => {
    const result = await updateRoutine({
      id: params.id,
      name: params.name,
      grid_mode: params.grid_mode,
      grid_id: params.grid_id,
      lm: params.lm,
      lwe: params.lwe,
      sm: params.sm,
      swe: params.swe,
    });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.registerTool(
  'run_routine',
  {
    title: 'Run Routine',
    description: 'Execute a routine to apply its configuration to all bots',
    inputSchema: {
      id: z.string().uuid().describe('Routine ID (UUID)'),
    },
  },
  async (params) => {
    const result = await runRoutine({ id: params.id });
    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kriptty MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
