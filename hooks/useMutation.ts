import { useCallback, useTransition } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useMutation<State, Payload extends any[]>(
  func: (...payload: Payload) => Promise<State>,
  onFinish?: (state: Awaited<State>) => void
): [action: (...payload: Payload) => void, isPending: boolean] {
  const [isLoading, startTransition] = useTransition();

  const action = useCallback((...payload: Payload) => {
    startTransition(async () => {
      const t = await func(...payload);
      onFinish?.(t);
    });
  }, []);

  return [action, isLoading];
}
