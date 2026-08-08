import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
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
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const injectedConnector = connectors.find((c) => c.type === 'injected') ?? connectors[0];
  const onArc = chainId === arcTestnet.id;

  const handleConnect = () => {
    if (!injectedConnector) {
      window.alert('No wallet detected. Install MetaMask or open this app in a Web3 browser.');
      return;
    }
    connect({ connector: injectedConnector, chainId: arcTestnet.id });
  };

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
                <span className={`chain-pill ${onArc ? 'ok' : 'warn'}`}>
                  {onArc ? 'Arc Testnet' : `Chain ${chainId}`}
                </span>
                {!onArc && (
                  <button
                    className="btn-ghost"
                    disabled={isSwitching}
                    onClick={() => switchChain({ chainId: arcTestnet.id })}
                  >
                    {isSwitching ? 'Switching…' : 'Switch to Arc'}
                  </button>
                )}
                <span className="wallet-addr">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                <button className="btn-ghost" onClick={() => disconnect()}>Disconnect</button>
              </>
            ) : (
              <button className="btn-primary" onClick={handleConnect} disabled={isPending}>
                {isPending ? 'Connecting…' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {connectError && (
          <div className="labels-bar">
            <span className="badge" style={{ background: '#fde8e8', color: '#9b1c1c' }}>
              Wallet: {connectError.message}
            </span>
          </div>
        )}

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
