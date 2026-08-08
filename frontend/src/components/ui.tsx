import { ReactNode, CSSProperties } from 'react';

export function PageHeader({ title, subtitle, badge, actions }: { title: string; subtitle: string; badge?: ReactNode; actions?: ReactNode; }) {
  return (
    <header className="page-header">
      <div className="page-header__text"><h1>{title}</h1><p>{subtitle}</p></div>
      {(badge || actions) && <div className="page-header__actions">{badge}{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string; accent?: string; icon?: string; }) {
  return (<div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value">{value}{unit && <span className="stat-unit">{unit}</span>}</div></div>);
}

export function Badge({ children, variant = 'sim' }: { children: ReactNode; variant?: 'live' | 'sim' | 'demo' | 'gold'; }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function ProgressRail({ steps, current }: { steps: string[]; current: number }) {
  return (<div className="progress-rail" role="list">{steps.map((step, i) => { const done = current > i; const active = current === i; return (<div key={step} className={`progress-rail__step ${done ? 'done' : ''} ${active ? 'active' : ''}`} role="listitem"><div className="progress-rail__dot">{done ? '✓' : i + 1}</div><span className="progress-rail__label">{step}</span></div>); })}</div>);
}

export function MoqBar({ demand, originalMoq, negotiatedMoq }: { demand: number; originalMoq: number; negotiatedMoq?: number }) {
  const pct = Math.min(100, (demand / originalMoq) * 100); const negotiated = negotiatedMoq && negotiatedMoq < originalMoq;
  return (<div className="moq-bar"><div className="moq-bar__header"><span>Demand vs supplier MOQ</span><span className="moq-bar__nums"><strong>{demand}</strong> / {negotiated ? <s>{originalMoq}</s> : originalMoq} tins</span></div><div className="moq-bar__track"><div className="moq-bar__fill" style={{ width: `${pct}%` }} />{negotiated && <div className="moq-bar__marker" style={{ left: `${(negotiatedMoq! / originalMoq) * 100}%` }} title={`Negotiated MOQ: ${negotiatedMoq}`} />}</div>{negotiated && <p className="moq-bar__note">Agent renegotiated MOQ to <strong>{negotiatedMoq}</strong> tins</p>}</div>);
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (<div className="loading-state"><div className="loading-state__spinner" /><p>{label}</p></div>);
}

export function ErrorState({ title, detail, action }: { title: string; detail?: string; action?: ReactNode; }) {
  return (<div className="empty-state error-state"><h3>{title}</h3>{detail && <p>{detail}</p>}{action}</div>);
}

export function EmptyState({ title, detail, action }: { icon?: string; title: string; detail?: string; action?: ReactNode }) {
  return (<div className="empty-state"><h3>{title}</h3>{detail && <p>{detail}</p>}{action}</div>);
}

export function SectionCard({ title, subtitle, children, className = '', style }: { title: string; subtitle?: string; children: ReactNode; className?: string; style?: CSSProperties; }) {
  return (<section className={`section-card ${className}`} style={style}><div className="section-card__head"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{children}</section>);
}

export function FlowPipeline({ steps }: { steps: Array<{ title: string; detail: string; badge?: ReactNode }> }) {
  return (<div className="flow-pipeline">{steps.map((step, i) => (<div key={step.title} className="flow-pipeline__step"><div className="flow-pipeline__num">{i + 1}</div><div className="flow-pipeline__body"><div className="flow-pipeline__title"><strong>{step.title}</strong>{step.badge}</div><p>{step.detail}</p></div></div>))}</div>);
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (<label className="toggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="toggle__track" /><span className="toggle__label">{label}</span></label>);
}

export function ActivityTimeline({ events }: { events: Array<{ id: string; type: string; title: string; detail: string; timestamp: string }>; }) {
  return (<div className="activity-timeline">{events.map((event) => (<article key={event.id} className={`activity-timeline__item activity-timeline__item--${event.type}`}><div className="activity-timeline__icon" aria-hidden /><div className="activity-timeline__content"><div className="activity-timeline__meta"><strong>{event.title}</strong><time>{new Date(event.timestamp).toLocaleTimeString()}</time></div><p>{event.detail}</p></div></article>))}</div>);
}
