/**
 * useRealtimeTable — Reusable Supabase Realtime subscription hook.
 *
 * Usage:
 *   const { data, isLoading, connectionStatus, refetch } = useRealtimeTable<Order>({
 *     table: 'online_orders',
 *     initialData: [],
 *     fetcher: () => getOrdersByUser(userId),
 *     filter: { column: 'e_customer_id', value: userId },
 *   });
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRealtimeTableOptions<T extends { id: string }> {
  /** Supabase table name */
  table: string;
  /** Initial data or empty array — used as fallback while fetching  */
  initialData: T[];
  /** Async function to fetch the full dataset for this table */
  fetcher: () => Promise<T[]>;
  /** Optional column filter, e.g. { column: 'e_customer_id', value: userId } */
  filter?: { column: string; value: string };
  /** Schema name (defaults to 'public') */
  schema?: string;
  /** Disable the realtime subscription but still run the initial fetch */
  disabled?: boolean;
  /**
   * When true, any realtime event triggers a full refetch() instead of
   * optimistic state patching. Use this for tables that need joins or
   * go through a row mapper (e.g. toOrder(), toSale()).
   */
  refetchOnChange?: boolean;
}

interface UseRealtimeTableResult<T extends { id: string }> {
  data: T[];
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  refetch: () => Promise<void>;
}

export function useRealtimeTable<T extends { id: string }>({
  table,
  initialData,
  fetcher,
  filter,
  schema = 'public',
  disabled = false,
  refetchOnChange = false,
}: UseRealtimeTableOptions<T>): UseRealtimeTableResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [retrySession, setRetrySession] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Stable ref so fetcher identity changes don't retrigger the subscription
  const fetcherRef = useRef(fetcher);
  const instanceIdRef = useRef(Math.random().toString(36).slice(2, 9));
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    try {
      const rows = await fetcherRef.current();
      setData(rows);
    } catch (err) {
      console.error(`[useRealtimeTable] refetch error for "${table}":`, err);
    } finally {
      setIsLoading(false);
    }
  }, [table]);

  useEffect(() => {
    // Run initial data fetch every time table/filter/disabled changes
    setIsLoading(true);
    refetch();

    if (disabled) {
      setConnectionStatus('disconnected');
      return;
    }

    const filterCol = filter?.column;
    const filterVal = filter?.value;

    // Stable channel name suffix to prevent collisions on the same page
    const channelName = filterCol && filterVal
      ? `rt:${table}:${filterCol}:${filterVal}_${instanceIdRef.current}`
      : `rt:${table}_${instanceIdRef.current}`;

    const channel = supabase.channel(channelName);

    // Build optional Supabase row-level filter
    const realtimeFilter = filterCol && filterVal
      ? `${filterCol}=eq.${filterVal}`
      : undefined;

    channel
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema,
          table,
          ...(realtimeFilter ? { filter: realtimeFilter } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          // If caller needs joined/mapped data, skip optimistic patch and refetch
          if (refetchOnChange) {
            refetch();
            return;
          }

          const { eventType, new: newRow, old: oldRow } = payload as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new: Partial<T>;
            old: Partial<T>;
          };

          setData(prev => {
            if (eventType === 'INSERT') {
              const r = newRow as T;
              if (prev.some(x => x.id === r.id)) return prev;
              return [r, ...prev];
            }
            if (eventType === 'UPDATE') {
              const r = newRow as T;
              if (prev.some(x => x.id === r.id)) {
                return prev.map(x => (x.id === r.id ? r : x));
              }
              return [r, ...prev]; // upsert-style fallback
            }
            if (eventType === 'DELETE') {
              const deletedId = (oldRow as Partial<T>).id;
              if (!deletedId) return prev;
              return prev.filter(x => x.id !== deletedId);
            }
            return prev;
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          console.error(`[useRealtimeTable] Channel error on "${table}":`, err || 'Check if Realtime is enabled in Supabase Dashboard.');
          // Increment retrySession to trigger effect re-run and re-subscription
          setTimeout(() => setRetrySession(s => s + 1), 5000);
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
          console.warn(`[useRealtimeTable] Timed out on "${table}".`);
          setTimeout(() => setRetrySession(s => s + 1), 5000);
        } else {
          setConnectionStatus('connecting');
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or deps change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [table, schema, filter?.column, filter?.value, disabled, refetchOnChange, refetch, retrySession]);

  return { data, isLoading, connectionStatus, refetch };
}
