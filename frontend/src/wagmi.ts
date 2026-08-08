import { http, createConfig } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { arcTestnet } from './chain';

export { arcTestnet, ARC_CONTRACTS } from './chain';

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID?.trim();

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId
      ? [
          walletConnect({
            projectId: wcProjectId,
            showQrModal: true,
            metadata: {
              name: 'ArcMOQ',
              description: 'UAE SME group purchasing on Arc Testnet',
              url: typeof window !== 'undefined' ? window.location.origin : 'https://arcmoq.vercel.app',
              icons: [],
            },
          }),
        ]
      : []),
  ],
  multiInjectedProviderDiscovery: true,
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.io'),
  },
});
