import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContract } from "../hooks/useContract";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatStatus,
  bpsToPercentage,
} from "../utils/contracts";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaExclamationTriangle,
  FaSpinner,
  FaExternalLinkAlt,
  FaCheck,
  FaClock,
  FaPercentage,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle,
  FaHourglassHalf,
  FaCoins,
  FaCertificate,
  FaWallet,
  FaMeh,
  FaSyncAlt,
  FaFilter,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";

// Summary Card component
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

// Filter Button component
const FilterButton = ({ active, label, onClick }) => (
  <motion.button
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      active
        ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-lg shadow-teal-500/20"
        : "bg-gray-800/60 text-gray-400 hover:bg-gray-700/80"
    } border border-white/5`}
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
  >
    {label}
  </motion.button>
);

// Royalty Property Card component
const RoyaltyPropertyCard = ({ property, onApprove, isProcessing }) => (
  <motion.div
    className="card hover:border-teal-500 transition-all duration-300 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg"
    whileHover={{
      y: -5,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    }}
  >
    <div className="flex flex-col md:flex-row gap-6 p-6">
      <div className="md:w-1/4">
        <h3 className="font-semibold text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          {property.title}
        </h3>
        <div
          className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium mb-4 ${
            property.status === 0
              ? "bg-green-500/30 text-green-300"
              : property.status === 1
              ? "bg-yellow-500/30 text-yellow-300"
              : property.status === 2
              ? "bg-blue-500/30 text-blue-300"
              : "bg-red-500/30 text-red-300"
          } backdrop-blur-md border border-white/10`}
        >
          {formatStatus(property.status)}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>Owner:</span>
          <span className="font-medium text-gray-300">
            {formatAddress(property.owner)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Property Price:</span>
          <span className="font-medium text-gray-300">
            {formatCurrency(property.price)}
          </span>
        </div>
      </div>

      <div className="md:w-1/4">
        <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
          Royalty Details
        </h4>

        <div className="flex items-center gap-3 mb-5 bg-gray-700/30 p-3 rounded-lg border border-white/5">
          <FaPercentage className="text-teal-400 h-5 w-5" />
          <div>
            <div className="text-xs text-gray-500 mb-1">Royalty Percentage</div>
            <div className="text-lg font-semibold text-white">
              {bpsToPercentage(property.royaltyPercentage)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-700/30 p-3 rounded-lg border border-white/5">
          <FaMoneyBillWave className="text-green-400 h-5 w-5" />
          <div>
            <div className="text-xs text-gray-500 mb-1">Earnings</div>
            <div className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-300">
              {formatCurrency(property.royaltyEarnings)}
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/4">
        <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
          Approval Status
        </h4>

        <div className="mb-5">
          {property.hasApproved ? (
            <div className="flex items-center text-green-400 bg-green-900/20 py-3 px-4 rounded-lg border border-green-900/20">
              <FaCheck className="mr-2" />
              <span className="font-medium">Sale Approved</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-400 bg-yellow-900/20 py-3 px-4 rounded-lg border border-yellow-900/20">
              <FaClock className="mr-2" />
              <span className="font-medium">Approval Pending</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-gray-700/30 p-3 rounded-lg border border-white/5">
          <FaCalendarAlt className="text-blue-400 h-5 w-5" />
          <div>
            <div className="text-xs text-gray-500 mb-1">Listed Date</div>
            <div className="text-sm font-medium text-gray-300">
              {formatDate(property.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/4 flex flex-col justify-between">
        <div>
          <Link href={`/property/${property.id}`}>
            <motion.button
              className="w-full py-2.5 px-4 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition flex items-center justify-center mb-4 border border-white/5 font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaExternalLinkAlt className="h-4 w-4 mr-2" />
              View Property
            </motion.button>
          </Link>

          {!property.hasApproved && property.status === 0 && (
            <motion.button
              onClick={() => onApprove(property.id)}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-lg transition flex items-center justify-center font-medium shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              whileHover={isProcessing ? {} : { scale: 1.05 }}
              whileTap={isProcessing ? {} : { scale: 0.95 }}
            >
              {isProcessing ? (
                <>
                  <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCheck className="h-4 w-4 mr-2" />
                  Approve Sale
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function Royalties() {
  const { address, isConnected } = useAccount();
  const { contract, writeContract, isReady } = useContract();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [royaltyProperties, setRoyaltyProperties] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState({
    type: null,
    message: null,
  });

  // Fetch properties where user is a royalty holder
  useEffect(() => {
    async function fetchRoyaltyProperties() {
      if (!contract || !isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get total number of properties
        const totalProperties = await contract.getTotalProperties();

        // For each property, check if the user is a royalty holder
        const royaltyPropertiesData = [];

        for (let i = 1; i <= totalProperties.toNumber(); i++) {
          try {
            // Get property details
            const propertyDetails = await contract.getPropertyDetails(i);

            // Skip if no royalty holders
            if (propertyDetails.royaltyHolderCount.toNumber() === 0) continue;

            // Check each royalty holder
            let isRoyaltyHolder = false;
            let royaltyHolderDetails = null;

            for (
              let j = 0;
              j < propertyDetails.royaltyHolderCount.toNumber();
              j++
            ) {
              const holder = await contract.getRoyaltyHolderDetails(i, j);

              if (
                holder.holderAddress.toLowerCase() === address.toLowerCase()
              ) {
                isRoyaltyHolder = true;
                royaltyHolderDetails = holder;
                break;
              }
            }

            if (isRoyaltyHolder && royaltyHolderDetails) {
              // Get any royalty payments received (would be implemented via events in a real app)
              // For this demo, we'll just use a placeholder
              const royaltyEarnings = 0; // In a real app, you would track actual royalty payments

              royaltyPropertiesData.push({
                id: propertyDetails.id.toString(),
                title: `Property #${propertyDetails.id}`, // Would be from metadata in a real app
                status: propertyDetails.status,
                price: propertyDetails.price,
                owner: propertyDetails.owner,
                royaltyPercentage: royaltyHolderDetails.percentage,
                hasApproved: royaltyHolderDetails.hasApproved,
                royaltyEarnings,
                createdAt: propertyDetails.createdAt.toNumber(),
                updatedAt: propertyDetails.updatedAt.toNumber(),
              });
            }
          } catch (err) {
            console.error(`Error fetching property ${i}:`, err);
            // Continue with other properties
          }
        }

        setRoyaltyProperties(royaltyPropertiesData);
      } catch (err) {
        console.error("Error fetching royalty properties:", err);
        setError(
          "Failed to load your royalty properties. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRoyaltyProperties();
  }, [contract, address, isConnected]);

  // Handle approving a property sale
  const handleApprovePropertySale = async (propertyId) => {
    if (!contract || !writeContract || !isConnected) return;

    try {
      setIsProcessing(true);
      setTransactionMessage({ type: null, message: null });

      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      const transaction = await contractWithSigner.approvePropertySale(
        propertyId
      );
      await transaction.wait();

      // Update the local state
      setRoyaltyProperties((prevProperties) =>
        prevProperties.map((property) =>
          property.id === propertyId
            ? { ...property, hasApproved: true }
            : property
        )
      );

      setTransactionMessage({
        type: "success",
        message: "You have successfully approved the property sale!",
      });
    } catch (err) {
      console.error("Error approving property sale:", err);
      setTransactionMessage({
        type: "error",
        message:
          err.message || "Failed to approve property sale. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply filters
  const filteredProperties = royaltyProperties.filter((property) => {
    // Status filter
    if (statusFilter !== "all") {
      if (
        statusFilter === "active" &&
        property.status !== 0 &&
        property.status !== 1
      )
        return false;
      if (statusFilter === "sold" && property.status !== 2) return false;
      if (statusFilter === "cancelled" && property.status !== 3) return false;
    }

    // Approval filter
    if (approvalFilter !== "all") {
      if (approvalFilter === "approved" && !property.hasApproved) return false;
      if (approvalFilter === "pending" && property.hasApproved) return false;
    }

    return true;
  });

  // Calculate metrics
  const totalRoyaltyProperties = royaltyProperties.length;
  const totalApproved = royaltyProperties.filter((p) => p.hasApproved).length;
  const totalPendingApproval = royaltyProperties.filter(
    (p) => !p.hasApproved
  ).length;
  const totalEarnings = royaltyProperties.reduce(
    (sum, p) => sum + parseFloat(p.royaltyEarnings || 0),
    0
  );

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaWallet className="h-20 w-20 mx-auto text-yellow-500 mb-6 opacity-80" />
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Please connect your wallet to view and manage your royalty
            properties.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          My Royalties
        </h1>
        <p className="text-gray-400">
          Manage properties where you receive royalties
        </p>
      </motion.div>

      {/* Transaction Alert */}
      {transactionMessage.type && (
        <motion.div
          className={`mb-8 p-5 rounded-xl ${
            transactionMessage.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : "bg-red-500/20 border border-red-500/30 text-red-400"
          } shadow-lg backdrop-blur-sm`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            {transactionMessage.type === "success" ? (
              <FaCheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <FaExclamationTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            )}
            <p className="font-medium">{transactionMessage.message}</p>
            <button
              className="ml-auto"
              onClick={() =>
                setTransactionMessage({ type: null, message: null })
              }
            >
              <FaTimes className="h-4 w-4 text-gray-500 hover:text-gray-300 transition-colors" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Royalty Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SummaryCard
          title="Total Properties"
          value={totalRoyaltyProperties}
          gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
          icon={<FaBuilding className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Approved"
          value={totalApproved}
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
          icon={<FaCheckCircle className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Pending Approval"
          value={totalPendingApproval}
          gradient="bg-gradient-to-r from-yellow-500 to-amber-600"
          icon={<FaHourglassHalf className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Total Earnings"
          value={formatCurrency(totalEarnings)}
          gradient="bg-gradient-to-r from-purple-500 to-fuchsia-600"
          icon={<FaCoins className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Filter Controls */}
      <motion.div
        className="card p-4 sm:p-6 mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          <div className="flex flex-col xs:flex-row gap-3">
            <div className="flex items-center font-medium text-gray-400">
              <FaFilter className="mr-2 text-teal-400" /> Status:
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={statusFilter === "all"}
                label="All"
                onClick={() => setStatusFilter("all")}
              />
              <FilterButton
                active={statusFilter === "active"}
                label="Active"
                onClick={() => setStatusFilter("active")}
              />
              <FilterButton
                active={statusFilter === "sold"}
                label="Sold"
                onClick={() => setStatusFilter("sold")}
              />
              <FilterButton
                active={statusFilter === "cancelled"}
                label="Cancelled"
                onClick={() => setStatusFilter("cancelled")}
              />
            </div>
          </div>

          <div className="flex flex-col xs:flex-row gap-3">
            <div className="flex items-center font-medium text-gray-400">
              <FaCertificate className="mr-2 text-teal-400" /> Approval:
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={approvalFilter === "all"}
                label="All"
                onClick={() => setApprovalFilter("all")}
              />
              <FilterButton
                active={approvalFilter === "approved"}
                label="Approved"
                onClick={() => setApprovalFilter("approved")}
              />
              <FilterButton
                active={approvalFilter === "pending"}
                label="Pending Approval"
                onClick={() => setApprovalFilter("pending")}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Royalty Properties List */}
      {loading ? (
        <motion.div
          className="flex flex-col items-center justify-center p-16 bg-gray-800/30 rounded-xl border border-gray-700/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaSpinner className="h-10 w-10 text-teal-400 animate-spin mb-4" />
          <span className="text-gray-400 text-lg">
            Loading your royalty properties...
          </span>
        </motion.div>
      ) : error ? (
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaExclamationTriangle className="h-16 w-16 mx-auto text-red-400 mb-6" />
          <h3 className="text-xl font-semibold mb-3">
            Error Loading Properties
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSyncAlt className="mr-2" /> Retry
          </motion.button>
        </motion.div>
      ) : filteredProperties.length > 0 ? (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <RoyaltyPropertyCard
                property={property}
                onApprove={handleApprovePropertySale}
                isProcessing={isProcessing}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaMeh className="h-16 w-16 mx-auto text-gray-600 mb-6" />
          <h3 className="text-xl font-semibold mb-3">
            No Royalty Properties Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            {statusFilter !== "all" || approvalFilter !== "all"
              ? "No properties match your current filters."
              : "You don't have any properties where you earn royalties."}
          </p>
          <Link href="/marketplace">
            <motion.button
              className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaExternalLinkAlt className="mr-2" /> Browse Properties
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Informational Note */}
      <motion.div
        className="mt-8 p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-gray-300 flex items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <FaInfoCircle className="h-5 w-5 mr-3 mt-0.5 text-indigo-400 flex-shrink-0" />
        <p className="text-sm">
          As a royalty holder, you'll receive a percentage of the sales price
          whenever the property is sold. You need to approve property sales to
          maintain your royalty rights for future transactions.
        </p>
      </motion.div>
    </div>
  );
}
