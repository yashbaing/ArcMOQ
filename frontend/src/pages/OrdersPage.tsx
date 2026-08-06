import { useAppState } from '../hooks/useAppState';
import { PageHeader, StatCard, Badge, ProgressRail, MoqBar, LoadingState, SectionCard } from '../components/ui';

const STEPS = ['Demand', 'Research', 'Negotiate', 'Policy', 'Settle', 'Verify', 'Mint', 'Redeem'];

export default function OrdersPage() {
  const { state, isLoading, runDemo, stepMutations } = useAppState();

  if (isLoading || !state) return <LoadingState label="Loading group orders…" />;

  const order = state.groupOrder;
  const gap = order.supplierMoq - order.currentDemand;
  const moqMet = order.currentDemand >= order.supplierMoq || order.status === 'accepted' || order.status === 'settled';
  const negotiated = order.status === 'accepted' || order.status === 'settled' || order.status === 'verified';

  return (
    <div>
      <PageHeader
        title="Active Group Orders"
        subtitle="UAE SMEs combine demand to reach supplier MOQs and unlock wholesale pricing on Arc."
        actions={
          <div className="action-bar">
            <button className="btn-demo" onClick={() => runDemo.mutate()} disabled={runDemo.isPending}>
              {runDemo.isPending ? 'Running demo…' : '▶ Run Full Demo'}
            </button>
            <button className="btn-ghost" onClick={() => stepMutations.reset.mutate()}>Reset</button>
          </div>
        }
      />

      <div className="hero-card">
        <div className="hero-card__top">
          <div className="hero-card__product">
            <Badge variant="live">Live Group Order</Badge>
            <h2>{order.productName}</h2>
            <div className="hero-card__meta">
              <span>{order.origin}</span>
              <span>{order.packaging}</span>
            </div>
          </div>
          <div className="savings-ring">
            <div className="stat-value">{order.estimatedSavingsPercent}%</div>
            <div className="stat-label">Wholesale savings</div>
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: '1.35rem' }}>
          <StatCard label="Current demand" value={order.currentDemand} unit="tins" accent="green" icon="📦" />
          <StatCard label="Supplier MOQ" value={order.supplierMoq} unit="tins" accent="blue" icon="🏭" />
          <StatCard label="UAE businesses" value={order.buyerCount} accent="gold" icon="🏢" />
        </div>

        <MoqBar
          demand={order.currentDemand}
          originalMoq={1000}
          negotiatedMoq={negotiated ? order.supplierMoq : undefined}
        />

        {!moqMet && gap > 0 && (
          <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
            <span>⚠️</span>
            <span>{gap} more tins needed for original MOQ of 1,000. The AI agent can negotiate this down.</span>
          </div>
        )}

        {negotiated && (
          <div className="moq-banner">
            <div className="moq-banner__icon">✓</div>
            <div>
              <strong>MOQ Renegotiated</strong>
              <p>Agent secured 860 tins @ €38.10 with immediate EURC settlement and monthly recurring intent.</p>
            </div>
          </div>
        )}

        <ProgressRail steps={STEPS} current={state.demoStep} />
      </div>

      <SectionCard title="Buyer Mandates" subtitle={`${state.mandates.length} UAE businesses in this group order`}>
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Quantity</th>
              <th>Max Budget</th>
              <th>Deadline</th>
              <th>Auto-exec</th>
            </tr>
          </thead>
          <tbody>
            {state.mandates.map((m) => (
              <tr key={m.buyerAddress}>
                <td>
                  <div className="buyer-cell">
                    <span className="buyer-avatar">{m.buyerName.charAt(0)}</span>
                    {m.buyerName}
                  </div>
                </td>
                <td><strong>{m.quantity}</strong> tins</td>
                <td>AED {m.maxBudgetAED.toLocaleString()}</td>
                <td>{m.deliveryDeadline}</td>
                <td>
                  {m.allowAutonomousExecution ? (
                    <Badge variant="live">Enabled</Badge>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
