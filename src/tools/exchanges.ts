import { z } from 'zod';
import { getApiClient, ApiError, ExchangeDetailed } from '../api/client.js';

export const getExchangeParametersSchema = z.object({});

export const listExchangesSchema = z.object({
  user_id: z.number().int().positive().describe('User ID to list exchanges for'),
});

export const getExchangeSchema = z.object({
  id: z.number().int().positive().describe('Exchange ID'),
});

export const createExchangeSchema = z.object({
  user_id: z.number().int().positive().describe('User ID'),
  name: z.string().min(1).max(255).describe('Exchange name'),
  exchange: z.enum(['bybit', 'binance', 'binance_us', 'bitget', 'okx']).describe('Exchange type'),
  risk_mode: z.enum(['1', '2', '3']).describe('Risk mode: 1=Conservative, 2=Moderate, 3=Kamikaze'),
  api_key: z.string().min(1).max(100).describe('API key'),
  api_secret: z.string().min(1).max(100).describe('API secret'),
  api_frase: z.string().max(250).optional().describe('API passphrase (required for OKX)'),
  is_testnet: z.boolean().optional().default(false).describe('Use testnet (Bybit only)'),
});

export const updateExchangeSchema = z.object({
  id: z.number().int().positive().describe('Exchange ID'),
  name: z.string().min(1).max(255).optional().describe('Exchange name'),
  exchange: z.enum(['bybit', 'binance', 'binance_us', 'bitget', 'okx']).optional().describe('Exchange type'),
  risk_mode: z.enum(['1', '2', '3']).optional().describe('Risk mode'),
  api_key: z.string().min(1).max(100).optional().describe('API key'),
  api_secret: z.string().min(1).max(100).optional().describe('API secret'),
  api_frase: z.string().max(250).optional().describe('API passphrase'),
  is_testnet: z.boolean().optional().describe('Use testnet'),
});

export const refreshExchangeSchema = z.object({
  id: z.number().int().positive().describe('Exchange ID'),
});

export type GetExchangeParametersParams = z.infer<typeof getExchangeParametersSchema>;
export type ListExchangesParams = z.infer<typeof listExchangesSchema>;
export type GetExchangeParams = z.infer<typeof getExchangeSchema>;
export type CreateExchangeParams = z.infer<typeof createExchangeSchema>;
export type UpdateExchangeParams = z.infer<typeof updateExchangeSchema>;
export type RefreshExchangeParams = z.infer<typeof refreshExchangeSchema>;

const riskModeLabels: Record<string, string> = {
  '1': 'Conservative',
  '2': 'Moderate',
  '3': 'Kamikaze',
};

function formatExchange(exchange: ExchangeDetailed): string {
  return `- ID: ${exchange.id}
  Name: ${exchange.name}
  Exchange: ${exchange.exchange}
  Risk Mode: ${riskModeLabels[exchange.risk_mode] || exchange.risk_mode}
  Testnet: ${exchange.is_testnet ? 'Yes' : 'No'}
  API Error: ${exchange.api_error ? 'Yes (credentials may be invalid)' : 'No'}
  USDT Balance: ${exchange.usdt_balance || 'N/A'}
  Created: ${exchange.created_at}`;
}

export async function getExchangeParameters(): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getExchangeParameters();
    const params = response.data;

    const exchanges = Object.entries(params.exchanges)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const riskModes = Object.entries(params.risk_modes)
      .map(([key, label]) => `  - ${key}: ${label}`)
      .join('\n');

    const requiredFields = params.fields.required.join(', ');
    const optionalFields = params.fields.optional.join(', ');
    const notes = Object.entries(params.fields.notes)
      .map(([field, note]) => `  - ${field}: ${note}`)
      .join('\n');

    return `Exchange Parameters:

Supported Exchanges:
${exchanges}

Risk Modes:
${riskModes}

Required Fields: ${requiredFields}
Optional Fields: ${optionalFields}

Notes:
${notes}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching exchange parameters: ${error.message}`;
    }
    throw error;
  }
}

export async function listExchanges(params: ListExchangesParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.listExchanges(params.user_id);

    if (response.data.length === 0) {
      return `No exchanges found for user ${params.user_id}.`;
    }

    const exchangesSummary = response.data.map(formatExchange).join('\n\n');

    return `Exchanges for User ${params.user_id} (Total: ${response.data.length}):\n\n${exchangesSummary}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching exchanges: ${error.message}`;
    }
    throw error;
  }
}

export async function getExchange(params: GetExchangeParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getExchange(params.id);
    const exchange = response.data;

    return `Exchange Details:
- ID: ${exchange.id}
- User ID: ${exchange.user_id}
- Name: ${exchange.name}
- Slug: ${exchange.slug}
- Exchange Type: ${exchange.exchange}
- Risk Mode: ${riskModeLabels[exchange.risk_mode] || exchange.risk_mode}
- Testnet: ${exchange.is_testnet ? 'Yes' : 'No'}
- API Error: ${exchange.api_error ? 'Yes (credentials may be invalid)' : 'No'}
- Balances:
  - USDT: ${exchange.usdt_balance || 'N/A'}
  - USD: ${exchange.usd_balance || 'N/A'}
  - BTC: ${exchange.btc_balance || 'N/A'}
  - ETH: ${exchange.eth_balance || 'N/A'}
- Initial USDT Balance: ${exchange.initial_usdt_balance || 'Not recorded'}
- Initial Balance Date: ${exchange.initial_balance_recorded_at || 'N/A'}
- Created: ${exchange.created_at}
- Updated: ${exchange.updated_at}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Exchange with ID ${params.id} not found.`;
      }
      return `Error fetching exchange: ${error.message}`;
    }
    throw error;
  }
}

export async function createExchange(params: CreateExchangeParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.createExchange({
      user_id: params.user_id,
      name: params.name,
      exchange: params.exchange,
      risk_mode: params.risk_mode,
      api_key: params.api_key,
      api_secret: params.api_secret,
      api_frase: params.api_frase,
      is_testnet: params.is_testnet,
    });
    const exchange = response.data;

    return `Exchange created successfully:
- ID: ${exchange.id}
- Name: ${exchange.name}
- Exchange: ${exchange.exchange}
- API Error: ${exchange.api_error ? 'Yes (check credentials)' : 'No (connectivity OK)'}
- USDT Balance: ${exchange.usdt_balance || 'N/A'}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error creating exchange: ${error.message}`;
    }
    throw error;
  }
}

export async function updateExchange(params: UpdateExchangeParams): Promise<string> {
  try {
    const client = getApiClient();

    const updateData: Record<string, unknown> = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.exchange !== undefined) updateData.exchange = params.exchange;
    if (params.risk_mode !== undefined) updateData.risk_mode = params.risk_mode;
    if (params.api_key !== undefined) updateData.api_key = params.api_key;
    if (params.api_secret !== undefined) updateData.api_secret = params.api_secret;
    if (params.api_frase !== undefined) updateData.api_frase = params.api_frase;
    if (params.is_testnet !== undefined) updateData.is_testnet = params.is_testnet;

    const response = await client.updateExchange(params.id, updateData);
    const exchange = response.data;

    return `Exchange updated successfully:
- ID: ${exchange.id}
- Name: ${exchange.name}
- Exchange: ${exchange.exchange}
- API Error: ${exchange.api_error ? 'Yes (check credentials)' : 'No (connectivity OK)'}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Exchange with ID ${params.id} not found.`;
      }
      return `Error updating exchange: ${error.message}`;
    }
    throw error;
  }
}

export async function refreshExchange(params: RefreshExchangeParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.refreshExchange(params.id);
    const exchange = response.data;

    return `${response.message}
- ID: ${exchange.id}
- Name: ${exchange.name}
- API Error: ${exchange.api_error ? 'Yes (credentials invalid or connection failed)' : 'No'}
- USDT Balance: ${exchange.usdt_balance || 'N/A'}`;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Exchange with ID ${params.id} not found.`;
      }
      return `Error refreshing exchange: ${error.message}`;
    }
    throw error;
  }
}
