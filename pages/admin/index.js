import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContract } from "../../hooks/useContract";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  ethToWei,
} from "../../utils/contracts";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import {
  FaDatabase,
  FaHome,
  FaCheckCircle,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaPercentage,
  FaWallet,
  FaCog,
  FaExclamationTriangle,
  FaUnlock,
  FaTimes,
  FaSpinner,
  FaServer,
  FaUser,
  FaCoins,
  FaFileContract,
  FaLock,
  FaInfoCircle,
} from "react-icons/fa";

/// Summary Card component
const SummaryCard = ({ title, value, icon, gradient }) => (
  <motion.div
    className="card relative overflow-hidden shadow-lg bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div
      className={`absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-10 ${gradient}`}
    ></div>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          {value}
        </p>
      </div>
      <div
        className={`h-14 w-14 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}
      >
        {icon}
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const { contract, writeContract } = useContract();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTransactions: 0,
    listedProperties: 0,
    soldProperties: 0,
    contractBalance: 0,
    listingFee: 0,
    purchaseFee: 0,
  });

  // Fee update state
  const [newListingFee, setNewListingFee] = useState("");
  const [newPurchaseFee, setNewPurchaseFee] = useState("");

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (contract && address) {
        try {
          const contractOwner = await contract.owner();
          setIsAdmin(contractOwner.toLowerCase() === address.toLowerCase());
        } catch (error) {
          console.error("Error checking admin status:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (contract && address) {
      checkAdmin();
    }
  }, [contract, address]);

  // Fetch contract stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!contract) return;

      try {
        // Get contract statistics
        const statistics = await contract.getContractStatistics();
        const listingFee = await contract.listingFee();
        const purchaseFee = await contract.purchaseFee();
        const balance = await contract.provider.getBalance(contract.address);

        setStats({
          totalProperties: statistics.totalProperties.toNumber(),
          totalTransactions: statistics.totalTransactions.toNumber(),
          listedProperties: statistics.listedProperties.toNumber(),
          soldProperties: statistics.soldProperties.toNumber(),
          contractBalance: ethers.utils.formatEther(balance),
          listingFee: ethers.utils.formatEther(listingFee),
          purchaseFee: purchaseFee.toNumber() / 100, // Convert basis points to percentage
        });

        // Pre-fill form fields
        setNewListingFee(ethers.utils.formatEther(listingFee));
        setNewPurchaseFee((purchaseFee.toNumber() / 100).toString());
      } catch (error) {
        console.error("Error fetching contract statistics:", error);
        setErrorMessage("Failed to load contract data");
      }
    };

    if (contract) {
      fetchStats();
    }
  }, [contract]);

  // Handle update listing fee
  const handleUpdateListingFee = async (e) => {
    e.preventDefault();

    if (!isAdmin || !contract) return;

    try {
      setLoadingAction(true);
      setErrorMessage("");
      setSuccessMessage("");

      const listingFeeWei = ethToWei(newListingFee);

      // Get contract with signer
      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      // Update listing fee
      const transaction = await contractWithSigner.updateListingFee(
        listingFeeWei
      );
      await transaction.wait();

      setSuccessMessage("Listing fee updated successfully!");

      // Update stats with new fee
      setStats({
        ...stats,
        listingFee: newListingFee,
      });
    } catch (error) {
      console.error("Error updating listing fee:", error);
      setErrorMessage(error.message || "Failed to update listing fee");
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle update purchase fee
  const handleUpdatePurchaseFee = async (e) => {
    e.preventDefault();

    if (!isAdmin || !contract) return;

    try {
      setLoadingAction(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Convert percentage to basis points (100 = 1%)
      const purchaseFeeBps = Math.floor(parseFloat(newPurchaseFee) * 100);

      if (purchaseFeeBps > 1000) {
        throw new Error("Purchase fee cannot exceed 10%");
      }

      // Get contract with signer
      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      // Update purchase fee
      const transaction = await contractWithSigner.updatePurchaseFee(
        purchaseFeeBps
      );
      await transaction.wait();

      setSuccessMessage("Purchase fee updated successfully!");

      // Update stats with new fee
      setStats({
        ...stats,
        purchaseFee: parseFloat(newPurchaseFee),
      });
    } catch (error) {
      console.error("Error updating purchase fee:", error);
      setErrorMessage(error.message || "Failed to update purchase fee");
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle withdraw ETH
  const handleWithdrawETH = async () => {
    if (!isAdmin || !contract) return;

    try {
      setWithdrawalLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Get contract with signer
      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      // Withdraw ETH
      const transaction = await contractWithSigner.withdrawETH();
      await transaction.wait();

      setSuccessMessage("ETH withdrawn successfully!");

      // Update contract balance
      const balance = await contract.provider.getBalance(contract.address);
      setStats({
        ...stats,
        contractBalance: ethers.utils.formatEther(balance),
      });
    } catch (error) {
      console.error("Error withdrawing ETH:", error);
      setErrorMessage(error.message || "Failed to withdraw ETH");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-800/70 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl h-28"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl h-64"></div>
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl h-64"></div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl h-80"></div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaLock className="h-20 w-20 mx-auto text-yellow-500 mb-6 opacity-80" />
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Please connect your wallet to access the admin dashboard.
          </p>
          <motion.button
            className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaWallet className="mr-2" /> Connect Wallet
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaLock className="h-20 w-20 mx-auto text-red-500 mb-6 opacity-80" />
          <h2 className="text-2xl font-semibold mb-3">Access Denied</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            You do not have admin privileges to access this dashboard. Only the
            contract owner has permission to view and modify these settings.
          </p>
          <motion.button
            className="px-6 py-3 border border-gray-700/70 rounded-xl hover:bg-gray-800 transition flex items-center justify-center mx-auto"
            whileHover={{
              scale: 1.05,
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
          >
            Return to Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 flex items-center">
          <FaCog className="mr-3 text-teal-400" /> Admin Dashboard
        </h1>
        <p className="text-gray-400">
          Manage contract settings and view platform statistics
        </p>
      </motion.div>

      {errorMessage && (
        <motion.div
          className="bg-red-500/20 border border-red-500/30 text-red-400 p-5 rounded-xl mb-8 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <FaExclamationTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <p className="font-medium">{errorMessage}</p>
            <button className="ml-auto" onClick={() => setErrorMessage("")}>
              <FaTimes className="h-4 w-4 text-gray-500 hover:text-gray-300 transition-colors" />
            </button>
          </div>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          className="bg-green-500/20 border border-green-500/30 text-green-400 p-5 rounded-xl mb-8 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <FaCheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <p className="font-medium">{successMessage}</p>
            <button className="ml-auto" onClick={() => setSuccessMessage("")}>
              <FaTimes className="h-4 w-4 text-gray-500 hover:text-gray-300 transition-colors" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Statistics Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SummaryCard
          title="Total Properties"
          value={stats.totalProperties}
          gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
          icon={<FaHome className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Listed Properties"
          value={stats.listedProperties}
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
          icon={<FaDatabase className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Sold Properties"
          value={stats.soldProperties}
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
          icon={<FaCheckCircle className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Total Transactions"
          value={stats.totalTransactions}
          gradient="bg-gradient-to-r from-pink-500 to-rose-600"
          icon={<FaExchangeAlt className="h-6 w-6 text-white" />}
        />
      </motion.div>

      {/* Admin Controls */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Fee Management */}
        <div className="card bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700/50 flex items-center">
            <FaPercentage className="h-5 w-5 mr-3 text-teal-400" />
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Fee Management
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Listing Fee Form */}
            <form onSubmit={handleUpdateListingFee} className="space-y-4">
              <div>
                <label
                  htmlFor="listingFee"
                  className="block text-sm font-medium text-gray-400 mb-2 flex items-center"
                >
                  <FaMoneyBillWave className="mr-2 text-teal-400" />
                  Listing Fee (ETH)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="listingFee"
                    value={newListingFee}
                    onChange={(e) => setNewListingFee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200 flex-grow"
                    placeholder="e.g. 0.01"
                    step="0.0001"
                    min="0"
                    required
                  />
                  <motion.button
                    type="submit"
                    className="gradient-btn flex items-center justify-center px-5 py-2.5 font-medium rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                    disabled={loadingAction}
                    whileHover={loadingAction ? {} : { scale: 1.05 }}
                    whileTap={loadingAction ? {} : { scale: 0.95 }}
                  >
                    {loadingAction ? (
                      <>
                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <FaInfoCircle className="mr-1 text-teal-400" />
                  Current: {stats.listingFee} ETH
                </p>
              </div>
            </form>

            {/* Purchase Fee Form */}
            <form onSubmit={handleUpdatePurchaseFee} className="space-y-4">
              <div>
                <label
                  htmlFor="purchaseFee"
                  className="block text-sm font-medium text-gray-400 mb-2 flex items-center"
                >
                  <FaPercentage className="mr-2 text-teal-400" />
                  Purchase Fee (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="purchaseFee"
                    value={newPurchaseFee}
                    onChange={(e) => setNewPurchaseFee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200 flex-grow"
                    placeholder="e.g. 2.5"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                  />
                  <motion.button
                    type="submit"
                    className="gradient-btn flex items-center justify-center px-5 py-2.5 font-medium rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                    disabled={loadingAction}
                    whileHover={loadingAction ? {} : { scale: 1.05 }}
                    whileTap={loadingAction ? {} : { scale: 0.95 }}
                  >
                    {loadingAction ? (
                      <>
                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <FaInfoCircle className="mr-1 text-teal-400" />
                  Current: {stats.purchaseFee}%
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Treasury Management */}
        <div className="card bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700/50 flex items-center">
            <FaCoins className="h-5 w-5 mr-3 text-teal-400" />
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Treasury Management
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                <FaWallet className="mr-2 text-teal-400" />
                Contract Balance
              </h3>
              <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                {stats.contractBalance} ETH
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                <FaUnlock className="mr-2 text-teal-400" />
                Actions
              </h3>
              <motion.button
                onClick={handleWithdrawETH}
                className="gradient-btn w-full flex items-center justify-center px-5 py-3 font-medium rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                disabled={
                  withdrawalLoading || parseFloat(stats.contractBalance) <= 0
                }
                whileHover={
                  withdrawalLoading || parseFloat(stats.contractBalance) <= 0
                    ? {}
                    : { scale: 1.02 }
                }
                whileTap={
                  withdrawalLoading || parseFloat(stats.contractBalance) <= 0
                    ? {}
                    : { scale: 0.98 }
                }
              >
                {withdrawalLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCoins className="mr-2 h-4 w-4" />
                    Withdraw ETH to Owner
                  </>
                )}
              </motion.button>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <FaInfoCircle className="mr-1 text-yellow-400" />
                Withdraws all ETH in the contract to the admin address.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-700/50">
              <p className="text-sm text-gray-400 flex items-center">
                <FaUser className="mr-2 text-teal-400" />
                Admin Address:{" "}
                <span className="ml-2 font-medium text-gray-300">
                  {formatAddress(address)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Platform Status */}
      <motion.div
        className="card bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="p-6 border-b border-gray-700/50 flex items-center">
          <FaServer className="h-5 w-5 mr-3 text-teal-400" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Platform Status
          </h2>
        </div>

        <div className="p-0 overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase bg-gray-900/30">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-4 text-left">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center"
                  >
                    <FaFileContract className="mr-2 text-teal-400" />
                    Contract Address
                  </th>
                  <td className="px-6 py-4 font-mono text-gray-300">
                    {formatAddress(address)}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Contract owner with admin privileges
                  </td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center"
                  >
                    <FaMoneyBillWave className="mr-2 text-teal-400" />
                    Listing Fee
                  </th>
                  <td className="px-6 py-4 font-medium text-teal-300">
                    {stats.listingFee} ETH
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Fee charged when listing a property
                  </td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center"
                  >
                    <FaPercentage className="mr-2 text-teal-400" />
                    Purchase Fee
                  </th>
                  <td className="px-6 py-4 font-medium text-teal-300">
                    {stats.purchaseFee}%
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Fee percentage charged on property purchases
                  </td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center"
                  >
                    <FaWallet className="mr-2 text-teal-400" />
                    Contract Balance
                  </th>
                  <td className="px-6 py-4 font-medium text-teal-300">
                    {stats.contractBalance} ETH
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Current ETH balance in the contract
                  </td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center"
                  >
                    <FaUser className="mr-2 text-teal-400" />
                    Admin Address
                  </th>
                  <td className="px-6 py-4 font-mono text-gray-300">
                    {" "}
                    {contract ? formatAddress(contract.address) : "Loading..."}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Smart contract deployed on blockchain
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
