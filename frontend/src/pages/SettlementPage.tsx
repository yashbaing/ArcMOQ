import { useAppState } from '../hooks/useAppState';
import { ARC_TESTNET, SupplierOffer } from '@arcmoq/shared';

export default function SettlementPage() {
  const { state, isLoading, stepMutations } = useAppState();

  if (isLoading || !state) return <div className="empty-state">Loading settlement…</div>;

  const settlement = state.settlement;
  const offer = state.currentOffer as SupplierOffer | null;
  const policy = state.policyResult;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settlement</h1>
          <p>USDC pooled on Arc Testnet → EURC supplier payment via StableFX Test Adapter.</p>
        </div>
        <span className="badge badge-live">Arc Settlement: Live Testnet</span>
      </div>

      {!settlement ? (
        <div className="card">
          <div className="empty-state">
            <p>Settlement not yet executed.</p>
            <div className="action-bar" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => stepMutations.policyCheck.mutate()}>Run Policy Check</button>
              <button className="btn-primary" onClick={() => stepMutations.settle.mutate()}>Execute Settlement</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Payment Flow</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="check-row">
                <span>1.</span>
                <div>
                  <strong>AED Collection</strong> <span className="badge badge-sim">Simulated PSP</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>UAE buyers authorize AED budgets</div>
                </div>
              </div>
              <div className="check-row">
                <span>2.</span>
                <div>
                  <strong>USDC Pool on Arc</strong> <span className="badge badge-live">Testnet</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{settlement.totalUSDC} USDC pooled in GroupOrder contract</div>
                </div>
              </div>
              <div className="check-row">
                <span>3.</span>
                <div>
                  <strong>StableFX Adapter</strong> <span className="badge badge-demo">Test Mode</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Rate {settlement.fxRate} · Fee {settlement.fxFeeBps} bps
                  </div>
                </div>
              </div>
              <div className="check-row">
                <span>4.</span>
                <div>
                  <strong>EURC to Supplier</strong> <span className="badge badge-live">Testnet</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{settlement.eurcPaid} EURC → Spanish supplier</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Settlement Details</h3>
            <table>
              <tbody>
                <tr><td>Total pooled USDC</td><td><strong>{settlement.totalUSDC}</strong></td></tr>
                <tr><td>EURC paid</td><td><strong>{settlement.eurcPaid}</strong></td></tr>
                <tr><td>FX rate</td><td>{settlement.fxRate}</td></tr>
                <tr><td>FX fee</td><td>{settlement.fxFeeBps} bps</td></tr>
                <tr><td>Supplier wallet</td><td className="mono">{settlement.supplierWallet.slice(0, 16)}…</td></tr>
                <tr><td>Status</td><td><span className="badge badge-live">{settlement.status}</span></td></tr>
                {offer && (
                  <>
                    <tr><td>Quantity</td><td>{offer.quantity} tins</td></tr>
                    <tr><td>Unit price</td><td>€{offer.unitPriceEUR}/tin</td></tr>
                  </>
                )}
              </tbody>
            </table>
            {settlement.explorerUrl && (
              <a href={settlement.explorerUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '1rem' }}>
                View on ArcScan →
              </a>
            )}
            {!settlement.explorerUrl && settlement.txHash && (
              <a href={`${ARC_TESTNET.explorerUrl}/tx/${settlement.txHash}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '1rem' }}>
                View transaction →
              </a>
            )}
          </div>
        </div>
      )}

      {policy && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            Policy Validation {policy.passed ? <span className="badge badge-live">PASSED</span> : <span className="badge badge-sim">FAILED</span>}
          </h3>
          {policy.checks.map((c) => (
            <div key={c.name} className="check-row">
              <span className={`check-icon ${c.passed ? 'check-pass' : 'check-fail'}`}>{c.passed ? '✓' : '✗'}</span>
              <div>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Deployed Contracts</h3>
        <table>
          <tbody>
            {Object.entries(state.deployments.contracts).map(([name, addr]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className="mono">
                  {addr === '0x0000000000000000000000000000000000000000' ? (
                    <span style={{ color: 'var(--warning)' }}>Not deployed — run npm run deploy</span>
                  ) : (
                    <a href={`${ARC_TESTNET.explorerUrl}/address/${addr}`} target="_blank" rel="noreferrer">{addr}</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
