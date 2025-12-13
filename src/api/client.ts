import { getConfig } from '../config.js';

export interface Exchange {
  id: number;
  name: string;
  exchange: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
  role: number;
  timezone: string | null;
  last_seen: string | null;
  created_at: string;
  exchanges: Exchange[];
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

export interface ExchangeDetailed {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  exchange: string;
  risk_mode: string;
  is_testnet: boolean;
  api_error: boolean;
  usdt_balance: string | null;
  usd_balance: string | null;
  btc_balance: string | null;
  eth_balance: string | null;
  initial_usdt_balance: string | null;
  initial_balance_recorded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeParameters {
  exchanges: Record<string, string>;
  risk_modes: Record<string, string>;
  fields: {
    required: string[];
    optional: string[];
    notes: Record<string, string>;
  };
}

export interface RoutineParameters {
  grid_modes: Record<string, string>;
  bot_modes: Record<string, string>;
  grids: GridSummary[];
}

export interface SymbolSummary {
  id: number;
  name: string;
  nice_name: string;
  exchange: string;
}

export interface BotExchange {
  id: number;
  name: string;
  slug: string;
  exchange: string;
}

export interface BotSymbol {
  id: number;
  name: string;
  nice_name: string;
}

export interface BotGrid {
  id: number;
  name: string;
}

export interface Bot {
  id: number;
  name: string;
  market_type: string;
  grid_mode: string;
  lm: string;
  lwe: number;
  sm: string;
  swe: number;
  leverage: number;
  assigned_balance: number;
  oh_mode: boolean;
  show_logs: boolean;
  is_on_trend: boolean;
  is_on_routines: boolean;
  pid: number | null;
  started_at: string | null;
  stopped_at: string | null;
  is_running: boolean;
  user_id: number;
  exchange_id: number;
  grid_id: number | null;
  symbol_id: number;
  exchange?: BotExchange;
  symbol?: BotSymbol;
  grid?: BotGrid | null;
  created_at: string;
  updated_at: string;
}

export interface BotParameters {
  bot_modes: Record<string, string>;
  grid_modes: Record<string, string>;
  market_types: Record<string, string>;
  grids: GridSummary[];
  symbols: SymbolSummary[];
  fields: {
    required: string[];
    optional: string[];
    notes: Record<string, string>;
  };
}

export interface BotStatus {
  id: number;
  name: string;
  pid: number | null;
  is_running: boolean;
  started_at: string | null;
  stopped_at: string | null;
}

export interface Trade {
  id: number;
  exchange_id: number;
  position_id: number;
  symbol: string;
  nice_name: string;
  order_id: string;
  order_oid: string | null;
  side: string;
  qty: string | null;
  order_price: number | null;
  order_type: string;
  exec_type: string;
  closed_size: string | null;
  avg_entry_price: string | null;
  avg_exit_price: string | null;
  closed_pnl: string | null;
  fill_count: number | null;
  leverage: number | null;
  created_at: string;
  updated_at: string;
}

export interface TradeListParams {
  exchange_id: number;
  symbol?: string;
  from_date?: string;
  to_date?: string;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PnlStatsParams {
  exchange_id: number;
  period?: 'daily' | 'monthly' | 'yearly';
  month?: number;
  year?: number;
}

export interface PnlRecord {
  date?: string;
  year?: number;
  month?: number;
  month_name?: string;
  symbol: string;
  total_trades: number;
  pnl: string;
}

export interface PnlStatsResponse {
  period: string;
  records: PnlRecord[];
  global_pnl: string;
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

  async runRoutine(id: string, exchange_id: number): Promise<{ message: string; data: Routine }> {
    return this.request<{ message: string; data: Routine }>(`/routines/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ exchange_id }),
    });
  }

  // Exchange endpoints
  async getExchangeParameters(): Promise<SingleResponse<ExchangeParameters>> {
    return this.request<SingleResponse<ExchangeParameters>>('/exchange-parameters');
  }

  async listExchanges(userId: number): Promise<{ data: ExchangeDetailed[] }> {
    return this.request<{ data: ExchangeDetailed[] }>(`/exchanges?user_id=${userId}`);
  }

  async getExchange(id: number): Promise<SingleResponse<ExchangeDetailed>> {
    return this.request<SingleResponse<ExchangeDetailed>>(`/exchanges/${id}`);
  }

  async createExchange(data: {
    user_id: number;
    name: string;
    exchange: string;
    risk_mode: string;
    api_key: string;
    api_secret: string;
    api_frase?: string;
    is_testnet?: boolean;
  }): Promise<SingleResponse<ExchangeDetailed>> {
    return this.request<SingleResponse<ExchangeDetailed>>('/exchanges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExchange(id: number, data: {
    name?: string;
    exchange?: string;
    risk_mode?: string;
    api_key?: string;
    api_secret?: string;
    api_frase?: string;
    is_testnet?: boolean;
  }): Promise<SingleResponse<ExchangeDetailed>> {
    return this.request<SingleResponse<ExchangeDetailed>>(`/exchanges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async refreshExchange(id: number): Promise<{ message: string; data: ExchangeDetailed }> {
    return this.request<{ message: string; data: ExchangeDetailed }>(`/exchanges/${id}/refresh`, {
      method: 'POST',
    });
  }

  // Bot endpoints
  async getBotParameters(): Promise<SingleResponse<BotParameters>> {
    return this.request<SingleResponse<BotParameters>>('/bot-parameters');
  }

  async listBots(params: { user_id?: number; exchange_id?: number }): Promise<{ data: Bot[] }> {
    const queryParams = new URLSearchParams();
    if (params.user_id !== undefined) {
      queryParams.append('user_id', params.user_id.toString());
    }
    if (params.exchange_id !== undefined) {
      queryParams.append('exchange_id', params.exchange_id.toString());
    }
    return this.request<{ data: Bot[] }>(`/bots?${queryParams.toString()}`);
  }

  async getBot(id: number): Promise<SingleResponse<Bot>> {
    return this.request<SingleResponse<Bot>>(`/bots/${id}`);
  }

  async createBot(data: {
    name: string;
    exchange_id: number;
    symbol_id: number;
    market_type: string;
    grid_mode: string;
    grid_id?: number;
    lm: string;
    lwe: number;
    sm: string;
    swe: number;
    leverage?: number;
    assigned_balance?: number;
    oh_mode?: boolean;
    show_logs?: boolean;
    is_on_trend?: boolean;
    is_on_routines?: boolean;
  }): Promise<SingleResponse<Bot>> {
    return this.request<SingleResponse<Bot>>('/bots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBot(id: number, data: {
    name?: string;
    symbol_id?: number;
    market_type?: string;
    grid_mode?: string;
    grid_id?: number | null;
    lm?: string;
    lwe?: number;
    sm?: string;
    swe?: number;
    leverage?: number;
    assigned_balance?: number;
    oh_mode?: boolean;
    show_logs?: boolean;
    is_on_trend?: boolean;
    is_on_routines?: boolean;
  }): Promise<SingleResponse<Bot>> {
    return this.request<SingleResponse<Bot>>(`/bots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async startBot(id: number): Promise<{ message: string; data: Bot }> {
    return this.request<{ message: string; data: Bot }>(`/bots/${id}/start`, {
      method: 'POST',
    });
  }

  async stopBot(id: number): Promise<{ message: string; data: Bot }> {
    return this.request<{ message: string; data: Bot }>(`/bots/${id}/stop`, {
      method: 'POST',
    });
  }

  async restartBot(id: number): Promise<{ message: string; data: Bot }> {
    return this.request<{ message: string; data: Bot }>(`/bots/${id}/restart`, {
      method: 'POST',
    });
  }

  async swapBotWe(id: number, new_trend: 'LONG' | 'SHORT'): Promise<{ message: string; data: Bot }> {
    return this.request<{ message: string; data: Bot }>(`/bots/${id}/swap-we`, {
      method: 'POST',
      body: JSON.stringify({ new_trend }),
    });
  }

  async simpleSwapBotWe(id: number): Promise<{ message: string; data: Bot }> {
    return this.request<{ message: string; data: Bot }>(`/bots/${id}/simple-swap-we`, {
      method: 'POST',
    });
  }

  async getBotStatus(id: number): Promise<SingleResponse<BotStatus>> {
    return this.request<SingleResponse<BotStatus>>(`/bots/${id}/status`);
  }

  // Trade endpoints
  async listTrades(params: TradeListParams): Promise<PaginatedResponse<Trade>> {
    const queryParams = new URLSearchParams();
    queryParams.append('exchange_id', params.exchange_id.toString());
    if (params.symbol) {
      queryParams.append('symbol', params.symbol);
    }
    if (params.from_date) {
      queryParams.append('from_date', params.from_date);
    }
    if (params.to_date) {
      queryParams.append('to_date', params.to_date);
    }
    if (params.per_page !== undefined) {
      queryParams.append('per_page', params.per_page.toString());
    }
    if (params.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params.sort_order) {
      queryParams.append('sort_order', params.sort_order);
    }
    return this.request<PaginatedResponse<Trade>>(`/trades?${queryParams.toString()}`);
  }

  async getTrade(id: number): Promise<SingleResponse<Trade>> {
    return this.request<SingleResponse<Trade>>(`/trades/${id}`);
  }

  async listTradeSymbols(exchangeId: number): Promise<{ data: string[] }> {
    return this.request<{ data: string[] }>(`/trades/symbols?exchange_id=${exchangeId}`);
  }

  async getPnlStats(params: PnlStatsParams): Promise<{ data: PnlStatsResponse }> {
    const queryParams = new URLSearchParams();
    queryParams.append('exchange_id', params.exchange_id.toString());
    if (params.period) {
      queryParams.append('period', params.period);
    }
    if (params.month !== undefined) {
      queryParams.append('month', params.month.toString());
    }
    if (params.year !== undefined) {
      queryParams.append('year', params.year.toString());
    }
    return this.request<{ data: PnlStatsResponse }>(`/trades/stats/pnl?${queryParams.toString()}`);
  }
}

let client: KripttyApiClient | null = null;

export function getApiClient(): KripttyApiClient {
  if (!client) {
    client = new KripttyApiClient();
  }
  return client;
}
