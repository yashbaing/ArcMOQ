import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { api } from '../api';

export default function MandatePage() {
  const { state } = useAppState();
  const [quantity, setQuantity] = useState(100);
  const [budget, setBudget] = useState(15000);
  const [deadline, setDeadline] = useState('2026-09-30');
  const [autoExec, setAutoExec] = useState(true);
  const [estimate, setEstimate] = useState<{ estimatedCostAED: number; unitPriceAED: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleEstimate = async () => {
    const est = await api.estimate(quantity);
    setEstimate(est);
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create Buying Mandate</h1>
          <p>Authorize the AI procurement agent to execute within your AED budget and policy limits.</p>
        </div>
        <span className="badge badge-sim">AED Collection: Simulated PSP</span>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product</label>
            <input value="Extra Virgin Olive Oil — 5L tins" disabled />
          </div>
          <div className="form-group">
            <label>Quantity (tins)</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Maximum budget (AED)</label>
            <input type="number" min={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </div>
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
          <div className="form-group">
            <label>Maximum price variance</label>
            <select defaultValue="200">
              <option value="100">1%</option>
              <option value="200">2%</option>
              <option value="500">5%</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="auto" checked={autoExec} onChange={(e) => setAutoExec(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="auto" style={{ margin: 0 }}>Allow autonomous execution within limits</label>
          </div>
          <div className="action-bar">
            <button type="button" className="btn-secondary" onClick={handleEstimate}>Estimate AED cost</button>
            <button type="submit" className="btn-primary">Submit Mandate</button>
          </div>
          {submitted && <div className="alert alert-success" style={{ marginTop: '1rem' }}>Mandate submitted to group order.</div>}
        </form>

        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>AED Pricing Preview</h3>
            {estimate ? (
              <div className="grid-2">
                <div>
                  <div className="stat-label">Estimated cost</div>
                  <div className="stat-value">AED {estimate.estimatedCostAED.toLocaleString()}</div>
                </div>
                <div>
                  <div className="stat-label">Unit price</div>
                  <div className="stat-value">AED {estimate.unitPriceAED.toFixed(2)}</div>
                </div>
                <div>
                  <div className="stat-label">Maximum authorized</div>
                  <div className="stat-value">AED {budget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="stat-label">Released amount</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>
                    AED {Math.max(0, budget - estimate.estimatedCostAED).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Click "Estimate AED cost" to see pricing. Buyers see AED only — USDC pooling happens on Arc.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Example: Restaurant A</h3>
            <table>
              <tbody>
                <tr><td>Quantity</td><td>100 tins</td></tr>
                <tr><td>Estimated cost</td><td>AED 14,120</td></tr>
                <tr><td>Maximum authorized</td><td>AED 15,000</td></tr>
                <tr><td>Final cost</td><td>AED 13,970</td></tr>
                <tr><td>Released</td><td style={{ color: 'var(--success)' }}>AED 1,030</td></tr>
              </tbody>
            </table>
          </div>

          {state && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              Current group demand: <strong>{state.groupOrder.currentDemand} tins</strong> from {state.groupOrder.buyerCount} businesses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
