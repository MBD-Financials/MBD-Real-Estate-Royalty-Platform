import { polygon, holesky, polygonAmoy } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

export const config = getDefaultConfig({
  appName: "MBD Real Estate",
  projectId: projectId,
  chains: [holesky],
  ssr: true,
});
