import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { LABELS } from '@arcmoq/shared';
import { arcTestnet } from '../wagmi';

export default function Layout() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-icon">🫒</span>
            <div>
              <strong>ArcMOQ</strong>
              <small>Small buyers. Real inventory. One autonomous global order.</small>
            </div>
          </Link>
          <nav className="nav">
            <NavLink to="/" end className={navClass}>Orders</NavLink>
            <NavLink to="/mandate" className={navClass}>Mandate</NavLink>
            <NavLink to="/agent" className={navClass}>Agent</NavLink>
            <NavLink to="/settlement" className={navClass}>Settlement</NavLink>
            <NavLink to="/receipts" className={navClass}>Receipts</NavLink>
          </nav>
          <div className="wallet">
            {isConnected ? (
              <>
                <span className={`chain-pill ${chainId === arcTestnet.id ? 'ok' : 'warn'}`}>
                  {chainId === arcTestnet.id ? 'Arc Testnet' : `Chain ${chainId}`}
                </span>
                <span className="mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                <button className="btn-secondary" onClick={() => disconnect()}>Disconnect</button>
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
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
