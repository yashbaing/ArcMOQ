import { useAppState } from '../hooks/useAppState';

const STEP_ACTIONS = [
  { key: 'aggregate', label: '1. Aggregate Demand', mutation: 'aggregate' as const },
  { key: 'compare', label: '2. Compare Suppliers', mutation: 'compare' as const },
  { key: 'negotiate', label: '3. Negotiate MOQ', mutation: 'negotiate' as const },
  { key: 'accept', label: '4. Accept Offer', mutation: 'accept' as const },
  { key: 'policyCheck', label: '5. Policy Check', mutation: 'policyCheck' as const },
  { key: 'settle', label: '6. Execute Settlement', mutation: 'settle' as const },
  { key: 'verify', label: '7. Verify Shipment', mutation: 'verify' as const },
  { key: 'mint', label: '8. Mint Receipts', mutation: 'mint' as const },
];

export default function AgentPage() {
  const { state, isLoading, stepMutations } = useAppState();

  if (isLoading || !state) return <div className="empty-state">Loading agent activity…</div>;

  const dotClass = (type: string) => {
    if (['supplier_accepted', 'settlement_executed', 'receipt_minted', 'redemption'].includes(type)) return 'success';
    if (type === 'policy_check') return 'warning';
    return '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Agent Activity</h1>
          <p>Structured procurement agent: research → negotiate → policy check → execute. LLM reasons; deterministic code enforces limits.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Agent Controls</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Run each step individually or use "Run Full Demo" on the Orders page.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {STEP_ACTIONS.map((step) => {
              const mutation = stepMutations[step.mutation];
              return (
                <button
                  key={step.key}
                  className="btn-secondary"
                  style={{ textAlign: 'left' }}
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? '…' : step.label}
                </button>
              );
            })}
          </div>

          {state.currentOffer && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <strong>Active Offer</strong>
              <pre className="mono" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {JSON.stringify(state.currentOffer, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Supplier Comparison</h3>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Price</th>
                <th>MOQ</th>
                <th>Delivery</th>
                <th>EURC</th>
              </tr>
            </thead>
            <tbody>
              {state.suppliers.map((s) => (
                <tr key={s.supplierId} style={s.supplierId === 'oliva-sur' ? { background: 'rgba(61,139,253,0.08)' } : {}}>
                  <td>{s.supplierName}</td>
                  <td>€{s.unitPriceEUR}</td>
                  <td>{s.moq}</td>
                  <td>{s.deliveryDays}d</td>
                  <td>{s.acceptsEURC ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Activity Timeline</h3>
        {state.activities.length === 0 ? (
          <div className="empty-state">No agent activity yet. Run the demo to see the full procurement flow.</div>
        ) : (
          <div className="timeline">
            {[...state.activities].reverse().map((event) => (
              <div key={event.id} className="timeline-item">
                <div className={`timeline-dot ${dotClass(event.type)}`} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <strong>{event.title}</strong>
                    <span className="mono" style={{ color: 'var(--muted)' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
