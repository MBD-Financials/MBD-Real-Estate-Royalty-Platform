import { useState } from "react";
import { useAccount } from "wagmi";
import { useMyProperties } from "../hooks/useMyProperties";
import { ethers } from "ethers";
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
  FaSearch,
  FaPlus,
  FaExclamationTriangle,
  FaMeh,
  FaSpinner,
  FaSyncAlt,
  FaEye,
  FaEdit,
  FaCalendarAlt,
  FaUsers,
  FaTag,
  FaWallet,
} from "react-icons/fa";
import { BiBuildingHouse } from "react-icons/bi";

// Property card component with animation
const PropertyCard = ({ property }) => (
  <motion.div
    className="card hover:border-teal-500 transition-all duration-300 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg"
    whileHover={{
      y: -5,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    }}
  >
    <div className="flex flex-col md:flex-row gap-5 p-5">
      <div className="md:w-1/3">
        <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video shadow-inner">
          {property.imageUrl ? (
            <img
              src={property.imageUrl}
              alt={property.title || `Property #${property.id}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-700 to-gray-800">
              <BiBuildingHouse className="h-16 w-16 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      <div className="md:w-2/3 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg mb-2 group-hover:text-teal-400 transition-colors bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              {property.title || `Property #${property.id}`}
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              {property.description || "No description available"}
            </p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              property.status === 0
                ? "bg-green-500/30 text-green-300"
                : property.status === 1
                ? "bg-yellow-500/30 text-yellow-300"
                : property.status === 2
                ? "bg-blue-500/30 text-blue-300"
                : "bg-red-500/30 text-red-300"
            } backdrop-blur-md border border-white/10 h-fit`}
          >
            {formatStatus(property.status)}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <div>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <FaTag className="mr-1.5 h-3 w-3" /> Price
              </div>
              <p className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                {formatCurrency(property.price)}
              </p>
            </div>

            <div>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <FaCalendarAlt className="mr-1.5 h-3 w-3" /> Created
              </div>
              <p className="text-sm font-medium text-gray-300">
                {formatDate(property.createdAt)}
              </p>
            </div>

            <div>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <FaUsers className="mr-1.5 h-3 w-3" /> Buyers
              </div>
              <p className="text-sm font-medium text-gray-300">
                {property.buyerCount}
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <Link href={`/property/${property.id}`} className="flex-1">
              <motion.button
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-lg transition flex items-center justify-center font-medium shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaEye className="mr-2 h-4 w-4" />
                View Details
              </motion.button>
            </Link>

            {property.status === 0 && (
              <Link href={`/edit-property/${property.id}`} className="flex-1">
                <motion.button
                  className="w-full py-2.5 px-4 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition flex items-center justify-center font-medium border border-white/5"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaEdit className="mr-2 h-4 w-4" />
                  Edit
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function MyProperties() {
  const { address, isConnected } = useAccount();
  const { properties, loading, error, refetch } = useMyProperties();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter properties based on search term
  const filteredProperties = properties.filter((property) => {
    const searchTermLower = searchTerm.toLowerCase();
    const propertyTitle = `Property #${property.id}`.toLowerCase();

    return propertyTitle.includes(searchTermLower);
  });

  // Transform properties for display with proper BigNumber handling
  const enhancedProperties = filteredProperties.map((property) => {
    // Convert any BigNumber values to regular numbers or strings
    const parsedProperty = {
      ...property,
      id: property.id ? property.id.toString() : "",
      price:
        property.price && property.price._isBigNumber
          ? ethers.utils.formatEther(property.price)
          : property.price,
      buyerCount:
        property.buyerCount && property.buyerCount._isBigNumber
          ? property.buyerCount.toNumber()
          : property.buyerCount,
      createdAt:
        property.createdAt && property.createdAt._isBigNumber
          ? property.createdAt.toNumber()
          : property.createdAt,
      updatedAt:
        property.updatedAt && property.updatedAt._isBigNumber
          ? property.updatedAt.toNumber()
          : property.updatedAt,
      status: property.status !== undefined ? Number(property.status) : 0,
    };

    // Add UI-specific fields
    return {
      ...parsedProperty,
      title: `${parsedProperty.title}`,
      description: `${parsedProperty.description}`,
    };
  });

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
            Please connect your wallet to view and manage your listed
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
          My Properties
        </h1>
        <p className="text-gray-400">
          Manage your real estate properties on the blockchain
        </p>
      </motion.div>

      {/* Actions Bar */}
      <motion.div
        className="card p-4 sm:p-6 mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto flex-grow md:max-w-xs">
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full px-4 py-2.5 pl-10 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Link href="/add-property">
            <motion.button
              className="gradient-btn w-full sm:w-auto flex items-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus className="h-4 w-4 mr-2" />
              List New Property
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Properties List */}
      {loading ? (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="card animate-pulse bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden p-5"
            >
              <div className="flex flex-col md:flex-row gap-5">
                <div className="md:w-1/3">
                  <div className="bg-gray-700 aspect-video rounded-lg"></div>
                </div>
                <div className="md:w-2/3">
                  <div className="h-6 bg-gray-700 rounded mb-3 w-1/2"></div>
                  <div className="h-4 bg-gray-700 rounded mb-5 w-full"></div>

                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <div className="h-3 bg-gray-700 rounded mb-1 w-16"></div>
                        <div className="h-5 bg-gray-700 rounded w-24"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-700 rounded mb-1 w-16"></div>
                        <div className="h-5 bg-gray-700 rounded w-24"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-700 rounded mb-1 w-16"></div>
                        <div className="h-5 bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-10 bg-gray-700 rounded w-full"></div>
                      <div className="h-10 bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            onClick={refetch}
            className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSyncAlt className="mr-2" /> Retry
          </motion.button>
        </motion.div>
      ) : enhancedProperties.length > 0 ? (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {enhancedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <PropertyCard property={property} />
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
          <h3 className="text-xl font-semibold mb-3">No Properties Found</h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            You haven't listed any properties on the marketplace yet.
          </p>
          <Link href="/add-property">
            <motion.button
              className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus className="mr-2" /> List Your First Property
            </motion.button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
