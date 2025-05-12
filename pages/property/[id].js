import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useContract } from "../../hooks/useContract";
import { useProperty } from "../../hooks/useProperty";
import { useTransactions } from "../../hooks/useTransactions";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatStatus,
  bpsToPercentage,
  ipfsToHttp,
} from "../../utils/contracts";
import { ethers } from "ethers";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaUser,
  FaMoneyBillWave,
  FaBolt,
  FaHome,
  FaExclamationTriangle,
  FaPencilAlt,
  FaTimesCircle,
  FaArrowLeft,
  FaCheck,
  FaCalendarAlt,
  FaUsers,
  FaTag,
  FaFileContract,
  FaHistory,
  FaInfoCircle,
  FaLongArrowAltRight,
  FaCheckCircle,
  FaRegClock,
  FaPercentage,
  FaCertificate,
  FaBuilding,
  FaTimes,
  FaSpinner,
  FaDollarSign,
  FaWallet,
} from "react-icons/fa";

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { address, isConnected } = useAccount();
  const { contract, writeContract } = useContract();
  const {
    property,
    metadata,
    royaltyHolders,
    buyers,
    loading,
    error,
    refetch,
  } = useProperty(id);
  const { transactions } = useTransactions(id, 5, 0);
  console.log(metadata);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [sharePercentage, setSharePercentage] = useState(100);
  const [isOwner, setIsOwner] = useState(false);
  const [isRoyaltyHolder, setIsRoyaltyHolder] = useState(false);
  const [isBuyer, setIsBuyer] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [newBuyerAddress, setNewBuyerAddress] = useState("");
  const [newBuyerPercentage, setNewBuyerPercentage] = useState(100);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Check user roles when property and address change
  useEffect(() => {
    if (property && address) {
      // Check if current user is the owner
      setIsOwner(address.toLowerCase() === property.owner.toLowerCase());

      // Check if current user is a royalty holder
      const royaltyHolder = royaltyHolders.find(
        (holder) => holder.address.toLowerCase() === address.toLowerCase()
      );
      setIsRoyaltyHolder(!!royaltyHolder);

      // Check if current user is a buyer
      const buyer = buyers.find(
        (buyer) => buyer.address.toLowerCase() === address.toLowerCase()
      );
      setIsBuyer(!!buyer);
      if (buyer) {
        setBuyerDetails(buyer);
      }
    }
  }, [property, address, royaltyHolders, buyers]);

  // Handle property status change
  const handlePropertyStatusChange = async (newStatus) => {
    if (!isConnected || !property) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      let transaction;

      if (newStatus === "cancel") {
        transaction = await contractWithSigner.cancelListing(id);
      } else {
        throw new Error("Invalid status change");
      }

      await transaction.wait();

      setSuccessMessage(`Property status updated successfully!`);
      refetch();
    } catch (error) {
      console.error("Error updating property status:", error);
      setErrorMessage(error.message || "Failed to update property status");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle royalty approval
  const handleApproveRoyalty = async () => {
    if (!isConnected || !property) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      const transaction = await contractWithSigner.approvePropertySale(id);
      await transaction.wait();

      setSuccessMessage("You have approved this property sale!");
      refetch();
    } catch (error) {
      console.error("Error approving property sale:", error);
      setErrorMessage(error.message || "Failed to approve property sale");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a buyer
  const handleAddBuyer = async (e) => {
    e.preventDefault();
    if (!isConnected || !property) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Validate inputs
      if (!newBuyerAddress || !newBuyerPercentage) {
        throw new Error("Please fill all required fields");
      }

      if (!ethers.utils.isAddress(newBuyerAddress)) {
        throw new Error("Invalid buyer address");
      }

      if (newBuyerPercentage <= 0 || newBuyerPercentage > 100) {
        throw new Error("Share percentage must be between 0 and 100");
      }

      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      // Convert percentage to basis points (10000 = 100%)
      const sharePercentageBps = Math.floor(newBuyerPercentage * 100);

      const transaction = await contractWithSigner.addBuyer(
        id,
        newBuyerAddress,
        sharePercentageBps
      );

      await transaction.wait();

      setSuccessMessage("Buyer added successfully!");
      setNewBuyerAddress("");
      setNewBuyerPercentage(100);
      refetch();
    } catch (error) {
      console.error("Error adding buyer:", error);
      setErrorMessage(error.message || "Failed to add buyer");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle buying a property share
  const handleBuyShare = async () => {
    if (!isConnected || !property) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Ensure user is a buyer for this property
      if (!isBuyer) {
        throw new Error("You are not registered as a buyer for this property");
      }

      // Ensure buyer hasn't already paid
      if (buyerDetails.hasPaid) {
        throw new Error("You have already paid for your share");
      }

      // Check if all royalty holders have approved
      const allApproved = await contract.areAllApprovalsInPlace(id);
      if (!allApproved) {
        throw new Error("Not all royalty holders have approved the sale yet");
      }

      // Get payment details
      const buyerIndex = buyers.findIndex(
        (buyer) => buyer.address.toLowerCase() === address.toLowerCase()
      );

      const paymentDetails = await contract.getSharePaymentDetails(
        id,
        buyerIndex
      );
      const totalAmount = paymentDetails.totalAmount;

      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      const transaction = await contractWithSigner.buyPropertyShare(id, {
        value: totalAmount,
      });

      await transaction.wait();

      setSuccessMessage("Property share purchased successfully!");
      refetch();
    } catch (error) {
      console.error("Error buying property share:", error);
      setErrorMessage(error.message || "Failed to buy property share");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image gallery navigation
  const handleNextImage = () => {
    if (propertyImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const handlePrevImage = () => {
    if (propertyImages.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? propertyImages.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-800/70 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="aspect-video bg-gray-800/70 rounded-xl"></div>
              <div className="h-8 bg-gray-800/70 rounded-lg w-1/2"></div>
              <div className="h-4 bg-gray-800/70 rounded-lg w-full"></div>
              <div className="h-4 bg-gray-800/70 rounded-lg w-full"></div>
              <div className="h-4 bg-gray-800/70 rounded-lg w-3/4"></div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          className="card p-10 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaExclamationTriangle className="h-16 w-16 mx-auto text-red-500 mb-6 opacity-80" />
          <h2 className="text-2xl font-semibold mb-3">Property Not Found</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            {error ||
              "The property you are looking for does not exist or has been removed."}
          </p>
          <Link href="/marketplace">
            <motion.button
              className="gradient-btn mx-auto flex items-center justify-center px-6 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft className="mr-2" /> Back to Marketplace
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Format property data for display
  const propertyTitle = metadata?.title || `Property #${property.id}`;
  const propertyDescription =
    metadata?.description || "No description available";
  const propertyLocation = metadata?.location || "Location not specified";
  const propertyImages = metadata?.images || [];

  // Badge component for status display
  const StatusBadge = ({ status, className = "" }) => {
    let bgColor, textColor;
    switch (status) {
      case 0:
        bgColor = "bg-green-500/30";
        textColor = "text-green-300";
        break;
      case 1:
        bgColor = "bg-yellow-500/30";
        textColor = "text-yellow-300";
        break;
      case 2:
        bgColor = "bg-blue-500/30";
        textColor = "text-blue-300";
        break;
      default:
        bgColor = "bg-red-500/30";
        textColor = "text-red-300";
    }

    return (
      <div
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${bgColor} ${textColor} backdrop-blur-md border border-white/10 ${className}`}
      >
        {formatStatus(status)}
      </div>
    );
  };

  // Tab button component
  const TabButton = ({ name, label, icon }) => (
    <motion.button
      className={`py-4 px-4 font-medium text-sm border-b-2 flex items-center ${
        activeTab === name
          ? "border-teal-400 text-teal-400"
          : "border-transparent text-gray-400 hover:text-gray-300"
      }`}
      onClick={() => setActiveTab(name)}
      whileHover={activeTab !== name ? { y: -2 } : {}}
      whileTap={activeTab !== name ? { y: 0 } : {}}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </motion.button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <Link
            href="/marketplace"
            className="text-gray-400 hover:text-teal-400 transition-colors"
          >
            Marketplace
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300">Property Details</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          {propertyTitle}
        </h1>
        <div className="flex items-center text-gray-400">
          <FaMapMarkerAlt className="mr-1.5 text-teal-400" />
          <p>{propertyLocation}</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            className="bg-red-500/20 border border-red-500/30 text-red-400 p-5 rounded-xl mb-8 shadow-lg backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
      </AnimatePresence>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="bg-green-500/20 border border-green-500/30 text-green-400 p-5 rounded-xl mb-8 shadow-lg backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Property Image Gallery */}
          <div className="rounded-xl overflow-hidden bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 shadow-lg mb-6 relative group">
            <div className="aspect-video">
              {propertyImages.length > 0 ? (
                <img
                  src={ipfsToHttp(propertyImages[currentImageIndex])}
                  alt={propertyTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-800 to-gray-900">
                  <FaBuilding className="h-20 w-20 text-gray-600" />
                </div>
              )}
            </div>

            {propertyImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaArrowLeft />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaLongArrowAltRight />
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {propertyImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full ${
                        currentImageIndex === index
                          ? "bg-white"
                          : "bg-white/50 hover:bg-white/80"
                      } transition-colors`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-4 left-4">
              <StatusBadge status={property.status} />
            </div>
          </div>

          {/* Image thumbnails if there are multiple images */}
          {propertyImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mb-6">
              {propertyImages.map((image, index) => (
                <motion.div
                  key={index}
                  className={`rounded-lg overflow-hidden aspect-video cursor-pointer ${
                    currentImageIndex === index
                      ? "ring-2 ring-teal-400"
                      : "opacity-70 hover:opacity-100"
                  } transition-all`}
                  onClick={() => setCurrentImageIndex(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={ipfsToHttp(image)}
                    alt={`${propertyTitle} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Property Status Display */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center text-gray-400 text-sm bg-gray-800/30 px-3 py-1.5 rounded-lg">
              <FaCalendarAlt className="mr-1.5 text-teal-400" />
              Listed on {formatDate(property.createdAt)}
            </div>
            <div className="flex items-center text-gray-400 text-sm bg-gray-800/30 px-3 py-1.5 rounded-lg">
              <FaUsers className="mr-1.5 text-teal-400" />
              {property.buyerCount} Buyer{property.buyerCount !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-800/50 mb-6">
            <nav className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <TabButton
                name="details"
                label="Details"
                icon={<FaInfoCircle className="h-4 w-4 text-current" />}
              />
              <TabButton
                name="royalties"
                label="Royalties"
                icon={<FaCertificate className="h-4 w-4 text-current" />}
              />
              <TabButton
                name="buyers"
                label="Buyers"
                icon={<FaUsers className="h-4 w-4 text-current" />}
              />
              <TabButton
                name="transactions"
                label="History"
                icon={<FaHistory className="h-4 w-4 text-current" />}
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {/* Details Tab */}
            {activeTab === "details" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 bg-gray-800/30 rounded-xl p-6 border border-gray-800/40">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <FaInfoCircle className="mr-2 text-teal-400" />
                    Property Description
                  </h2>
                  <p className="text-gray-300 whitespace-pre-line">
                    {propertyDescription}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FaTag className="mr-2 text-teal-400" />
                    Property Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800/20 p-6 rounded-xl border border-gray-800/30">
                    <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                      <FaMapMarkerAlt className="h-5 w-5 text-teal-400" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Location
                        </div>
                        <div className="text-gray-300">{propertyLocation}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                      <FaUser className="h-5 w-5 text-teal-400" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Owner</div>
                        <div className="text-gray-300 font-mono">
                          {formatAddress(property.owner)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                      <FaMoneyBillWave className="h-5 w-5 text-teal-400" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Price</div>
                        <div className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                          {formatCurrency(property.price)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                      <FaBolt className="h-5 w-5 text-teal-400" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Property ID
                        </div>
                        <div className="text-gray-300 font-mono">
                          {property.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {metadata?.bedrooms || metadata?.bathrooms || metadata?.area ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaHome className="mr-2 text-teal-400" />
                      Additional Specifications
                    </h3>
                    <div className="grid grid-cols-3 gap-4 bg-gray-800/20 p-6 rounded-xl border border-gray-800/30">
                      {metadata?.bedrooms && (
                        <div className="text-center p-4 bg-gray-800/40 rounded-lg">
                          <div className="text-2xl font-bold text-white mb-1">
                            {metadata.bedrooms}
                          </div>
                          <div className="text-xs text-gray-400">Bedrooms</div>
                        </div>
                      )}
                      {metadata?.bathrooms && (
                        <div className="text-center p-4 bg-gray-800/40 rounded-lg">
                          <div className="text-2xl font-bold text-white mb-1">
                            {metadata.bathrooms}
                          </div>
                          <div className="text-xs text-gray-400">Bathrooms</div>
                        </div>
                      )}
                      {metadata?.area && (
                        <div className="text-center p-4 bg-gray-800/40 rounded-lg">
                          <div className="text-2xl font-bold text-white mb-1">
                            {metadata.area}
                          </div>
                          <div className="text-xs text-gray-400">Sq. Ft.</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FaFileContract className="mr-2 text-teal-400" />
                    Contract Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-800/20 p-6 rounded-xl border border-gray-800/30">
                    <div className="flex flex-col bg-gray-800/40 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">
                        Listed On
                      </div>
                      <div className="text-gray-300 font-medium">
                        {formatDate(property.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-col bg-gray-800/40 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">
                        Last Updated
                      </div>
                      <div className="text-gray-300 font-medium">
                        {formatDate(property.updatedAt)}
                      </div>
                    </div>
                    <div className="flex flex-col bg-gray-800/40 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">
                        Royalty Holders
                      </div>
                      <div className="text-gray-300 font-medium">
                        {property.royaltyHolderCount}
                      </div>
                    </div>
                    <div className="flex flex-col bg-gray-800/40 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">
                        Potential Buyers
                      </div>
                      <div className="text-gray-300 font-medium">
                        {property.buyerCount}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Royalties Tab */}
            {activeTab === "royalties" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 bg-gray-800/30 rounded-xl p-6 border border-gray-800/40">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <FaCertificate className="mr-2 text-teal-400" />
                    Royalty Distribution
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Royalty holders receive a percentage of the sale price each
                    time the property is resold, creating a passive income
                    stream for original holders.
                  </p>
                </div>

                {royaltyHolders.length > 0 ? (
                  <div className="bg-gray-800/20 rounded-xl overflow-hidden border border-gray-700/50 shadow-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-800/50">
                        <thead className="bg-gray-800/40">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Address
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Percentage
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 bg-gray-800/10">
                          {royaltyHolders.map((holder, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-200 font-mono">
                                  {formatAddress(holder.address)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300 font-medium">
                                  <span className="flex items-center">
                                    <FaPercentage className="h-3 w-3 mr-1 text-teal-400" />
                                    {bpsToPercentage(holder.percentage)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {holder.hasApproved ? (
                                  <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-500/30 text-green-300 border border-green-500/30">
                                    <FaCheckCircle className="mr-1" /> Approved
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">
                                    <FaRegClock className="mr-1" /> Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/40 mb-6">
                    <FaInfoCircle className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-2">
                      This property does not have any royalty holders.
                    </p>
                    <p className="text-sm text-gray-500">
                      Royalty holders are entitled to receive a percentage of
                      future sales.
                    </p>
                  </div>
                )}

                {/* Royalty holder approval UI */}
                {isRoyaltyHolder &&
                  !royaltyHolders.find(
                    (h) => h.address.toLowerCase() === address.toLowerCase()
                  )?.hasApproved && (
                    <motion.div
                      className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-lg font-bold mb-3 flex items-center">
                        <FaCertificate className="mr-2 text-yellow-400" />
                        Approval Required
                      </h3>
                      <p className="text-gray-300 mb-4">
                        As a royalty holder, you need to approve this property
                        sale before buyers can complete their purchase.
                      </p>
                      <p className="text-sm text-gray-400 mb-6">
                        By approving, you acknowledge that you'll receive your
                        royalty percentage on this and future sales.
                      </p>
                      <motion.button
                        onClick={handleApproveRoyalty}
                        className="gradient-btn flex items-center justify-center px-5 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg w-full sm:w-auto"
                        disabled={isLoading}
                        whileHover={isLoading ? {} : { scale: 1.03 }}
                        whileTap={isLoading ? {} : { scale: 0.97 }}
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="mr-2 h-5 w-5" />
                            Approve Sale
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
              </motion.div>
            )}

            {/* Buyers Tab */}
            {activeTab === "buyers" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 bg-gray-800/30 rounded-xl p-6 border border-gray-800/40">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <FaUsers className="mr-2 text-teal-400" />
                    Property Buyers
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Buyers can purchase shares of the property based on their
                    designated percentage. All royalty holders must approve the
                    sale before buyers can complete their purchase.
                  </p>
                </div>

                {buyers.length > 0 ? (
                  <div className="bg-gray-800/20 rounded-xl overflow-hidden border border-gray-700/50 shadow-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-800/50">
                        <thead className="bg-gray-800/40">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Address
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Share
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Amount
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 bg-gray-800/10">
                          {buyers.map((buyer, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-200 font-mono">
                                  {formatAddress(buyer.address)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300 font-medium">
                                  <span className="flex items-center">
                                    <FaPercentage className="h-3 w-3 mr-1 text-teal-400" />
                                    {bpsToPercentage(buyer.sharePercentage)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300">
                                  {buyer.hasPaid
                                    ? formatCurrency(buyer.amountPaid)
                                    : "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {buyer.hasPaid ? (
                                  <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-500/30 text-green-300 border border-green-500/30">
                                    <FaCheckCircle className="mr-1" /> Paid
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">
                                    <FaRegClock className="mr-1" /> Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/40 mb-6">
                    <FaInfoCircle className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-2">
                      This property does not have any buyers yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      The property owner can add buyers who can then purchase
                      shares.
                    </p>
                  </div>
                )}

                {/* Add a buyer UI (for owner only) */}
                {isOwner &&
                  property.status === 0 &&
                  property.buyerCount < 3 && (
                    <motion.div
                      className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-lg font-bold mb-3 flex items-center">
                        <FaUsers className="mr-2 text-teal-400" />
                        Add a Buyer
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Add a buyer to allow them to purchase a share of this
                        property.
                      </p>
                      <form onSubmit={handleAddBuyer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="buyerAddress"
                              className="block text-sm font-medium text-gray-400 mb-1.5"
                            >
                              Buyer Address{" "}
                              <span className="text-teal-400">*</span>
                            </label>
                            <div className="relative">
                              <FaWallet className="absolute top-3 left-3 text-gray-500" />
                              <input
                                type="text"
                                id="buyerAddress"
                                value={newBuyerAddress}
                                onChange={(e) =>
                                  setNewBuyerAddress(e.target.value)
                                }
                                className="w-full px-4 py-2.5 pl-10 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
                                placeholder="0x..."
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="sharePercentage"
                              className="block text-sm font-medium text-gray-400 mb-1.5"
                            >
                              Share Percentage{" "}
                              <span className="text-teal-400">*</span>
                            </label>
                            <div className="relative">
                              <FaPercentage className="absolute top-3 left-3 text-gray-500" />
                              <input
                                type="number"
                                id="sharePercentage"
                                value={newBuyerPercentage}
                                onChange={(e) =>
                                  setNewBuyerPercentage(
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="w-full px-4 py-2.5 pl-10 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
                                placeholder="e.g. 100"
                                min="1"
                                max="100"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <motion.button
                          type="submit"
                          className="gradient-btn flex items-center justify-center px-5 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg w-full md:w-auto"
                          disabled={isLoading}
                          whileHover={isLoading ? {} : { scale: 1.03 }}
                          whileTap={isLoading ? {} : { scale: 0.97 }}
                        >
                          {isLoading ? (
                            <>
                              <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FaUsers className="mr-2 h-5 w-5" />
                              Add Buyer
                            </>
                          )}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}

                {/* Buy property UI (for buyers only) */}
                {isBuyer && buyerDetails && !buyerDetails.hasPaid && (
                  <motion.div
                    className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                      <FaDollarSign className="mr-2 text-green-400" />
                      Complete Your Purchase
                    </h3>
                    <p className="text-gray-300 mb-4">
                      You have been added as a buyer for this property with a{" "}
                      <span className="text-teal-400 font-semibold">
                        {bpsToPercentage(buyerDetails.sharePercentage)}
                      </span>{" "}
                      share. Complete your purchase by paying for your share.
                    </p>

                    {/* Show approval status */}
                    <div className="mb-6 bg-gray-800/40 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <FaCertificate className="mr-2 text-teal-400" />
                        Royalty Holder Approvals:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {royaltyHolders.map((holder, index) => (
                          <div
                            key={index}
                            className={`px-3 py-1.5 rounded-lg flex items-center text-xs font-medium ${
                              holder.hasApproved
                                ? "bg-green-500/30 text-green-300 border border-green-500/30"
                                : "bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                            }`}
                          >
                            {holder.hasApproved ? (
                              <FaCheckCircle className="mr-1.5" />
                            ) : (
                              <FaRegClock className="mr-1.5" />
                            )}
                            {formatAddress(holder.address)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      onClick={handleBuyShare}
                      className="gradient-btn flex items-center justify-center px-5 py-3 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg w-full sm:w-auto"
                      disabled={
                        isLoading || !royaltyHolders.every((h) => h.hasApproved)
                      }
                      whileHover={
                        isLoading || !royaltyHolders.every((h) => h.hasApproved)
                          ? {}
                          : { scale: 1.03 }
                      }
                      whileTap={
                        isLoading || !royaltyHolders.every((h) => h.hasApproved)
                          ? {}
                          : { scale: 0.97 }
                      }
                    >
                      {isLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaDollarSign className="mr-2 h-5 w-5" />
                          Pay for Your Share
                        </>
                      )}
                    </motion.button>

                    {!royaltyHolders.every((h) => h.hasApproved) && (
                      <div className="mt-4 p-4 bg-yellow-500/10 text-yellow-300 rounded-lg flex items-start">
                        <FaExclamationTriangle className="flex-shrink-0 mt-0.5 mr-2" />
                        <p className="text-sm">
                          All royalty holders must approve the sale before you
                          can purchase your share. Please check back later.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 bg-gray-800/30 rounded-xl p-6 border border-gray-800/40">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <FaHistory className="mr-2 text-teal-400" />
                    Transaction History
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Track all transactions related to this property, including
                    listings, purchases, and royalty payments.
                  </p>
                </div>

                {transactions.length > 0 ? (
                  <div className="bg-gray-800/20 rounded-xl overflow-hidden border border-gray-700/50 shadow-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-800/50">
                        <thead className="bg-gray-800/40">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Type
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              From
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              To
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Amount
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 bg-gray-800/10">
                          {transactions.map((tx, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white bg-gradient-to-r from-teal-400/20 to-blue-400/20 px-3 py-1 rounded-lg inline-block">
                                  {tx.transactionType}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300 font-mono">
                                  {formatAddress(tx.from)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300 font-mono">
                                  {formatAddress(tx.to)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-teal-300">
                                  {formatCurrency(tx.amount)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300">
                                  {formatDate(tx.timestamp)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/40 mb-6">
                    <FaInfoCircle className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-2">
                      No transaction history available for this property.
                    </p>
                    <p className="text-sm text-gray-500">
                      Transaction records will appear here once the property has
                      activity.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Price Card */}
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg sticky top-24">
            <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
              <h3 className="text-2xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                {formatCurrency(property.price)}
              </h3>
              <p className="text-gray-400 text-sm flex items-center">
                <FaTag className="mr-1.5 text-teal-400" />
                Property Price
              </p>
            </div>

            <div className="p-6">
              {/* Owner Actions */}
              {isOwner && property.status === 0 && (
                <div className="space-y-4">
                  <Link href={`/edit-property/${property.id}`}>
                    <motion.button
                      className="w-full py-3 px-4 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition flex items-center justify-center text-white font-medium border border-white/5 shadow-md"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FaPencilAlt className="h-4 w-4 mr-2" />
                      Edit Property
                    </motion.button>
                  </Link>

                  <motion.button
                    onClick={() => handlePropertyStatusChange("cancel")}
                    className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition flex items-center justify-center font-medium border border-red-500/20"
                    disabled={isLoading}
                    whileHover={isLoading ? {} : { scale: 1.03 }}
                    whileTap={isLoading ? {} : { scale: 0.97 }}
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="h-4 w-4 mr-2" />
                        Cancel Listing
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Buyer Actions */}
              {!isOwner && !isBuyer && property.status === 0 && (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Interested in this property?
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Contact the owner to be added as a buyer.
                  </p>

                  <div className="p-4 mb-6 bg-gray-800/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-400">Owner:</span>
                    <span className="text-sm font-medium font-mono text-gray-300">
                      {formatAddress(property.owner)}
                    </span>
                  </div>

                  <Link href={`/marketplace`}>
                    <motion.button
                      className="gradient-btn w-full py-3 flex items-center justify-center px-5 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FaArrowLeft className="mr-2 h-4 w-4" />
                      Back to Marketplace
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Property Status Info */}
              {property.status !== 0 && (
                <div className="text-center">
                  <div
                    className={`py-4 px-4 rounded-lg mb-6 ${
                      property.status === 1
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : property.status === 2
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    <p className="font-medium flex items-center justify-center">
                      {property.status === 1 ? (
                        <FaRegClock className="mr-2" />
                      ) : property.status === 2 ? (
                        <FaCheckCircle className="mr-2" />
                      ) : (
                        <FaTimesCircle className="mr-2" />
                      )}
                      This property is{" "}
                      {formatStatus(property.status).toLowerCase()}
                    </p>
                  </div>

                  <Link href={`/marketplace`}>
                    <motion.button
                      className="gradient-btn w-full py-3 flex items-center justify-center px-5 font-medium rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FaArrowLeft className="mr-2 h-4 w-4" />
                      Back to Marketplace
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
