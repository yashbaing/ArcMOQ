import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { buildReceipts } from '../api';
import { ARC_TESTNET } from '@arcmoq/shared';
import { PageHeader, Badge, SectionCard, StatCard, LoadingState } from '../components/ui';

export default function ReceiptsPage() {
  const { state, isLoading, stepMutations } = useAppState();
  const [redeemQty, setRedeemQty] = useState(100);

  if (isLoading || !state) return <LoadingState label="Loading receipts…" />;

  const receipts = buildReceipts(state);
  const primary = receipts[0];

  return (
    <div>
      <PageHeader
        title="Inventory Receipts"
        subtitle="ERC-1155 digital warehouse receipts representing verified physical inventory claims."
        badge={<Badge variant="demo">Warehouse Attestation: Demo Verifier</Badge>}
      />

      {!state.settlement && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          Complete settlement before shipment verification and receipt minting.
        </div>
      )}

      <div className="action-bar" style={{ marginBottom: '1.25rem' }}>
        <button className="btn-secondary" onClick={() => stepMutations.verify.mutate()} disabled={!state.settlement}>
          Verify Shipment
        </button>
        <button className="btn-primary" onClick={() => stepMutations.mint.mutate()} disabled={!state.batchVerified}>
          Mint Receipts
        </button>
      </div>

      {primary && (
        <div className="hero-card" style={{ marginBottom: '1.25rem' }}>
          <div className="grid-3">
            <StatCard label="Batch ID" value={primary.batchId} accent="gold" icon="🏷️" />
            <StatCard
              label="Verification"
              value={primary.verificationStatus}
              accent={primary.verificationStatus === 'verified' ? 'green' : undefined}
              icon="✓"
            />
            <StatCard label="Total units" value={state.groupOrder.currentDemand} unit="tins" accent="blue" icon="📦" />
          </div>
        </div>
      )}

      <div className="grid-2">
        {receipts.map((r) => (
          <div
            key={r.buyerAddress}
            className={`card receipt-card${r.shipmentStatus === 'redeemed' ? ' receipt-card--redeemed' : ''}`}
          >
            <div className="receipt-card__head">
              <div className="receipt-card__name">
                <span className="buyer-avatar" style={{ marginRight: '0.5rem' }}>{r.buyerName.charAt(0)}</span>
                {r.buyerName}
              </div>
              <Badge variant={r.shipmentStatus === 'redeemed' ? 'gold' : r.shipmentStatus === 'arrived' ? 'live' : 'demo'}>
                {r.shipmentStatus}
              </Badge>
            </div>
            <div className="kv-list">
              <div className="kv-list__row"><span>Allocation</span><span><strong>{r.allocation}</strong> tins</span></div>
              <div className="kv-list__row"><span>Product</span><span>{r.productName}</span></div>
              <div className="kv-list__row"><span>Origin</span><span>{r.origin}</span></div>
              <div className="kv-list__row"><span>RWA status</span><span>{state.receiptsMinted ? 'Minted' : 'Pending'}</span></div>
              {r.tokenId && <div className="kv-list__row"><span>Token ID</span><span className="mono">{r.tokenId}</span></div>}
            </div>
            {r.redemptionHistory.length > 0 && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Redemption history</div>
                {r.redemptionHistory.map((h, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {h.quantity} units — {new Date(h.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {state.receiptsMinted && (
        <SectionCard title="Redeem Goods — Restaurant A" subtitle="Burn receipt units to release physical tins" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 160, flex: '0 0 160px' }}>
              <label>Quantity to redeem</label>
              <input type="number" min={1} max={100} value={redeemQty} onChange={(e) => setRedeemQty(Number(e.target.value))} />
            </div>
            <button className="btn-success" onClick={() => stepMutations.redeem.mutate({ buyerName: 'Restaurant A — Al Barsha', quantity: redeemQty })} disabled={stepMutations.redeem.isPending}>
              {stepMutations.redeem.isPending ? 'Redeeming…' : 'Redeem & Burn Receipt'}
            </button>
          </div>
        </SectionCard>
      )}

      <div className="alert alert-info" style={{ marginTop: '1.25rem' }}>
        Receipts are KYB-restricted. No speculative market. Units burned on physical collection.
        {state.deployments.contracts.WarehouseReceipt !== '0x0000000000000000000000000000000000000000' && (
          <> · <a href={`${ARC_TESTNET.explorerUrl}/address/${state.deployments.contracts.WarehouseReceipt}`} target="_blank" rel="noreferrer">View contract</a></>
        )}
      </div>
    </div>
  );
}
