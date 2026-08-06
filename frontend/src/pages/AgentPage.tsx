import { useAppState } from '../hooks/useAppState';
import { PageHeader, SectionCard, Badge, ActivityTimeline, LoadingState, EmptyState } from '../components/ui';

const STEP_ACTIONS = [
  { key: 'aggregate', label: 'Aggregate Demand', icon: '📊', mutation: 'aggregate' as const },
  { key: 'compare', label: 'Compare Suppliers', icon: '🔍', mutation: 'compare' as const },
  { key: 'negotiate', label: 'Negotiate MOQ', icon: '🤝', mutation: 'negotiate' as const },
  { key: 'accept', label: 'Accept Offer', icon: '✅', mutation: 'accept' as const },
  { key: 'policyCheck', label: 'Policy Check', icon: '🛡️', mutation: 'policyCheck' as const },
  { key: 'settle', label: 'Execute Settlement', icon: '⚡', mutation: 'settle' as const },
  { key: 'verify', label: 'Verify Shipment', icon: '📦', mutation: 'verify' as const },
  { key: 'mint', label: 'Mint Receipts', icon: '🪙', mutation: 'mint' as const },
];

export default function AgentPage() {
  const { state, isLoading, stepMutations } = useAppState();

  if (isLoading || !state) return <LoadingState label="Loading agent activity…" />;

  return (
    <div>
      <PageHeader
        title="AI Agent Activity"
        subtitle="Structured procurement agent: research → negotiate → policy check → execute. LLM reasons; deterministic code enforces limits."
        badge={<Badge variant="demo">Agentic Economy</Badge>}
      />

      <div className="grid-2">
        <SectionCard title="Agent Controls" subtitle='Run steps individually or use "Run Full Demo" on Orders'>
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
                  <span>{step.icon}</span>
                  {mutation.isPending ? 'Running…' : step.label}
                </button>
              );
            })}
          </div>

          {state.currentOffer && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Offer</div>
              <pre className="offer-json">{JSON.stringify(state.currentOffer, null, 2)}</pre>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Supplier Comparison" subtitle="Sandbox suppliers evaluated by the research agent">
          <div className="supplier-grid">
            {state.suppliers.map((s) => (
              <div
                key={s.supplierId}
                className={`supplier-card${s.supplierId === 'oliva-sur' ? ' supplier-card--selected' : ''}`}
              >
                <div className="supplier-card__head">
                  <div>
                    <div className="supplier-card__name">{s.supplierName}</div>
                    {s.supplierId === 'oliva-sur' && <Badge variant="live" >Selected</Badge>}
                  </div>
                  {s.verified && <Badge variant="demo">Verified</Badge>}
                </div>
                <div className="supplier-card__stats">
                  <div className="supplier-card__stat"><label>Price</label><span>€{s.unitPriceEUR}</span></div>
                  <div className="supplier-card__stat"><label>MOQ</label><span>{s.moq}</span></div>
                  <div className="supplier-card__stat"><label>Delivery</label><span>{s.deliveryDays}d</span></div>
                  <div className="supplier-card__stat"><label>EURC</label><span>{s.acceptsEURC ? '✓' : '—'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity Timeline" subtitle={`${state.activities.length} events recorded`} style={{ marginTop: '1.25rem' }}>
        {state.activities.length === 0 ? (
          <EmptyState
            icon="🤖"
            title="No agent activity yet"
            detail="Run the demo to see the full procurement flow from demand aggregation to receipt redemption."
          />
        ) : (
          <ActivityTimeline events={[...state.activities].reverse()} />
        )}
      </SectionCard>
    </div>
  );
}
