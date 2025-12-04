"use client";

import { useCallback, useEffect, useState } from "react";

export function useData<Args extends unknown[], Data>(
  func: (...args: Args) => Promise<Data>,
  onFinish: ((data: Data) => void) | null,
  ...args: Args
): [data: Data | undefined, isLoading: boolean, refresh: () => void] {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Data>();
  const [refresh, setRefresh] = useState("");
  const handle = useCallback(async () => {
    setIsLoading(true);
    const result = await func(...args);
    setData(result);
    onFinish?.(result);
    setIsLoading(false);
  }, [...args]);

  useEffect(() => {
    handle();
  }, [handle, refresh]);

  return [data, isLoading, () => setRefresh(new Date().toISOString())];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UseData<T extends (...args: any) => Promise<any>> = {
  data: Awaited<ReturnType<T>> | undefined;
  isLoading: boolean;
};
