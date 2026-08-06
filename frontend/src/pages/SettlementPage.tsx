import { useAppState } from '../hooks/useAppState';
import { ARC_TESTNET, SupplierOffer } from '@arcmoq/shared';
import { PageHeader, Badge, SectionCard, FlowPipeline, LoadingState, EmptyState } from '../components/ui';

export default function SettlementPage() {
  const { state, isLoading, stepMutations } = useAppState();

  if (isLoading || !state) return <LoadingState label="Loading settlement…" />;

  const settlement = state.settlement;
  const offer = state.currentOffer as SupplierOffer | null;
  const policy = state.policyResult;

  return (
    <div>
      <PageHeader
        title="Settlement"
        subtitle="USDC pooled on Arc Testnet → EURC supplier payment via StableFX Test Adapter."
        badge={<Badge variant="live">Arc Settlement: Live Testnet</Badge>}
      />

      {!settlement ? (
        <SectionCard title="Awaiting Settlement">
          <EmptyState
            icon="💱"
            title="Settlement not yet executed"
            detail="Run policy checks and execute settlement from the Agent page, or use Run Full Demo."
            action={
              <div className="action-bar" style={{ justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => stepMutations.policyCheck.mutate()}>Run Policy Check</button>
                <button className="btn-primary" onClick={() => stepMutations.settle.mutate()}>Execute Settlement</button>
              </div>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid-2">
          <SectionCard title="Payment Flow" subtitle="AED → USDC → EURC cross-border pipeline">
            <FlowPipeline
              steps={[
                { title: 'AED Collection', detail: 'UAE buyers authorize AED budgets', badge: <Badge variant="sim">Simulated PSP</Badge> },
                { title: 'USDC Pool on Arc', detail: `${settlement.totalUSDC} USDC pooled in GroupOrder contract`, badge: <Badge variant="live">Testnet</Badge> },
                { title: 'StableFX Adapter', detail: `Rate ${settlement.fxRate} · Fee ${settlement.fxFeeBps} bps`, badge: <Badge variant="demo">Test Mode</Badge> },
                { title: 'EURC to Supplier', detail: `${settlement.eurcPaid} EURC → Spanish supplier`, badge: <Badge variant="live">Testnet</Badge> },
              ]}
            />
          </SectionCard>

          <SectionCard title="Settlement Details">
            <div className="kv-list">
              <div className="kv-list__row"><span>Total pooled USDC</span><span><strong>{settlement.totalUSDC}</strong></span></div>
              <div className="kv-list__row"><span>EURC paid</span><span><strong style={{ color: 'var(--accent-2)' }}>{settlement.eurcPaid}</strong></span></div>
              <div className="kv-list__row"><span>FX rate</span><span>{settlement.fxRate}</span></div>
              <div className="kv-list__row"><span>FX fee</span><span>{settlement.fxFeeBps} bps</span></div>
              <div className="kv-list__row"><span>Supplier wallet</span><span className="mono">{settlement.supplierWallet.slice(0, 18)}…</span></div>
              <div className="kv-list__row"><span>Status</span><span><Badge variant="live">{settlement.status}</Badge></span></div>
              {offer && (
                <>
                  <div className="kv-list__row"><span>Quantity</span><span>{offer.quantity} tins</span></div>
                  <div className="kv-list__row"><span>Unit price</span><span>€{offer.unitPriceEUR}/tin</span></div>
                </>
              )}
            </div>
            {(settlement.explorerUrl || settlement.txHash) && (
              <a
                href={settlement.explorerUrl || `${ARC_TESTNET.explorerUrl}/tx/${settlement.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ marginTop: '1.25rem', display: 'inline-flex' }}
              >
                View on ArcScan →
              </a>
            )}
          </SectionCard>
        </div>
      )}

      {policy && (
        <SectionCard
          title="Policy Validation"
          subtitle={policy.passed ? 'All checks passed — agent authorized to execute' : 'One or more checks failed'}
          style={{ marginTop: '1.25rem' }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <Badge variant={policy.passed ? 'live' : 'sim'}>{policy.passed ? 'PASSED' : 'FAILED'}</Badge>
          </div>
          {policy.checks.map((c) => (
            <div key={c.name} className="check-row">
              <span className={`check-icon ${c.passed ? 'check-pass' : 'check-fail'}`}>{c.passed ? '✓' : '✗'}</span>
              <div>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Deployed Contracts" subtitle="Arc Testnet addresses" style={{ marginTop: '1.25rem' }}>
        <div className="kv-list">
          {Object.entries(state.deployments.contracts).map(([name, addr]) => (
            <div key={name} className="kv-list__row">
              <span>{name}</span>
              <span className="mono">
                {addr === '0x0000000000000000000000000000000000000000' ? (
                  <span style={{ color: 'var(--warning)' }}>Not deployed</span>
                ) : (
                  <a href={`${ARC_TESTNET.explorerUrl}/address/${addr}`} target="_blank" rel="noreferrer">
                    {addr.slice(0, 10)}…{addr.slice(-6)}
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
