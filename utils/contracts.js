import { ethers } from "ethers";
import ABI from "../Context/RealEstateDApp.json";
// ABI for the RealEstateDApp contract
export const RealEstateDAppABI = ABI.abi;

// Contract address - replace with your deployed contract address
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS; // Replace with your contract address

// Helper function to get contract
export const getContract = (providerOrSigner) => {
  if (!providerOrSigner) return null;
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    RealEstateDAppABI,
    providerOrSigner
  );
};

// Convert wei to ETH for display
export const weiToEth = (wei) => {
  return ethers.utils.formatEther(wei);
};

// Convert ETH to wei for transactions
export const ethToWei = (eth) => {
  return ethers.utils.parseEther(eth.toString());
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format timestamp to readable date
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// Format property status
export const formatStatus = (status) => {
  const statusMap = ["Listed", "Under Contract", "Sold", "Cancelled"];
  return statusMap[status] || "Unknown";
};

// Convert basis points to percentage for display
export const bpsToPercentage = (bps) => {
  return (bps / 100).toFixed(2) + "%";
};

// Format currency - fixed version
export const formatCurrency = (amount, symbol = "ETH") => {
  if (!amount) return `0 ${symbol}`;

  // Convert BigNumber to string if needed
  if (amount._isBigNumber) {
    amount = ethers.utils.formatEther(amount);
  }

  // Ensure amount is a number
  if (typeof amount === "string") {
    amount = parseFloat(amount);
  }

  // Check if amount is a valid number before using toFixed
  if (typeof amount !== "number" || isNaN(amount)) {
    return `0 ${symbol}`;
  }

  return `${amount.toFixed(6)} ${symbol}`;
};

// IPFS gateway URL
export const ipfsGateway = "https://ipfs.io/ipfs/";

// Convert IPFS URI to HTTP URL
export const ipfsToHttp = (uri) => {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `${ipfsGateway}${uri.substring(7)}`;
  }
  return uri;
};
