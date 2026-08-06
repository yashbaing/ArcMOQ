import { useAppState } from '../hooks/useAppState';

export default function OrdersPage() {
  const { state, isLoading, runDemo, stepMutations } = useAppState();

  if (isLoading || !state) return <div className="empty-state">Loading group orders…</div>;

  const order = state.groupOrder;
  const gap = order.supplierMoq - order.currentDemand;
  const moqMet = order.currentDemand >= order.supplierMoq || order.status === 'accepted' || order.status === 'settled';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Active Group Orders</h1>
          <p>UAE SMEs combine demand to reach supplier MOQs and unlock wholesale pricing on Arc.</p>
        </div>
        <div className="action-bar">
          <button className="btn-warning" onClick={() => runDemo.mutate()} disabled={runDemo.isPending}>
            {runDemo.isPending ? 'Running…' : '▶ Run Full Demo'}
          </button>
          <button className="btn-secondary" onClick={() => stepMutations.reset.mutate()}>Reset</button>
        </div>
      </div>

      <div className="hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-live">Live Group Order</span>
            <h2 style={{ marginTop: '0.5rem', fontSize: '1.4rem' }}>{order.productName}</h2>
            <p style={{ color: 'var(--muted)' }}>{order.origin} · {order.packaging}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-value" style={{ color: 'var(--accent-2)' }}>{order.estimatedSavingsPercent}%</div>
            <div className="stat-label">Est. wholesale savings</div>
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: '1.25rem' }}>
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <div className="stat-label">Current demand</div>
            <div className="stat-value">{order.currentDemand} <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>tins</span></div>
          </div>
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <div className="stat-label">Supplier MOQ</div>
            <div className="stat-value">{order.supplierMoq} <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>tins</span></div>
          </div>
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <div className="stat-label">UAE businesses</div>
            <div className="stat-value">{order.buyerCount}</div>
          </div>
        </div>

        {!moqMet && gap > 0 && (
          <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
            {gap} more tins needed to meet original supplier MOQ of 1,000. AI agent can negotiate.
          </div>
        )}

        {(order.status === 'accepted' || order.status === 'settled') && (
          <div className="moq-banner">
            <span style={{ fontSize: '1.5rem' }}>✓</span>
            <div>
              <strong>MOQ Renegotiated</strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                Agent negotiated MOQ from 1,000 → 860 tins with immediate EURC settlement.
              </div>
            </div>
          </div>
        )}

        <div className="progress-steps">
          {['Demand', 'Research', 'Negotiate', 'Policy', 'Settle', 'Verify', 'Mint', 'Redeem'].map((step, i) => (
            <span key={step} className={`step-pill ${state.demoStep > i ? 'done' : state.demoStep === i ? 'active' : ''}`}>
              {step}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Buyer Mandates</h3>
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Quantity</th>
              <th>Max Budget (AED)</th>
              <th>Deadline</th>
              <th>Auto-exec</th>
            </tr>
          </thead>
          <tbody>
            {state.mandates.map((m) => (
              <tr key={m.buyerAddress}>
                <td>{m.buyerName}</td>
                <td>{m.quantity} tins</td>
                <td>AED {m.maxBudgetAED.toLocaleString()}</td>
                <td>{m.deliveryDeadline}</td>
                <td>{m.allowAutonomousExecution ? '✓ Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
