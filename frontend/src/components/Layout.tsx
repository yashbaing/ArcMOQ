import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { LABELS } from '@arcmoq/shared';
import { arcTestnet } from '../wagmi';

const NAV = [
  { to: '/', label: 'Orders', icon: '📋', end: true },
  { to: '/mandate', label: 'Mandate', icon: '✍️' },
  { to: '/agent', label: 'Agent', icon: '🤖' },
  { to: '/settlement', label: 'Settlement', icon: '💱' },
  { to: '/receipts', label: 'Receipts', icon: '🪙' },
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
            <div className="brand-mark" aria-hidden>🫒</div>
            <div className="brand-text">
              <strong>ArcMOQ</strong>
              <small>Small buyers. Real inventory. One autonomous global order.</small>
            </div>
          </Link>

          <nav className="nav" aria-label="Main">
            {NAV.map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="wallet">
            {isConnected ? (
              <>
                <span className={`chain-pill ${chainId === arcTestnet.id ? 'ok' : 'warn'}`}>
                  {chainId === arcTestnet.id ? '● Arc Testnet' : `Chain ${chainId}`}
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

        <div className="labels-bar">
          {Object.values(LABELS).map((l) => (
            <span key={l} className="badge badge-sim">{l}</span>
          ))}
        </div>
      </header>

      <main className="main page-enter">
        <Outlet />
      </main>

      <footer className="app-footer">
        ArcMOQ · UAE SME group purchasing · Arc Testnet settlement · ERC-1155 warehouse receipts
      </footer>
    </div>
  );
}
