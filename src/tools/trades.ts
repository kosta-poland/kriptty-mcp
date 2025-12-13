import { z } from 'zod';
import { getApiClient, ApiError, Trade, PnlRecord } from '../api/client.js';

export const listTradesSchema = z.object({
  exchange_id: z.number().int().positive().describe('Exchange ID (required)'),
  symbol: z.string().optional().describe('Filter by trading symbol (e.g., BTCUSDT)'),
  from_date: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
  to_date: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
  per_page: z.number().int().min(1).max(100).optional().describe('Records per page (default: 25, max: 100)'),
  sort_by: z.enum(['id', 'symbol', 'side', 'qty', 'closed_pnl', 'order_price', 'leverage', 'created_at']).optional().describe('Column to sort by'),
  sort_order: z.enum(['asc', 'desc']).optional().describe('Sort direction (default: desc)'),
});

export const getTradeSchema = z.object({
  id: z.number().int().positive().describe('Trade ID'),
});

export const listTradeSymbolsSchema = z.object({
  exchange_id: z.number().int().positive().describe('Exchange ID'),
});

export const getPnlStatsSchema = z.object({
  exchange_id: z.number().int().positive().describe('Exchange ID (required)'),
  period: z.enum(['daily', 'monthly', 'yearly']).optional().describe('Aggregation period (default: daily)'),
  month: z.number().int().min(1).max(12).optional().describe('Month filter for daily period (1-12)'),
  year: z.number().int().min(2020).max(2100).optional().describe('Year filter'),
});

export type ListTradesParams = z.infer<typeof listTradesSchema>;
export type GetTradeParams = z.infer<typeof getTradeSchema>;
export type ListTradeSymbolsParams = z.infer<typeof listTradeSymbolsSchema>;
export type GetPnlStatsParams = z.infer<typeof getPnlStatsSchema>;

function formatTrade(trade: Trade): string {
  const pnl = trade.closed_pnl ? parseFloat(trade.closed_pnl) : 0;
  const pnlStr = pnl >= 0 ? `+${pnl.toFixed(4)}` : pnl.toFixed(4);

  return `- ID: ${trade.id} | ${trade.nice_name} | ${trade.side} | Qty: ${trade.qty || 'N/A'} | PnL: ${pnlStr} | ${trade.created_at}`;
}

function formatTradeDetailed(trade: Trade): string {
  const pnl = trade.closed_pnl ? parseFloat(trade.closed_pnl) : 0;
  const pnlStr = pnl >= 0 ? `+${pnl.toFixed(4)}` : pnl.toFixed(4);

  return `Trade Details:
- ID: ${trade.id}
- Exchange ID: ${trade.exchange_id}
- Symbol: ${trade.symbol} (${trade.nice_name})
- Side: ${trade.side}
- Order Type: ${trade.order_type}
- Exec Type: ${trade.exec_type}
- Quantity: ${trade.qty || 'N/A'}
- Order Price: ${trade.order_price || 'N/A'}
- Avg Entry Price: ${trade.avg_entry_price || 'N/A'}
- Avg Exit Price: ${trade.avg_exit_price || 'N/A'}
- Closed Size: ${trade.closed_size || 'N/A'}
- Closed PnL: ${pnlStr}
- Leverage: ${trade.leverage || 'N/A'}x
- Fill Count: ${trade.fill_count || 'N/A'}
- Order ID: ${trade.order_id}
- Order OID: ${trade.order_oid || 'N/A'}
- Created: ${trade.created_at}
- Updated: ${trade.updated_at}`;
}

function formatPnlRecord(record: PnlRecord, period: string): string {
  const pnl = parseFloat(record.pnl);
  const pnlStr = pnl >= 0 ? `+${pnl.toFixed(4)}` : pnl.toFixed(4);

  let dateStr = '';
  if (period === 'daily' && record.date) {
    dateStr = record.date;
  } else if (period === 'monthly' && record.month_name) {
    dateStr = `${record.month_name} ${record.year}`;
  } else if (record.year) {
    dateStr = String(record.year);
  }

  return `  - ${record.symbol}: ${record.total_trades} trades, PnL: ${pnlStr} (${dateStr})`;
}

export async function listTrades(params: ListTradesParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.listTrades({
      exchange_id: params.exchange_id,
      symbol: params.symbol,
      from_date: params.from_date,
      to_date: params.to_date,
      per_page: params.per_page,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    });

    if (response.data.length === 0) {
      return `No trades found for exchange ${params.exchange_id}${params.symbol ? ` with symbol ${params.symbol}` : ''}.`;
    }

    const tradesList = response.data.map(formatTrade).join('\n');
    const meta = response.meta;

    return `Trades for Exchange ${params.exchange_id} (Page ${meta.current_page}/${meta.last_page}, Total: ${meta.total}):

${tradesList}

Pagination: Showing ${meta.from}-${meta.to} of ${meta.total} trades`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching trades: ${error.message}`;
    }
    throw error;
  }
}

export async function getTrade(params: GetTradeParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getTrade(params.id);
    return formatTradeDetailed(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return `Trade with ID ${params.id} not found.`;
      }
      return `Error fetching trade: ${error.message}`;
    }
    throw error;
  }
}

export async function listTradeSymbols(params: ListTradeSymbolsParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.listTradeSymbols(params.exchange_id);

    if (response.data.length === 0) {
      return `No traded symbols found for exchange ${params.exchange_id}.`;
    }

    const symbolsList = response.data.map((s) => `  - ${s}`).join('\n');

    return `Traded Symbols for Exchange ${params.exchange_id} (Total: ${response.data.length}):

${symbolsList}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching trade symbols: ${error.message}`;
    }
    throw error;
  }
}

export async function getPnlStats(params: GetPnlStatsParams): Promise<string> {
  try {
    const client = getApiClient();
    const response = await client.getPnlStats({
      exchange_id: params.exchange_id,
      period: params.period,
      month: params.month,
      year: params.year,
    });

    const stats = response.data;
    const globalPnl = parseFloat(stats.global_pnl);
    const globalPnlStr = globalPnl >= 0 ? `+${globalPnl.toFixed(4)}` : globalPnl.toFixed(4);

    if (stats.records.length === 0) {
      return `No P&L statistics found for exchange ${params.exchange_id} with period ${stats.period}.

Global PnL (All Time): ${globalPnlStr}`;
    }

    // Group records by date/period for better display
    const groupedRecords: Record<string, PnlRecord[]> = {};
    for (const record of stats.records) {
      let key = '';
      if (stats.period === 'daily' && record.date) {
        key = record.date;
      } else if (stats.period === 'monthly' && record.month_name) {
        key = `${record.month_name} ${record.year}`;
      } else if (record.year) {
        key = String(record.year);
      }
      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }
      groupedRecords[key].push(record);
    }

    const formattedGroups = Object.entries(groupedRecords)
      .map(([period, records]) => {
        const totalPnl = records.reduce((sum, r) => sum + parseFloat(r.pnl), 0);
        const totalTrades = records.reduce((sum, r) => sum + r.total_trades, 0);
        const totalPnlStr = totalPnl >= 0 ? `+${totalPnl.toFixed(4)}` : totalPnl.toFixed(4);
        const symbolsDetail = records.map((r) => {
          const pnl = parseFloat(r.pnl);
          const pnlStr = pnl >= 0 ? `+${pnl.toFixed(4)}` : pnl.toFixed(4);
          return `    ${r.symbol}: ${r.total_trades} trades, ${pnlStr}`;
        }).join('\n');
        return `${period}: ${totalTrades} trades, PnL: ${totalPnlStr}\n${symbolsDetail}`;
      })
      .join('\n\n');

    return `P&L Statistics for Exchange ${params.exchange_id} (${stats.period}):

${formattedGroups}

Global PnL (All Time): ${globalPnlStr}`;
  } catch (error) {
    if (error instanceof ApiError) {
      return `Error fetching P&L statistics: ${error.message}`;
    }
    throw error;
  }
}
