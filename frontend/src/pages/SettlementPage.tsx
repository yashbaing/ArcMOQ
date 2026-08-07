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
        subtitle="USDC pooled on Arc Testnet, converted and paid to the supplier in EURC."
        badge={<Badge variant="live">Arc settlement: live testnet</Badge>}
      />

      {!settlement ? (
        <SectionCard title="Awaiting settlement">
          <EmptyState
            title="Settlement not yet executed"
            detail="Complete policy checks and settlement from the Agent page, or run the full demo."
            action={
              <div className="action-bar" style={{ justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => stepMutations.policyCheck.mutate()}>Run policy check</button>
                <button className="btn-primary" onClick={() => stepMutations.settle.mutate()}>Execute settlement</button>
              </div>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid-2">
          <SectionCard title="Payment flow" subtitle="AED interface → USDC pool → EURC payout">
            <FlowPipeline
              steps={[
                { title: 'AED collection', detail: 'UAE buyers authorize AED budgets', badge: <Badge variant="sim">Simulated PSP</Badge> },
                { title: 'USDC pool on Arc', detail: `${settlement.totalUSDC} USDC in GroupOrder`, badge: <Badge variant="live">Testnet</Badge> },
                { title: 'StableFX adapter', detail: `Rate ${settlement.fxRate} · Fee ${settlement.fxFeeBps} bps`, badge: <Badge variant="demo">Test mode</Badge> },
                { title: 'EURC to supplier', detail: `${settlement.eurcPaid} EURC paid`, badge: <Badge variant="live">Testnet</Badge> },
              ]}
            />
          </SectionCard>

          <SectionCard title="Settlement details">
            <div className="kv-list">
              <div className="kv-list__row"><span>Total pooled USDC</span><span><strong>{settlement.totalUSDC}</strong></span></div>
              <div className="kv-list__row"><span>EURC paid</span><span><strong style={{ color: 'var(--olive)' }}>{settlement.eurcPaid}</strong></span></div>
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
                View on ArcScan
              </a>
            )}
          </SectionCard>
        </div>
      )}

      {policy && (
        <SectionCard
          title="Policy validation"
          subtitle={policy.passed ? 'All checks passed — agent authorized to execute' : 'One or more checks failed'}
          style={{ marginTop: '1.25rem' }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <Badge variant={policy.passed ? 'live' : 'sim'}>{policy.passed ? 'Passed' : 'Failed'}</Badge>
          </div>
          {policy.checks.map((c) => (
            <div key={c.name} className="check-row">
              <span className={`check-icon ${c.passed ? 'check-pass' : 'check-fail'}`}>{c.passed ? '✓' : '×'}</span>
              <div>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Deployed contracts" subtitle="Arc Testnet addresses" style={{ marginTop: '1.25rem' }}>
        <div className="kv-list">
          {Object.entries(state.deployments.contracts).map(([name, addr]) => (
            <div key={name} className="kv-list__row">
              <span>{name}</span>
              <span className="mono">
                {addr === '0x0000000000000000000000000000000000000000' ? (
                  <span style={{ color: 'var(--warn)' }}>Not deployed</span>
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
