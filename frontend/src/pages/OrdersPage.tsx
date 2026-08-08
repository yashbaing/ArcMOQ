import { useAppState } from '../hooks/useAppState';
import { AppStateGate } from '../components/AppStateGate';
import { PageHeader, StatCard, Badge, ProgressRail, MoqBar, SectionCard } from '../components/ui';

const STEPS = ['Demand', 'Research', 'Negotiate', 'Policy', 'Settle', 'Verify', 'Mint', 'Redeem'];

export default function OrdersPage() {
  const { runDemo, stepMutations } = useAppState();

  return (
    <AppStateGate label="Loading group orders…">
      {(state) => {
        const order = state.groupOrder;
        const gap = order.supplierMoq - order.currentDemand;
        const moqMet = order.currentDemand >= order.supplierMoq || order.status === 'accepted' || order.status === 'settled';
        const negotiated = order.status === 'accepted' || order.status === 'settled' || order.status === 'verified';

        return (
          <div>
            <PageHeader
              title="Active group orders"
              subtitle="UAE SMEs combine demand to reach supplier MOQs and unlock wholesale pricing on Arc."
              actions={
                <div className="action-bar">
                  <button className="btn-demo" onClick={() => runDemo.mutate()} disabled={runDemo.isPending}>
                    {runDemo.isPending ? 'Running…' : 'Run full demo'}
                  </button>
                  <button className="btn-ghost" onClick={() => stepMutations.reset.mutate()}>Reset</button>
                </div>
              }
            />
            <div className="hero-card">
              <div className="hero-card__top">
                <div className="hero-card__product">
                  <Badge variant="live">Live order</Badge>
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
              <div className="hero-metrics">
                <StatCard label="Current demand" value={order.currentDemand} unit="tins" />
                <StatCard label="Supplier MOQ" value={order.supplierMoq} unit="tins" />
                <StatCard label="UAE businesses" value={order.buyerCount} />
              </div>
              <MoqBar demand={order.currentDemand} originalMoq={1000} negotiatedMoq={negotiated ? order.supplierMoq : undefined} />
              {!moqMet && gap > 0 && (
                <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                  {gap} more tins needed for the original MOQ of 1,000. The procurement agent can negotiate this down.
                </div>
              )}
              {negotiated && (
                <div className="moq-banner">
                  <div className="moq-banner__icon">✓</div>
                  <div>
                    <strong>MOQ renegotiated</strong>
                    <p>Agent secured 860 tins at €38.10 with immediate EURC settlement and monthly recurring intent.</p>
                  </div>
                </div>
              )}
              <ProgressRail steps={STEPS} current={state.demoStep} />
            </div>
            <SectionCard title="Buyer mandates" subtitle={`${state.mandates.length} UAE businesses in this group order`}>
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Quantity</th>
                    <th>Max budget</th>
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
                      <td>{m.allowAutonomousExecution ? <Badge variant="live">Enabled</Badge> : <span style={{ color: 'var(--muted)' }}>Manual</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </div>
        );
      }}
    </AppStateGate>
  );
}
