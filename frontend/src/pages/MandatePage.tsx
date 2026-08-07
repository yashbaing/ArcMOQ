import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { api } from '../api';
import { PageHeader, Badge, SectionCard, Toggle, StatCard } from '../components/ui';

export default function MandatePage() {
  const { state } = useAppState();
  const [quantity, setQuantity] = useState(100);
  const [budget, setBudget] = useState(15000);
  const [deadline, setDeadline] = useState('2026-09-30');
  const [autoExec, setAutoExec] = useState(true);
  const [estimate, setEstimate] = useState<{ estimatedCostAED: number; unitPriceAED: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleEstimate = async () => {
    setEstimate(await api.estimate(quantity));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addMandate({
      buyerName: 'New UAE Business',
      buyerAddress: '0x' + 'ab'.repeat(20),
      quantity,
      maxBudgetAED: budget,
      deliveryDeadline: deadline,
      qualityStandard: 'Extra Virgin',
      maxPriceVarianceBps: 200,
      allowAutonomousExecution: autoExec,
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const released = estimate ? Math.max(0, budget - estimate.estimatedCostAED) : null;

  return (
    <div>
      <PageHeader
        title="Create buying mandate"
        subtitle="Authorize the procurement agent to execute within your AED budget and policy limits."
        badge={<Badge variant="sim">AED collection: simulated PSP</Badge>}
      />

      <div className="grid-2">
        <SectionCard title="Mandate details" subtitle="You authorize in AED — USDC pooling happens on Arc">
          <form className="mandate-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product</label>
              <input value="Extra Virgin Olive Oil — 5L tins" disabled />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity (tins)</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Maximum budget (AED)</label>
                <input type="number" min={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Delivery deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Quality standard</label>
                <select defaultValue="Extra Virgin">
                  <option>Extra Virgin</option>
                  <option>Virgin</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Maximum price variance</label>
              <select defaultValue="200">
                <option value="100">1%</option>
                <option value="200">2%</option>
                <option value="500">5%</option>
              </select>
            </div>
            <Toggle checked={autoExec} onChange={setAutoExec} label="Allow autonomous execution within limits" />
            <div className="action-bar" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={handleEstimate}>Estimate AED cost</button>
              <button type="submit" className="btn-primary">Submit mandate</button>
            </div>
            {submitted && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>Mandate submitted to the group order.</div>
            )}
          </form>
        </SectionCard>

        <div>
          <SectionCard title="AED pricing preview" subtitle="What buyers see in the interface">
            {estimate ? (
              <div className="pricing-preview">
                <StatCard label="Estimated cost" value={`AED ${estimate.estimatedCostAED.toLocaleString()}`} />
                <StatCard label="Unit price" value={`AED ${estimate.unitPriceAED.toFixed(2)}`} />
                <StatCard label="Max authorized" value={`AED ${budget.toLocaleString()}`} />
                {released !== null && (
                  <div className="pricing-preview__highlight">
                    <div className="stat-label">Released if unused</div>
                    <div className="stat-value">AED {released.toLocaleString()}</div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                Estimate cost to preview AED pricing. Stablecoin settlement runs behind the scenes on Arc Testnet.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Example: Restaurant A" subtitle="From the demo scenario" style={{ marginTop: '1.25rem' }}>
            <div className="kv-list">
              <div className="kv-list__row"><span>Quantity</span><span>100 tins</span></div>
              <div className="kv-list__row"><span>Estimated cost</span><span>AED 14,120</span></div>
              <div className="kv-list__row"><span>Maximum authorized</span><span>AED 16,000</span></div>
              <div className="kv-list__row"><span>Final cost</span><span><strong>AED 13,970</strong></span></div>
              <div className="kv-list__row"><span>Released</span><span style={{ color: 'var(--ok)' }}>AED 2,030</span></div>
            </div>
          </SectionCard>

          {state && (
            <div className="alert alert-info" style={{ marginTop: '1.25rem' }}>
              Current group demand: <strong>{state.groupOrder.currentDemand} tins</strong> from {state.groupOrder.buyerCount} businesses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
