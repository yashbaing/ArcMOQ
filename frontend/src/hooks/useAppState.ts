import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AppStateResponse } from '../api';

export function useAppState() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appState'],
    queryFn: api.getState,
    refetchInterval: 5000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appState'] });

  const runDemo = useMutation({
    mutationFn: api.runDemo,
    onSuccess: () => invalidate(),
  });

  const stepMutations = {
    aggregate: useMutation({ mutationFn: api.aggregate, onSuccess: invalidate }),
    compare: useMutation({ mutationFn: api.compare, onSuccess: invalidate }),
    negotiate: useMutation({ mutationFn: () => api.negotiate('oliva-sur'), onSuccess: invalidate }),
    accept: useMutation({ mutationFn: api.accept, onSuccess: invalidate }),
    policyCheck: useMutation({ mutationFn: api.policyCheck, onSuccess: invalidate }),
    settle: useMutation({ mutationFn: () => api.settle(), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: api.verifyShipment, onSuccess: invalidate }),
    mint: useMutation({ mutationFn: api.mintReceipts, onSuccess: invalidate }),
    redeem: useMutation({
      mutationFn: ({ buyerName, quantity }: { buyerName: string; quantity: number }) =>
        api.redeem(buyerName, quantity),
      onSuccess: invalidate,
    }),
    reset: useMutation({ mutationFn: api.reset, onSuccess: invalidate }),
  };

  return { ...query, runDemo, stepMutations, state: query.data as AppStateResponse | undefined };
}
