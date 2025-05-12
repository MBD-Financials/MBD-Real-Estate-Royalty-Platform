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
  FaMoneyBillWave,
  FaHome,
  FaCheckCircle,
  FaHourglassHalf,
  FaWallet,
  FaMeh,
  FaSyncAlt,
  FaArrowRight,
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

// Investment Card component
const InvestmentCard = ({ investment }) => (
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
          {investment.title}
        </h3>
        <div
          className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium mb-4 ${
            investment.status === 0
              ? "bg-green-500/30 text-green-300"
              : investment.status === 1
              ? "bg-yellow-500/30 text-yellow-300"
              : investment.status === 2
              ? "bg-blue-500/30 text-blue-300"
              : "bg-red-500/30 text-red-300"
          } backdrop-blur-md border border-white/10`}
        >
          {formatStatus(investment.status)}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span>Owner:</span>
          <span className="font-medium text-gray-300">
            {formatAddress(investment.owner)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Property Price:</span>
          <span className="font-medium text-gray-300">
            {formatCurrency(investment.price)}
          </span>
        </div>
      </div>

      <div className="md:w-1/4">
        <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
          Your Investment
        </h4>

        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Ownership Share</div>
          <div className="text-lg font-semibold text-white">
            {bpsToPercentage(investment.sharePercentage)}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Amount Invested</div>
          <div className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
            {investment.hasPaid ? formatCurrency(investment.amountPaid) : "-"}
          </div>
        </div>
      </div>

      <div className="md:w-1/4">
        <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
          Investment Status
        </h4>

        <div className="mb-4">
          {investment.hasPaid ? (
            <div className="flex items-center text-green-400 bg-green-900/20 py-2 px-3 rounded-lg">
              <FaCheck className="mr-2" />
              <span className="font-medium">Payment Completed</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-400 bg-yellow-900/20 py-2 px-3 rounded-lg">
              <FaClock className="mr-2" />
              <span className="font-medium">Payment Pending</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Investment Date</div>
          <div className="text-sm font-medium text-gray-300">
            {formatDate(investment.updatedAt)}
          </div>
        </div>
      </div>

      <div className="md:w-1/4 flex flex-col justify-between">
        <div>
          <Link href={`/property/${investment.id}`}>
            <motion.button
              className="w-full py-2 px-4 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition flex items-center justify-center mb-4 border border-white/5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaExternalLinkAlt className="h-4 w-4 mr-2" />
              View Property
            </motion.button>
          </Link>

          {!investment.hasPaid && (
            <Link href={`/property/${investment.id}?tab=buyers`}>
              <motion.button
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-lg transition flex items-center justify-center font-medium shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaWallet className="mr-2 h-4 w-4" />
                Complete Payment
              </motion.button>
            </Link>
          )}
        </div>

        {investment.hasPaid && (
          <div className="text-center mt-3 bg-gray-700/30 py-3 px-4 rounded-lg border border-white/5">
            <div className="text-sm text-gray-400">Current ROI</div>
            <div className="text-lg font-semibold text-green-400">
              +{investment.roi}%
            </div>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

export default function MyInvestments() {
  const { address, isConnected } = useAccount();
  const { contract, isReady } = useContract();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch user's investments
  useEffect(() => {
    async function fetchInvestments() {
      if (!contract || !isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get properties where user is a buyer
        const propertyIds = await contract.getPropertiesByBuyer(
          address,
          100,
          0
        );

        if (propertyIds.length === 0) {
          setInvestments([]);
          setLoading(false);
          return;
        }

        const investmentsData = await Promise.all(
          propertyIds.map(async (id) => {
            // Get basic property details
            const propertyDetails = await contract.getPropertyDetails(id);

            // Find buyer details for current user
            let buyerDetails = null;
            for (let i = 0; i < propertyDetails.buyerCount.toNumber(); i++) {
              const buyer = await contract.getBuyerDetails(id, i);
              if (buyer.buyerAddress.toLowerCase() === address.toLowerCase()) {
                buyerDetails = {
                  sharePercentage: buyer.sharePercentage,
                  amountPaid: buyer.amountPaid,
                  hasPaid: buyer.hasPaid,
                };
                break;
              }
            }

            // Calculate investment metrics
            let investmentValue = 0;
            let roi = 0;

            if (buyerDetails) {
              // Current investment value (simplified - in a real app, you would
              // implement a property valuation model or use external oracle data)
              investmentValue = buyerDetails.hasPaid
                ? buyerDetails.amountPaid
                : 0;

              // Simplified ROI calculation
              // In a real application, this would be based on current market value vs initial investment
              roi = 0; // 0% ROI for now
            }

            return {
              id: propertyDetails.id.toString(),
              title: `Property #${propertyDetails.id}`, // Would be fetched from metadata in a real app
              status: propertyDetails.status,
              price: propertyDetails.price,
              owner: propertyDetails.owner,
              sharePercentage: buyerDetails ? buyerDetails.sharePercentage : 0,
              amountPaid: buyerDetails ? buyerDetails.amountPaid : 0,
              hasPaid: buyerDetails ? buyerDetails.hasPaid : false,
              investmentValue,
              roi,
              createdAt: propertyDetails.createdAt.toNumber(),
              updatedAt: propertyDetails.updatedAt.toNumber(),
            };
          })
        );

        setInvestments(investmentsData);
      } catch (err) {
        console.error("Error fetching investments:", err);
        setError("Failed to load your investments. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvestments();
  }, [contract, address, isConnected]);

  // Apply status filter
  const filteredInvestments = investments.filter((investment) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active")
      return investment.status === 0 || investment.status === 1;
    if (statusFilter === "completed") return investment.status === 2;
    if (statusFilter === "pending") return !investment.hasPaid;
    return true;
  });

  // Calculate portfolio metrics
  const totalInvested = investments.reduce(
    (sum, investment) =>
      sum + (investment.hasPaid ? parseFloat(investment.amountPaid) : 0),
    0
  );
  const totalProperties = investments.length;
  const completedInvestments = investments.filter(
    (inv) => inv.status === 2
  ).length;
  const pendingPayments = investments.filter((inv) => !inv.hasPaid).length;

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaExclamationTriangle className="h-20 w-20 mx-auto text-yellow-500 mb-6 opacity-80" />
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Please connect your wallet to view your investments and track your
            portfolio performance.
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
          My Investments
        </h1>
        <p className="text-gray-400">
          Manage and track your real estate investments
        </p>
      </motion.div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SummaryCard
          title="Total Invested"
          value={formatCurrency(totalInvested)}
          gradient="bg-gradient-to-r from-teal-500 to-cyan-600"
          icon={<FaMoneyBillWave className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Properties"
          value={totalProperties}
          gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
          icon={<FaHome className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Completed"
          value={completedInvestments}
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
          icon={<FaCheckCircle className="h-6 w-6 text-white" />}
        />

        <SummaryCard
          title="Pending Payments"
          value={pendingPayments}
          gradient="bg-gradient-to-r from-yellow-500 to-amber-600"
          icon={<FaHourglassHalf className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Filter Controls */}
      <motion.div
        className="card p-4 sm:p-6 mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="font-medium text-gray-400">Filter by:</div>
          <div className="flex flex-wrap gap-3">
            <FilterButton
              active={statusFilter === "all"}
              label="All Investments"
              onClick={() => setStatusFilter("all")}
            />
            <FilterButton
              active={statusFilter === "active"}
              label="Active"
              onClick={() => setStatusFilter("active")}
            />
            <FilterButton
              active={statusFilter === "completed"}
              label="Completed"
              onClick={() => setStatusFilter("completed")}
            />
            <FilterButton
              active={statusFilter === "pending"}
              label="Pending Payment"
              onClick={() => setStatusFilter("pending")}
            />
          </div>
        </div>
      </motion.div>

      {/* Investments List */}
      {loading ? (
        <motion.div
          className="flex flex-col items-center justify-center p-16 bg-gray-800/30 rounded-xl border border-gray-700/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaSpinner className="h-10 w-10 text-teal-400 animate-spin mb-4" />
          <span className="text-gray-400 text-lg">
            Loading your investments...
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
            Error Loading Investments
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
      ) : filteredInvestments.length > 0 ? (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {filteredInvestments.map((investment, index) => (
            <motion.div
              key={investment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <InvestmentCard investment={investment} />
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
          <h3 className="text-xl font-semibold mb-3">No Investments Found</h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            {statusFilter !== "all"
              ? `You don't have any investments in the "${statusFilter}" category.`
              : "You haven't invested in any properties yet."}
          </p>
          <Link href="/marketplace">
            <motion.button
              className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Properties <FaArrowRight className="ml-2" />
            </motion.button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
