import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { LABELS } from '@arcmoq/shared';
import { arcTestnet } from '../wagmi';

const NAV = [
  { to: '/', label: 'Orders', end: true },
  { to: '/mandate', label: 'Mandate' },
  { to: '/agent', label: 'Agent' },
  { to: '/settlement', label: 'Settlement' },
  { to: '/receipts', label: 'Receipts' },
];

export default function Layout() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">ArcMOQ</span>
            <span className="brand-tagline">Small buyers. Real inventory. One autonomous global order.</span>
            <span className="brand-text" aria-hidden>
              <strong>ArcMOQ</strong>
              <small>Small buyers. Real inventory.</small>
            </span>
          </Link>

          <nav className="nav" aria-label="Main">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="wallet">
            {isConnected ? (
              <>
                <span className={`chain-pill ${chainId === arcTestnet.id ? 'ok' : 'warn'}`}>
                  {chainId === arcTestnet.id ? 'Arc Testnet' : `Chain ${chainId}`}
                </span>
                <span className="wallet-addr">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                <button className="btn-ghost" onClick={() => disconnect()}>Disconnect</button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => connect({ connector: connectors[0] })}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <div className="labels-bar" aria-label="Demo labels">
          {Object.values(LABELS).map((l) => (
            <span key={l} className="badge">{l}</span>
          ))}
        </div>
      </header>

      <main className="main page-enter">
        <Outlet />
      </main>

      <footer className="app-footer">
        ArcMOQ — UAE SME group purchasing on Arc Testnet
      </footer>
    </div>
  );
}
