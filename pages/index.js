import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContract } from "../hooks/useContract";
import { useProperties } from "../hooks/useProperties";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatStatus,
} from "../utils/contracts";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaHome,
  FaRegListAlt,
  FaHandshake,
  FaExchangeAlt,
  FaPlus,
  FaChevronRight,
  FaWallet,
  FaLock,
  FaMeh,
  FaMoneyBillWave,
  FaCertificate,
  FaShoppingCart,
} from "react-icons/fa";
import { BiBuildingHouse } from "react-icons/bi";
import { HiOutlineDocumentAdd } from "react-icons/hi";

// Dashboard card component with animation
const DashboardCard = ({ title, value, icon, gradient }) => (
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

// Property card component with animation
const PropertyCard = ({ property }) => (
  <Link href={`/property/${property.id}`} className="block h-full">
    <motion.div
      className="card hover:border-teal-500 transition-all duration-300 group cursor-pointer h-full flex flex-col bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden"
      whileHover={{
        y: -5,
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="relative rounded-t-lg overflow-hidden bg-gray-800 aspect-video">
        {property.images ? (
          <img
            src={property.images[0]}
            alt={property.title || `Property #${property.id}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-700 to-gray-800">
            <BiBuildingHouse className="h-16 w-16 text-gray-500" />
          </div>
        )}
        <div
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium ${
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
      </div>

      <div className="flex-1 flex flex-col p-5">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-teal-400 transition-colors">
          {property.title || `Property #${property.id}`}
        </h3>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {property.description || "No description available"}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500">Price</span>
              <p className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                {formatCurrency(property.price)}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-500">Owner</span>
              <p className="text-sm font-medium">
                {formatAddress(property.owner)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);

// QuickAction component
const QuickAction = ({ href, icon, title, gradient }) => (
  <Link href={href} className="block">
    <motion.div
      className="card hover:border-teal-500 transition-colors cursor-pointer p-5 h-full bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl"
      whileHover={{
        y: -3,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-center">
        <div
          className={`h-12 w-12 rounded-xl ${gradient} flex items-center justify-center mr-4 shadow-lg`}
        >
          {icon}
        </div>
        <span className="font-medium text-lg">{title}</span>
      </div>
    </motion.div>
  </Link>
);

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { contract, isReady } = useContract();
  const { properties, loading } = useProperties(0, 6, 0); // Get 6 latest listed properties

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTransactions: 0,
    listedProperties: 0,
    soldProperties: 0,
    listingFee: 0,
    purchaseFee: 0,
  });

  // Get dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!contract) return;

      try {
        const statistics = await contract.getContractStatistics();
        const listingFee = await contract.listingFee();
        const purchaseFee = await contract.purchaseFee();

        setStats({
          totalProperties: statistics.totalProperties.toNumber(),
          totalTransactions: statistics.totalTransactions.toNumber(),
          listedProperties: statistics.listedProperties.toNumber(),
          soldProperties: statistics.soldProperties.toNumber(),
          listingFee: listingFee,
          purchaseFee: purchaseFee.toNumber() / 100, // Convert basis points to percentage
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    if (contract) {
      fetchStats();
    }
  }, [contract]);

  console.log(properties);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Dashboard
        </h1>
        <p className="text-gray-400">Welcome to the Real Estate DApp!</p>
      </div>

      {!isConnected ? (
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaLock className="h-20 w-20 mx-auto text-gray-600 mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Please connect your wallet to access the full features of the Real
            Estate DApp and start exploring available properties.
          </p>
          <motion.button
            className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaWallet className="mr-2" /> Connect Wallet
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <DashboardCard
              title="Total Properties"
              value={stats.totalProperties}
              gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
              icon={<FaHome className="h-6 w-6 text-white" />}
            />

            <DashboardCard
              title="Listed Properties"
              value={stats.listedProperties}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              icon={<FaRegListAlt className="h-6 w-6 text-white" />}
            />

            <DashboardCard
              title="Sold Properties"
              value={stats.soldProperties}
              gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
              icon={<FaHandshake className="h-6 w-6 text-white" />}
            />

            <DashboardCard
              title="Total Transactions"
              value={stats.totalTransactions}
              gradient="bg-gradient-to-r from-pink-500 to-rose-600"
              icon={<FaExchangeAlt className="h-6 w-6 text-white" />}
            />
          </div>

          {/* Platform Info */}
          <motion.div
            className="card p-6 md:p-8 mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex flex-wrap gap-8 items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Listing Fee
                </h3>
                <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                  {formatCurrency(stats.listingFee)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Purchase Fee
                </h3>
                <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                  {stats.purchaseFee}%
                </p>
              </div>

              <div className="ml-auto mt-4 sm:mt-0">
                <Link href="/add-property">
                  <motion.button
                    className="gradient-btn flex items-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus className="mr-2" />
                    List New Property
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Recent Properties */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Recent Properties
              </h2>
              <Link
                href="/marketplace"
                className="text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center transition-colors group"
              >
                View All
                <FaChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="card animate-pulse bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gray-700 aspect-video rounded-t-lg"></div>
                    <div className="p-5">
                      <div className="h-6 bg-gray-700 rounded mb-3 w-2/3"></div>
                      <div className="h-4 bg-gray-700 rounded mb-2 w-full"></div>
                      <div className="h-4 bg-gray-700 rounded mb-6 w-4/5"></div>
                      <div className="pt-4 border-t border-gray-700/50">
                        <div className="flex justify-between">
                          <div>
                            <div className="h-3 bg-gray-700 rounded mb-2 w-16"></div>
                            <div className="h-5 bg-gray-700 rounded w-24"></div>
                          </div>
                          <div>
                            <div className="h-3 bg-gray-700 rounded mb-2 w-12"></div>
                            <div className="h-4 bg-gray-700 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <motion.div
                className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <FaMeh className="h-16 w-16 mx-auto text-gray-600 mb-5" />
                <h3 className="text-xl font-semibold mb-3">
                  No Properties Found
                </h3>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  No properties are currently listed on the marketplace. Be the
                  first to list your property!
                </p>
                <Link href="/add-property">
                  <motion.button
                    className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <HiOutlineDocumentAdd className="mr-2 h-5 w-5" /> List Your
                    First Property
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <QuickAction
                href="/my-properties"
                icon={<FaHome className="h-5 w-5 text-white" />}
                title="My Properties"
                gradient="bg-gradient-to-r from-teal-500 to-cyan-600"
              />

              <QuickAction
                href="/my-investments"
                icon={<FaMoneyBillWave className="h-5 w-5 text-white" />}
                title="My Investments"
                gradient="bg-gradient-to-r from-indigo-500 to-blue-600"
              />

              <QuickAction
                href="/royalties"
                icon={<FaCertificate className="h-5 w-5 text-white" />}
                title="Royalty Management"
                gradient="bg-gradient-to-r from-purple-500 to-pink-600"
              />

              <QuickAction
                href="/marketplace"
                icon={<FaShoppingCart className="h-5 w-5 text-white" />}
                title="Marketplace"
                gradient="bg-gradient-to-r from-amber-500 to-orange-600"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
