import { z } from 'zod';
import { getApiClient, ApiError, Bot } from '../api/client.js';

export const getBotParametersSchema = z.object({});

export const listBotsSchema = z.object({
  user_id: z.number().int().positive().optional().describe('User ID to list bots for'),
  exchange_id: z.number().int().positive().optional().describe('Exchange ID to list bots for'),
});

export const getBotSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
});

export const createBotSchema = z.object({
  name: z.string().min(1).max(255).describe('Bot name'),
  exchange_id: z.number().int().positive().describe('Exchange ID'),
  symbol_id: z.number().int().positive().describe('Symbol ID (use list_bot_parameters to see available symbols)'),
  market_type: z.enum(['futures', 'spot']).describe('Market type'),
  grid_mode: z.enum(['recursive', 'neat', 'static', 'clock', 'custom']).describe('Grid mode'),
  grid_id: z.number().int().positive().optional().describe('Grid ID (required when grid_mode is "custom")'),
  lm: z.enum(['n', 'm', 'gs', 't', 'p']).describe('Long mode: n=normal, m=manual, gs=graceful stop, t=take profit, p=panic'),
  lwe: z.number().min(0).max(11).describe('Long wallet exposure (0-11)'),
  sm: z.enum(['n', 'm', 'gs', 't', 'p']).describe('Short mode: n=normal, m=manual, gs=graceful stop, t=take profit, p=panic'),
  swe: z.number().min(0).max(11).describe('Short wallet exposure (0-11)'),
  leverage: z.number().min(1).max(125).optional().describe('Leverage (default: 10)'),
  assigned_balance: z.number().min(0).optional().describe('Assigned balance (default: 0 for no limit)'),
  oh_mode: z.boolean().optional().describe('Order history mode (default: true)'),
  show_logs: z.boolean().optional().describe('Show logs (default: true)'),
  is_on_trend: z.boolean().optional().describe('Is on trend (default: false)'),
  is_on_routines: z.boolean().optional().describe('Is on routines (default: false)'),
});

export const updateBotSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
  name: z.string().min(1).max(255).optional().describe('Bot name'),
  symbol_id: z.number().int().positive().optional().describe('Symbol ID'),
  market_type: z.enum(['futures', 'spot']).optional().describe('Market type'),
  grid_mode: z.enum(['recursive', 'neat', 'static', 'clock', 'custom']).optional().describe('Grid mode'),
  grid_id: z.number().int().positive().nullable().optional().describe('Grid ID'),
  lm: z.enum(['n', 'm', 'gs', 't', 'p']).optional().describe('Long mode'),
  lwe: z.number().min(0).max(11).optional().describe('Long wallet exposure (0-11)'),
  sm: z.enum(['n', 'm', 'gs', 't', 'p']).optional().describe('Short mode'),
  swe: z.number().min(0).max(11).optional().describe('Short wallet exposure (0-11)'),
  leverage: z.number().min(1).max(125).optional().describe('Leverage'),
  assigned_balance: z.number().min(0).optional().describe('Assigned balance'),
  oh_mode: z.boolean().optional().describe('Order history mode'),
  show_logs: z.boolean().optional().describe('Show logs'),
  is_on_trend: z.boolean().optional().describe('Is on trend'),
  is_on_routines: z.boolean().optional().describe('Is on routines'),
});

export const startBotSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
});

export const stopBotSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
});

export const restartBotSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
});

export const swapBotWeSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
  new_trend: z.enum(['LONG', 'SHORT']).describe('New trend direction'),
});

export const simpleSwapBotWeSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
});

export const getBotStatusSchema = z.object({
  id: z.number().int().positive().describe('Bot ID'),
});

export type GetBotParametersParams = z.infer<typeof getBotParametersSchema>;
export type ListBotsParams = z.infer<typeof listBotsSchema>;
export type GetBotParams = z.infer<typeof getBotSchema>;
export type CreateBotParams = z.infer<typeof createBotSchema>;
export type UpdateBotParams = z.infer<typeof updateBotSchema>;
export type StartBotParams = z.infer<typeof startBotSchema>;
export type StopBotParams = z.infer<typeof stopBotSchema>;
export type RestartBotParams = z.infer<typeof restartBotSchema>;
export type SwapBotWeParams = z.infer<typeof swapBotWeSchema>;
export type SimpleSwapBotWeParams = z.infer<typeof simpleSwapBotWeSchema>;
export type GetBotStatusParams = z.infer<typeof getBotStatusSchema>;

const botModeLabels: Record<string, string> = {
  'n': 'Normal',
  'm': 'Manual',
  'gs': 'Graceful Stop',
  't': 'Take Profit Only',
  'p': 'Panic',
};

const gridModeLabels: Record<string, string> = {
  'recursive': 'Recursive',
  'neat': 'Neat',
  'static': 'Static',
  'clock': 'Clock',
  'custom': 'Custom',
};

function formatBot(bot: Bot): string {
  const exchangeInfo = bot.exchange ? `${bot.exchange.name} (${bot.exchange.exchange})` : `ID: ${bot.exchange_id}`;
  const symbolInfo = bot.symbol ? `${bot.symbol.nice_name}` : `ID: ${bot.symbol_id}`;
  const gridInfo = bot.grid ? bot.grid.name : (bot.grid_id ? `ID: ${bot.grid_id}` : 'N/A');

  return `- ID: ${bot.id}
  Name: ${bot.name}
  Status: ${bot.is_running ? 'RUNNING (PID: ' + bot.pid + ')' : 'STOPPED'}
  Exchange: ${exchangeInfo}
  Symbol: ${symbolInfo}
  Market Type: ${bot.market_type}
  Grid Mode: ${gridModeLabels[bot.grid_mode] || bot.grid_mode}
  Grid: ${gridInfo}
  Long Mode: ${botModeLabels[bot.lm] || bot.lm} (WE: ${bot.lwe})
  Short Mode: ${botModeLabels[bot.sm] || bot.sm} (WE: ${bot.swe})
  Leverage: ${bot.leverage}x
  Created: ${bot.created_at}`;
}

function formatBotDetailed(bot: Bot): string {
  const exchangeInfo = bot.exchange ? `${bot.exchange.name} (${bot.exchange.exchange})` : `ID: ${bot.exchange_id}`;
  const symbolInfo = bot.symbol ? `${bot.symbol.nice_name} (${bot.symbol.name})` : `ID: ${bot.symbol_id}`;
  const gridInfo = bot.grid ? bot.grid.name : (bot.grid_id ? `ID: ${bot.grid_id}` : 'N/A');

  return `Bot Details:
- ID: ${bot.id}
- Name: ${bot.name}
- Status: ${bot.is_running ? 'RUNNING' : 'STOPPED'}
- PID: ${bot.pid || 'N/A'}
- Started At: ${bot.started_at || 'N/A'}
- Stopped At: ${bot.stopped_at || 'N/A'}

Configuration:
- Exchange: ${exchangeInfo}
- Symbol: ${symbolInfo}
- Market Type: ${bot.market_type}
- Grid Mode: ${gridModeLabels[bot.grid_mode] || bot.grid_mode}
- Grid: ${gridInfo}
- Leverage: ${bot.leverage}x
- Assigned Balance: ${bot.assigned_balance > 0 ? bot.assigned_balance : 'No limit'}

Trading Modes:
- Long Mode: ${botModeLabels[bot.lm] || bot.lm}
- Long Wallet Exposure: ${bot.lwe}
- Short Mode: ${botModeLabels[bot.sm] || bot.sm}
- Short Wallet Exposure: ${bot.swe}

Options:
- Order History Mode: ${bot.oh_mode ? 'Enabled' : 'Disabled'}
- Show Logs: ${bot.show_logs ? 'Yes' : 'No'}
- On Trend: ${bot.is_on_trend ? 'Yes' : 'No'}
- On Routines: ${bot.is_on_routines ? 'Yes' : 'No'}

Metadata:
- User ID: ${bot.user_id}
- Created: ${bot.created_at}
- Updated: ${bot.updated_at}`;
}

export async function getBotParameters(): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getBotParameters();
    const params = response.data;

    const botModes = Object.entries(params.bot_modes)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const gridModes = Object.entries(params.grid_modes)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const marketTypes = Object.entries(params.market_types)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const grids = params.grids.length > 0
      ? params.grids.map(g => `  - ID: ${g.id}, Name: ${g.name} (User: ${g.user_id})`).join('\n')
      : '  No custom grids available';

    const symbolsGrouped = params.symbols.reduce((acc, s) => {
      if (!acc[s.exchange]) acc[s.exchange] = [];
      acc[s.exchange].push(s);
      return acc;
    }, {} as Record<string, typeof params.symbols>);

    const symbolsList = Object.entries(symbolsGrouped)
      .map(([exchange, symbols]) => {
        const symbolList = symbols.slice(0, 10).map(s => `    - ID: ${s.id}, ${s.nice_name}`).join('\n');
        const moreCount = symbols.length > 10 ? ` ... and ${symbols.length - 10} more` : '';
        return `  ${exchange}:\n${symbolList}${moreCount}`;
      })
      .join('\n');

    const requiredFields = params.fields.required.join(', ');
    const optionalFields = params.fields.optional.join(', ');
    const notes = Object.entries(params.fields.notes)
      .map(([field, note]) => `  - ${field}: ${note}`)
      .join('\n');

    return `Bot Parameters:

Bot Modes:
${botModes}

Grid Modes:
${gridModes}

Market Types:
${marketTypes}

Available Grids:
${grids}

Available Symbols (by exchange):
${symbolsList}

Required Fields: ${requiredFields}
Optional Fields: ${optionalFields}

Notes:
${notes}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching bot parameters: ${error.message}`;
    }
    throw error;
  }
}

export async function listBots(params: ListBotsParams): Promise<string> {
  try {
    if (!params.user_id && !params.exchange_id) {
      return 'Error: Either user_id or exchange_id is required.';
    }

    const client = getApiClient();
    const response = await client.listBots({
      user_id: params.user_id,
      exchange_id: params.exchange_id,
    });

    if (response.data.length === 0) {
      const filterDesc = params.user_id
        ? `user ${params.user_id}`
        : `exchange ${params.exchange_id}`;
      return `No bots found for ${filterDesc}.`;
    }

    const botsSummary = response.data.map(formatBot).join('\n\n');
    const filterDesc = params.user_id
      ? `User ${params.user_id}`
      : `Exchange ${params.exchange_id}`;

    const runningCount = response.data.filter(b => b.is_running).length;

    return `Bots for ${filterDesc} (Total: ${response.data.length}, Running: ${runningCount}):\n\n${botsSummary}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching bots: ${error.message}`;
    }
    throw error;
  }
}

export async function getBot(params: GetBotParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getBot(params.id);
    return formatBotDetailed(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      return `Error fetching bot: ${error.message}`;
    }
    throw error;
  }
}

export async function createBot(params: CreateBotParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.createBot({
      name: params.name,
      exchange_id: params.exchange_id,
      symbol_id: params.symbol_id,
      market_type: params.market_type,
      grid_mode: params.grid_mode,
      grid_id: params.grid_id,
      lm: params.lm,
      lwe: params.lwe,
      sm: params.sm,
      swe: params.swe,
      leverage: params.leverage,
      assigned_balance: params.assigned_balance,
      oh_mode: params.oh_mode,
      show_logs: params.show_logs,
      is_on_trend: params.is_on_trend,
      is_on_routines: params.is_on_routines,
    });
    const bot = response.data;

    return `Bot created successfully:
- ID: ${bot.id}
- Name: ${bot.name}
- Symbol: ${bot.symbol?.nice_name || bot.symbol_id}
- Grid Mode: ${gridModeLabels[bot.grid_mode] || bot.grid_mode}
- Long: ${botModeLabels[bot.lm] || bot.lm} (WE: ${bot.lwe})
- Short: ${botModeLabels[bot.sm] || bot.sm} (WE: ${bot.swe})

Note: Bot is created in STOPPED state. Use start_bot to start it.`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error creating bot: ${error.message}`;
    }
    throw error;
  }
}

export async function updateBot(params: UpdateBotParams): Promise<string> {
  try {
    const client = getApiClient();

    const updateData: Record<string, unknown> = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.symbol_id !== undefined) updateData.symbol_id = params.symbol_id;
    if (params.market_type !== undefined) updateData.market_type = params.market_type;
    if (params.grid_mode !== undefined) updateData.grid_mode = params.grid_mode;
    if (params.grid_id !== undefined) updateData.grid_id = params.grid_id;
    if (params.lm !== undefined) updateData.lm = params.lm;
    if (params.lwe !== undefined) updateData.lwe = params.lwe;
    if (params.sm !== undefined) updateData.sm = params.sm;
    if (params.swe !== undefined) updateData.swe = params.swe;
    if (params.leverage !== undefined) updateData.leverage = params.leverage;
    if (params.assigned_balance !== undefined) updateData.assigned_balance = params.assigned_balance;
    if (params.oh_mode !== undefined) updateData.oh_mode = params.oh_mode;
    if (params.show_logs !== undefined) updateData.show_logs = params.show_logs;
    if (params.is_on_trend !== undefined) updateData.is_on_trend = params.is_on_trend;
    if (params.is_on_routines !== undefined) updateData.is_on_routines = params.is_on_routines;

    const response = await client.updateBot(params.id, updateData);
    const bot = response.data;

    return `Bot updated successfully:
- ID: ${bot.id}
- Name: ${bot.name}
- Status: ${bot.is_running ? 'RUNNING' : 'STOPPED'}
- Long: ${botModeLabels[bot.lm] || bot.lm} (WE: ${bot.lwe})
- Short: ${botModeLabels[bot.sm] || bot.sm} (WE: ${bot.swe})

Note: If the bot is running, you may need to restart it for some changes to take effect.`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      return `Error updating bot: ${error.message}`;
    }
    throw error;
  }
}

export async function startBot(params: StartBotParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.startBot(params.id);
    const bot = response.data;

    return `${response.message}
- ID: ${bot.id}
- Name: ${bot.name}
- PID: ${bot.pid}
- Started At: ${bot.started_at}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      if (error.status === 422) {
        return `Error starting bot: ${error.message}`;
      }
      return `Error starting bot: ${error.message}`;
    }
    throw error;
  }
}

export async function stopBot(params: StopBotParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.stopBot(params.id);
    const bot = response.data;

    return `${response.message}
- ID: ${bot.id}
- Name: ${bot.name}
- Status: STOPPED`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      return `Error stopping bot: ${error.message}`;
    }
    throw error;
  }
}

export async function restartBot(params: RestartBotParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.restartBot(params.id);
    const bot = response.data;

    return `${response.message}
- ID: ${bot.id}
- Name: ${bot.name}
- PID: ${bot.pid}
- Started At: ${bot.started_at}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      if (error.status === 422) {
        return `Error restarting bot: ${error.message}`;
      }
      return `Error restarting bot: ${error.message}`;
    }
    throw error;
  }
}

export async function swapBotWe(params: SwapBotWeParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.swapBotWe(params.id, params.new_trend);
    const bot = response.data;

    return `${response.message}
- ID: ${bot.id}
- Name: ${bot.name}
- Long WE: ${bot.lwe}
- Short WE: ${bot.swe}

Note: If the bot is running, restart it for changes to take effect.`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      return `Error swapping wallet exposure: ${error.message}`;
    }
    throw error;
  }
}

export async function simpleSwapBotWe(params: SimpleSwapBotWeParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.simpleSwapBotWe(params.id);
    const bot = response.data;

    return `${response.message}
- ID: ${bot.id}
- Name: ${bot.name}
- Long WE: ${bot.lwe}
- Short WE: ${bot.swe}

Note: If the bot is running, restart it for changes to take effect.`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      return `Error swapping wallet exposure: ${error.message}`;
    }
    throw error;
  }
}

export async function getBotStatus(params: GetBotStatusParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getBotStatus(params.id);
    const status = response.data;

    return `Bot Status:
- ID: ${status.id}
- Name: ${status.name}
- Process Running: ${status.is_running ? 'YES' : 'NO'}
- PID: ${status.pid || 'N/A'}
- Started At: ${status.started_at || 'N/A'}
- Stopped At: ${status.stopped_at || 'N/A'}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Bot with ID ${params.id} not found.`;
      }
      return `Error fetching bot status: ${error.message}`;
    }
    throw error;
  }
}
