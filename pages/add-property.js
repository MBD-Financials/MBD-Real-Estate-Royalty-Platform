import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useContract } from "../hooks/useContract";
import { ethers } from "ethers";
import { createAndUploadPropertyMetadata } from "../utils/pinata";
import { motion } from "framer-motion";
import {
  FaUpload,
  FaSpinner,
  FaImage,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHome,
  FaWallet,
  FaTimes,
  FaPlus,
  FaTrash,
  FaInfoCircle,
  FaArrowLeft,
  FaBuilding,
  FaMapMarkerAlt,
  FaEthereum,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaUsersCog,
} from "react-icons/fa";

// Custom Input component
const FormInput = ({
  label,
  id,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  min,
  max,
  step,
  className = "",
  children,
}) => (
  <div className={className}>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-400 mb-1.5"
    >
      {label} {required && <span className="text-teal-400">*</span>}
    </label>
    {children || (
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
      />
    )}
  </div>
);

export default function AddProperty() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { contract, writeContract, isReady } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [listingFee, setListingFee] = useState("0");

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    propertyType: "Residential",
    bedrooms: "",
    bathrooms: "",
    area: "",
    royaltyHolders: [{ address: "", percentage: "" }],
  });

  // Images state
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // Fetch listing fee from contract
  useEffect(() => {
    const fetchListingFee = async () => {
      if (contract) {
        try {
          const fee = await contract.listingFee();
          setListingFee(ethers.utils.formatEther(fee));
        } catch (error) {
          console.error("Error fetching listing fee:", error);
        }
      }
    };

    if (contract) {
      fetchListingFee();
    }
  }, [contract]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle royalty holder input changes
  const handleRoyaltyChange = (index, field, value) => {
    const updatedRoyaltyHolders = [...formData.royaltyHolders];
    updatedRoyaltyHolders[index] = {
      ...updatedRoyaltyHolders[index],
      [field]: value,
    };
    setFormData({ ...formData, royaltyHolders: updatedRoyaltyHolders });
  };

  // Add royalty holder
  const addRoyaltyHolder = () => {
    if (formData.royaltyHolders.length < 3) {
      setFormData({
        ...formData,
        royaltyHolders: [
          ...formData.royaltyHolders,
          { address: "", percentage: "" },
        ],
      });
    }
  };

  // Remove royalty holder
  const removeRoyaltyHolder = (index) => {
    const updatedRoyaltyHolders = [...formData.royaltyHolders];
    updatedRoyaltyHolders.splice(index, 1);
    setFormData({ ...formData, royaltyHolders: updatedRoyaltyHolders });
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Limit to 5 images
    const selectedFiles = files.slice(0, 5);

    // Update file state
    setImages((prevImages) => [...prevImages, ...selectedFiles].slice(0, 5));

    // Create preview URLs
    const newPreviewUrls = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewImages((prevUrls) =>
      [...prevUrls, ...newPreviewUrls].slice(0, 5)
    );
  };

  // Remove image
  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setPreviewImages((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setErrorMessage("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Validate form data
      if (
        !formData.title ||
        !formData.description ||
        !formData.location ||
        !formData.price
      ) {
        throw new Error("Please fill all required fields");
      }

      // Validate royalty holders
      let totalRoyalty = 0;
      const royaltyAddresses = [];
      const royaltyPercentages = [];

      formData.royaltyHolders.forEach((holder, index) => {
        if (holder.address && holder.percentage) {
          if (!ethers.utils.isAddress(holder.address)) {
            throw new Error(`Invalid address for royalty holder ${index + 1}`);
          }

          const percentage = parseFloat(holder.percentage);
          if (isNaN(percentage) || percentage <= 0 || percentage > 50) {
            throw new Error(
              `Royalty percentage must be between 0 and 50 for holder ${
                index + 1
              }`
            );
          }

          totalRoyalty += percentage;
          royaltyAddresses.push(holder.address);
          // Convert percentage to basis points (100 = 1%)
          royaltyPercentages.push(Math.floor(percentage * 100));
        }
      });

      if (totalRoyalty > 50) {
        throw new Error("Total royalty percentage cannot exceed 50%");
      }

      // Check if we have images
      if (images.length === 0) {
        throw new Error("Please upload at least one image of the property");
      }

      // Upload images and metadata to IPFS via Pinata
      setUploadingFiles(true);
      const propertyMetadata = await createAndUploadPropertyMetadata(
        formData,
        images
      );
      setUploadingFiles(false);

      if (!propertyMetadata.success) {
        throw new Error(
          propertyMetadata.message || "Failed to upload property data to IPFS"
        );
      }

      // Get the contract with signer
      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(formData.price.toString());

      // Get listing fee
      const listingFeeWei = await contract.listingFee();

      // List the property
      const transaction = await contractWithSigner.listProperty(
        propertyMetadata.metadataUri,
        priceInWei,
        royaltyAddresses,
        royaltyPercentages,
        { value: listingFeeWei }
      );

      // Wait for transaction to be mined
      await transaction.wait();

      setSuccessMessage("Property listed successfully!");

      // Redirect to my properties page after successful listing
      setTimeout(() => {
        router.push("/my-properties");
      }, 2000);
    } catch (error) {
      console.error("Error listing property:", error);
      setErrorMessage(
        error.message || "Failed to list property. Please try again."
      );
    } finally {
      setIsLoading(false);
      setUploadingFiles(false);
    }
  };

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
            Please connect your wallet to list a property on the marketplace.
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
          List a New Property
        </h1>
        <p className="text-gray-400">
          Fill in the details to list your property on the blockchain
          marketplace.
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

      <motion.form
        onSubmit={handleSubmit}
        className="card bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Left Column */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              <FaHome className="mr-2 text-teal-400" />
              Property Details
            </h2>

            <FormInput
              label="Property Title"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Luxury Apartment in Downtown"
              required
            />

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Description <span className="text-teal-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200 resize-none"
                placeholder="Describe your property in detail..."
                required
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <FormInput
                label="Location"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. New York, NY"
                required
                className="flex-1"
                icon={<FaMapMarkerAlt />}
              />

              <FormInput
                label="Price (ETH)"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 10.5"
                type="number"
                step="0.0001"
                min="0"
                required
                className="flex-1"
                icon={<FaEthereum />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="propertyType"
                  className="block text-sm font-medium text-gray-400 mb-1.5"
                >
                  Property Type
                </label>
                <div className="relative">
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="w-full appearance-none px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200 pl-10"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Land">Land</option>
                  </select>
                  <FaBuilding className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <FormInput
                label="Area (sq ft)"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="e.g. 1500"
                type="number"
                min="0"
                icon={<FaRulerCombined />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="bedrooms"
                  className="block text-sm font-medium text-gray-400 mb-1.5"
                >
                  Bedrooms
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pl-10 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
                    placeholder="e.g. 3"
                    min="0"
                  />
                  <FaBed className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bathrooms"
                  className="block text-sm font-medium text-gray-400 mb-1.5"
                >
                  Bathrooms
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pl-10 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
                    placeholder="e.g. 2"
                    min="0"
                  />
                  <FaBath className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                <FaImage className="mr-2 text-teal-400" />
                Property Images
              </h2>

              <div className="border-2 border-dashed border-gray-700/70 rounded-xl p-6 bg-gray-900/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {previewImages.map((url, index) => (
                    <motion.div
                      key={index}
                      className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden group shadow-md"
                      whileHover={{ scale: 1.03 }}
                    >
                      <img
                        src={url}
                        alt={`Property preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <motion.button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTimes className="h-3 w-3" />
                      </motion.button>
                    </motion.div>
                  ))}

                  {previewImages.length < 5 && (
                    <motion.div
                      className="flex items-center justify-center aspect-video bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700/70 cursor-pointer hover:bg-gray-800 transition-colors"
                      whileHover={{
                        scale: 1.03,
                        borderColor: "rgba(56, 178, 172, 0.5)",
                      }}
                    >
                      <label
                        htmlFor="images"
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                      >
                        <FaImage className="h-8 w-8 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">Add Image</span>
                      </label>
                    </motion.div>
                  )}
                </div>

                <p className="text-gray-500 text-sm mb-4">
                  Upload up to 5 images of your property (JPEG, PNG or GIF){" "}
                  <span className="text-teal-400">*</span>
                </p>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <motion.label
                  htmlFor="images"
                  className="gradient-btn cursor-pointer inline-flex items-center px-4 py-2.5 font-medium rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaUpload className="mr-2" />
                  Upload Images
                </motion.label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  <FaUsersCog className="mr-2 text-teal-400" />
                  Royalty Holders
                </h2>
                {formData.royaltyHolders.length < 3 && (
                  <motion.button
                    type="button"
                    onClick={addRoyaltyHolder}
                    className="text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus className="h-3 w-3 mr-1" />
                    Add Holder
                  </motion.button>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Add up to 3 royalty holders who will receive a percentage of the
                sale (optional)
              </p>

              {formData.royaltyHolders.map((holder, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col sm:flex-row gap-4 mb-4 p-5 bg-gray-800/40 border border-gray-700/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                      Address {index + 1}
                    </label>
                    <input
                      type="text"
                      value={holder.address}
                      onChange={(e) =>
                        handleRoyaltyChange(index, "address", e.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
                      placeholder="0x..."
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                      % Share
                    </label>
                    <input
                      type="number"
                      value={holder.percentage}
                      onChange={(e) =>
                        handleRoyaltyChange(index, "percentage", e.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-gray-200"
                      placeholder="%"
                      min="0"
                      max="50"
                      step="0.01"
                    />
                  </div>
                  {index > 0 && (
                    <div className="flex items-end mb-1">
                      <motion.button
                        type="button"
                        onClick={() => removeRoyaltyHolder(index)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTrash className="h-5 w-5" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700/50 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-start">
              <FaInfoCircle className="text-teal-400 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Listing Fee:{" "}
                  <span className="font-bold text-white">{listingFee} ETH</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This fee is required to list your property on the marketplace.
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <motion.button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 border border-gray-700/70 rounded-lg hover:bg-gray-800 transition flex items-center justify-center flex-1 sm:flex-none"
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <FaArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="gradient-btn flex items-center justify-center px-5 py-2.5 font-medium rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white shadow-lg flex-1 sm:flex-none"
                disabled={isLoading || uploadingFiles}
                whileHover={isLoading || uploadingFiles ? {} : { scale: 1.05 }}
                whileTap={isLoading || uploadingFiles ? {} : { scale: 0.95 }}
              >
                {isLoading || uploadingFiles ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {uploadingFiles ? "Uploading to IPFS..." : "Listing..."}
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2 h-4 w-4" />
                    List Property
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
