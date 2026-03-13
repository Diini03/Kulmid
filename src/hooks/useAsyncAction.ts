import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseAsyncActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAsyncAction(options?: UseAsyncActionOptions) {
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setLoading(true);
    try {
      const result = await fn();
      if (options?.successMessage) {
        toast({ title: options.successMessage });
      }
      options?.onSuccess?.();
      return result;
    } catch (error: any) {
      const msg = error?.message || options?.errorMessage || 'Something went wrong';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      options?.onError?.(error);
      return undefined;
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  }, [options?.successMessage, options?.errorMessage, options?.onSuccess, options?.onError]);

  return { loading, execute };
}

/**
 * Track processing state per-item (by ID).
 */
export function useProcessingSet() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const startProcessing = useCallback((id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
  }, []);

  const stopProcessing = useCallback((id: string) => {
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isProcessing = useCallback((id: string) => {
    return processingIds.has(id);
  }, [processingIds]);

  return { processingIds, startProcessing, stopProcessing, isProcessing };
}
