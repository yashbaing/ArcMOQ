import { ReactNode } from 'react';
import { useAppState } from '../hooks/useAppState';
import { AppStateResponse } from '../api';
import { ErrorState, LoadingState } from './ui';

export function AppStateGate({
  label,
  children,
}: {
  label: string;
  children: (state: AppStateResponse) => ReactNode;
}) {
  const { state, isLoading, isError, error, refetch } = useAppState();

  if (isLoading) return <LoadingState label={label} />;

  if (isError || !state) {
    const detail =
      error instanceof Error
        ? error.message
        : 'The API is unreachable. Deploy ArcMOQ from the repo root (not frontend-only) or set VITE_API_URL.';
    return (
      <ErrorState
        title="Could not load app data"
        detail={detail}
        action={
          <button className="btn-primary" onClick={() => refetch()}>
            Retry
          </button>
        }
      />
    );
  }

  return <>{children(state)}</>;
}
