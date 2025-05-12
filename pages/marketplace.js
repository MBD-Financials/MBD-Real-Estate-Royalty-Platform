import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContract } from "../hooks/useContract";
import { useProperties } from "../hooks/useProperties";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatStatus,
  ipfsToHttp,
} from "../utils/contracts";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaMeh,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BiBuildingHouse } from "react-icons/bi";
import { AiOutlineSync } from "react-icons/ai";

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

// StatusFilter component
const StatusFilter = ({ active, count, label, onClick }) => (
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
    {label} ({count})
  </motion.button>
);

// Pagination Button component
const PaginationButton = ({ onClick, disabled, children }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md ${
      disabled
        ? "text-gray-600 cursor-not-allowed opacity-50"
        : "text-gray-400 hover:text-white hover:bg-gray-800/80"
    }`}
    whileHover={disabled ? {} : { scale: 1.1 }}
    whileTap={disabled ? {} : { scale: 0.9 }}
  >
    {children}
  </motion.button>
);

// Page Button component
const PageButton = ({ page, currentPage, onClick }) => (
  <motion.button
    onClick={() => onClick(page)}
    className={`w-9 h-9 flex items-center justify-center rounded-md ${
      currentPage === page
        ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold shadow-lg shadow-teal-500/20"
        : "text-gray-400 hover:text-white hover:bg-gray-800/80"
    }`}
    whileHover={currentPage === page ? {} : { scale: 1.1 }}
    whileTap={currentPage === page ? {} : { scale: 0.9 }}
  >
    {page}
  </motion.button>
);

export default function Marketplace() {
  const { isConnected } = useAccount();
  const { contract } = useContract();
  const [statusFilter, setStatusFilter] = useState(0); // 0 = Listed, 1 = Under Contract, 2 = Sold, 3 = Cancelled
  const [page, setPage] = useState(1);
  const limit = 9; // Number of properties per page

  // Custom hook to fetch properties with the current filters
  const { properties, loading, error, refetch } = useProperties(
    statusFilter,
    limit,
    (page - 1) * limit
  );

  // Stats for different property statuses
  const [stats, setStats] = useState({
    listed: 0,
    underContract: 0,
    sold: 0,
    cancelled: 0,
  });

  // Fetch stats when contract is available
  useEffect(() => {
    const fetchStats = async () => {
      if (!contract) return;

      try {
        const statistics = await contract.getContractStatistics();

        setStats({
          listed: statistics.listedProperties.toNumber(),
          sold: statistics.soldProperties.toNumber(),
          // For demo: estimate under contract and cancelled
          underContract: Math.floor(
            statistics.totalProperties.toNumber() * 0.1
          ),
          cancelled: Math.floor(statistics.totalProperties.toNumber() * 0.05),
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    if (contract) {
      fetchStats();
    }
  }, [contract]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate total pages
  const totalItems =
    statusFilter === 0
      ? stats.listed
      : statusFilter === 1
      ? stats.underContract
      : statusFilter === 2
      ? stats.sold
      : stats.cancelled;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Get pagination range
  const getPaginationRange = () => {
    const delta = 2; // Number of pages to show before and after current page
    let range = [];

    // Always include first page
    range.push(1);

    // Calculate start and end of range
    let start = Math.max(2, page - delta);
    let end = Math.min(totalPages - 1, page + delta);

    // Add dots after first page if needed
    if (start > 2) {
      range.push("...");
    }

    // Add all pages in the middle range
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add dots before last page if needed
    if (end < totalPages - 1) {
      range.push("...");
    }

    // Always include last page if it's not the first page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Marketplace
        </h1>
        <p className="text-gray-400">
          Browse available properties on the blockchain
        </p>
      </motion.div>

      {/* Filters and Stats */}
      <motion.div
        className="card p-4 sm:p-6 mb-8 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <StatusFilter
              active={statusFilter === 0}
              count={stats.listed}
              label="Listed"
              onClick={() => setStatusFilter(0)}
            />
            <StatusFilter
              active={statusFilter === 1}
              count={stats.underContract}
              label="Under Contract"
              onClick={() => setStatusFilter(1)}
            />
            <StatusFilter
              active={statusFilter === 2}
              count={stats.sold}
              label="Sold"
              onClick={() => setStatusFilter(2)}
            />
            <StatusFilter
              active={statusFilter === 3}
              count={stats.cancelled}
              label="Cancelled"
              onClick={() => setStatusFilter(3)}
            />
          </div>

          {/* Add Property Button */}
          {isConnected && (
            <Link href="/add-property" className="self-end sm:self-auto">
              <motion.button
                className="gradient-btn flex items-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlus className="h-4 w-4 mr-2" />
                List New Property
              </motion.button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
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
            <AiOutlineSync className="mr-2" /> Retry
          </motion.button>
        </motion.div>
      ) : properties.length > 0 ? (
        <>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {properties.map((property, index) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              className="flex justify-center mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <nav className="flex items-center space-x-2 p-2 bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/30">
                <PaginationButton
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <FaChevronLeft className="h-4 w-4" />
                </PaginationButton>

                {getPaginationRange().map((pageNum, index) =>
                  pageNum === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="text-gray-500 px-2"
                    >
                      ...
                    </span>
                  ) : (
                    <PageButton
                      key={`page-${pageNum}`}
                      page={pageNum}
                      currentPage={page}
                      onClick={handlePageChange}
                    />
                  )
                )}

                <PaginationButton
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  <FaChevronRight className="h-4 w-4" />
                </PaginationButton>
              </nav>
            </motion.div>
          )}
        </>
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
            {statusFilter === 0
              ? "There are no properties currently listed on the marketplace."
              : statusFilter === 1
              ? "There are no properties currently under contract."
              : statusFilter === 2
              ? "There are no sold properties to display."
              : "There are no cancelled property listings to display."}
          </p>
          {isConnected && statusFilter === 0 && (
            <Link href="/add-property">
              <motion.button
                className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlus className="mr-2" /> List Your Property
              </motion.button>
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
