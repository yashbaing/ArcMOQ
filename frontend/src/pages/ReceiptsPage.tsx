import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { buildReceipts } from '../api';
import { ARC_TESTNET } from '@arcmoq/shared';

export default function ReceiptsPage() {
  const { state, isLoading, stepMutations } = useAppState();
  const [redeemQty, setRedeemQty] = useState(100);

  if (isLoading || !state) return <div className="empty-state">Loading receipts…</div>;

  const receipts = buildReceipts(state);
  const primary = receipts[0];

  const handleRedeem = () => {
    stepMutations.redeem.mutate({ buyerName: 'Restaurant A — Al Barsha', quantity: redeemQty });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory Receipts</h1>
          <p>ERC-1155 digital warehouse receipts representing verified physical inventory claims.</p>
        </div>
        <span className="badge badge-demo">Warehouse Attestation: Demo Verifier</span>
      </div>

      {!state.settlement && (
        <div className="alert alert-warning">Complete settlement before shipment verification and receipt minting.</div>
      )}

      <div className="action-bar" style={{ marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={() => stepMutations.verify.mutate()} disabled={!state.settlement}>
          Verify Shipment
        </button>
        <button className="btn-primary" onClick={() => stepMutations.mint.mutate()} disabled={!state.batchVerified}>
          Mint Receipts
        </button>
      </div>

      {primary && (
        <div className="hero-card" style={{ marginBottom: '1rem' }}>
          <div className="grid-3">
            <div>
              <div className="stat-label">Batch ID</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{primary.batchId}</div>
            </div>
            <div>
              <div className="stat-label">Verification</div>
              <div className="stat-value" style={{ fontSize: '1.2rem', color: primary.verificationStatus === 'verified' ? 'var(--success)' : 'var(--warning)' }}>
                {primary.verificationStatus}
              </div>
            </div>
            <div>
              <div className="stat-label">Total units</div>
              <div className="stat-value">{state.groupOrder.currentDemand}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {receipts.map((r) => (
          <div key={r.buyerAddress} className="card receipt-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <strong>{r.buyerName}</strong>
              <span className={`badge ${r.shipmentStatus === 'redeemed' ? 'badge-live' : 'badge-demo'}`}>
                {r.shipmentStatus}
              </span>
            </div>
            <table>
              <tbody>
                <tr><td>Allocation</td><td>{r.allocation} tins</td></tr>
                <tr><td>Product</td><td>{r.productName}</td></tr>
                <tr><td>Origin</td><td>{r.origin}</td></tr>
                <tr><td>Packaging</td><td>{r.packaging}</td></tr>
                <tr><td>RWA status</td><td>{state.receiptsMinted ? 'Minted' : 'Pending'}</td></tr>
                {r.tokenId && <tr><td>Token ID</td><td className="mono">{r.tokenId}</td></tr>}
              </tbody>
            </table>
            {r.redemptionHistory.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>Redemption history</strong>
                {r.redemptionHistory.map((h, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {h.quantity} units — {new Date(h.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {state.receiptsMinted && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Redeem Goods — Restaurant A</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Demo: burn 100 receipt units → release 100 physical tins. Warehouse confirms delivery onchain.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, maxWidth: 200 }}>
              <label>Quantity to redeem</label>
              <input type="number" min={1} max={100} value={redeemQty} onChange={(e) => setRedeemQty(Number(e.target.value))} />
            </div>
            <button className="btn-success" onClick={handleRedeem} disabled={stepMutations.redeem.isPending}>
              {stepMutations.redeem.isPending ? 'Redeeming…' : 'Redeem & Burn Receipt'}
            </button>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        Receipts are restricted to KYB-approved businesses. No speculative market. Units are burned on physical collection.
        {state.deployments.contracts.WarehouseReceipt !== '0x0000000000000000000000000000000000000000' && (
          <> Contract: <a href={`${ARC_TESTNET.explorerUrl}/address/${state.deployments.contracts.WarehouseReceipt}`} target="_blank" rel="noreferrer">ArcScan</a></>
        )}
      </div>
    </div>
  );
}
