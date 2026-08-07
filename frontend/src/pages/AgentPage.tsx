import { useAppState } from '../hooks/useAppState';
import { PageHeader, SectionCard, Badge, ActivityTimeline, LoadingState, EmptyState } from '../components/ui';

const STEP_ACTIONS = [
  { key: 'aggregate', label: '1. Aggregate demand', mutation: 'aggregate' as const },
  { key: 'compare', label: '2. Compare suppliers', mutation: 'compare' as const },
  { key: 'negotiate', label: '3. Negotiate MOQ', mutation: 'negotiate' as const },
  { key: 'accept', label: '4. Accept offer', mutation: 'accept' as const },
  { key: 'policyCheck', label: '5. Policy check', mutation: 'policyCheck' as const },
  { key: 'settle', label: '6. Execute settlement', mutation: 'settle' as const },
  { key: 'verify', label: '7. Verify shipment', mutation: 'verify' as const },
  { key: 'mint', label: '8. Mint receipts', mutation: 'mint' as const },
];

export default function AgentPage() {
  const { state, isLoading, stepMutations } = useAppState();

  if (isLoading || !state) return <LoadingState label="Loading agent activity…" />;

  return (
    <div>
      <PageHeader
        title="Procurement agent"
        subtitle="Research, negotiate, and execute within policy limits. Deterministic checks enforce budgets and mandates."
        badge={<Badge variant="demo">Agentic workflow</Badge>}
      />

      <div className="grid-2">
        <SectionCard title="Controls" subtitle="Run each step, or use Run full demo on Orders">
          <div className="agent-steps">
            {STEP_ACTIONS.map((step) => {
              const mutation = stepMutations[step.mutation];
              return (
                <button
                  key={step.key}
                  className="agent-step-btn"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Running…' : step.label}
                </button>
              );
            })}
          </div>

          {state.currentOffer && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active offer
              </div>
              <pre className="offer-json">{JSON.stringify(state.currentOffer, null, 2)}</pre>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Supplier comparison" subtitle="Sandbox quotes ranked by the research agent">
          <div className="supplier-grid">
            {state.suppliers.map((s) => (
              <div
                key={s.supplierId}
                className={`supplier-card${s.supplierId === 'oliva-sur' ? ' supplier-card--selected' : ''}`}
              >
                <div className="supplier-card__head">
                  <div>
                    <div className="supplier-card__name">{s.supplierName}</div>
                    {s.supplierId === 'oliva-sur' && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <Badge variant="live">Selected</Badge>
                      </div>
                    )}
                  </div>
                  {s.verified && <Badge variant="demo">Verified</Badge>}
                </div>
                <div className="supplier-card__stats">
                  <div className="supplier-card__stat"><label>Price</label><span>€{s.unitPriceEUR}</span></div>
                  <div className="supplier-card__stat"><label>MOQ</label><span>{s.moq}</span></div>
                  <div className="supplier-card__stat"><label>Delivery</label><span>{s.deliveryDays}d</span></div>
                  <div className="supplier-card__stat"><label>EURC</label><span>{s.acceptsEURC ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity timeline" subtitle={`${state.activities.length} events`} style={{ marginTop: '1.25rem' }}>
        {state.activities.length === 0 ? (
          <EmptyState
            title="No activity yet"
            detail="Run the demo to see demand aggregation through receipt redemption."
          />
        ) : (
          <ActivityTimeline events={[...state.activities].reverse()} />
        )}
      </SectionCard>
    </div>
  );
}
