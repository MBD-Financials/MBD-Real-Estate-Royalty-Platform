// pages/edit-property/[id].js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useContract } from "../../hooks/useContract";
import { useProperty } from "../../hooks/useProperty";
import { ethers } from "ethers";
import { createAndUploadPropertyMetadata } from "../../utils/pinata";
import { ipfsToHttp } from "../../utils/contracts";
import Link from "next/link";
import {
  FaUpload,
  FaSpinner,
  FaImage,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const { address, isConnected } = useAccount();
  const { contract, writeContract, isReady } = useContract();
  const { property, metadata, loading, error, refetch } = useProperty(id);

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);

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
  });

  // Images state
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Check if user is the owner of the property
  useEffect(() => {
    if (property && address) {
      const ownerMatches =
        property.owner?.toLowerCase() === address?.toLowerCase();
      setIsOwner(ownerMatches);

      // If not owner, redirect to view property page
      if (!ownerMatches) {
        router.push(`/property/${id}`);
      }
    }
  }, [property, address, router, id]);

  // Populate form data when property metadata is loaded
  useEffect(() => {
    if (property && metadata) {
      setFormData({
        title: metadata.title || `Property #${property.id}`,
        description: metadata.description || "",
        location: metadata.location || "",
        price: property.price ? ethers.utils.formatEther(property.price) : "",
        propertyType:
          metadata.attributes?.find(
            (attr) => attr.trait_type === "Property Type"
          )?.value || "Residential",
        bedrooms:
          metadata.attributes?.find((attr) => attr.trait_type === "Bedrooms")
            ?.value || "",
        bathrooms:
          metadata.attributes?.find((attr) => attr.trait_type === "Bathrooms")
            ?.value || "",
        area:
          metadata.attributes?.find((attr) => attr.trait_type === "Area")
            ?.value || "",
      });

      // Set existing images if available
      if (metadata.images && metadata.images.length > 0) {
        setExistingImages(
          metadata.images.map((img) => ({
            url: ipfsToHttp(img),
            ipfsUri: img,
          }))
        );
      }
    }
  }, [property, metadata]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Calculate how many more images can be added
    const remainingSlots = 5 - (existingImages.length + images.length);

    // Limit to remaining slots
    const selectedFiles = files.slice(0, remainingSlots);

    // Update file state
    setImages((prevImages) =>
      [...prevImages, ...selectedFiles].slice(0, remainingSlots)
    );

    // Create preview URLs
    const newPreviewUrls = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewImages((prevUrls) =>
      [...prevUrls, ...newPreviewUrls].slice(0, remainingSlots)
    );
  };

  // Remove new image
  const removeNewImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setPreviewImages((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !isOwner) {
      setErrorMessage("You must be the owner to edit this property");
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

      // Check if we have at least one image (either existing or new)
      if (existingImages.length === 0 && images.length === 0) {
        throw new Error("Please upload at least one image of the property");
      }

      // Prepare final images array for metadata
      let finalImageUris = [...existingImages.map((img) => img.ipfsUri)];

      // Upload new images to IPFS if any
      if (images.length > 0) {
        setUploadingFiles(true);
        const uploadedImages = await uploadMultipleFilesToPinata(images);
        setUploadingFiles(false);

        const successfulUploads = uploadedImages.filter(
          (upload) => upload.success
        );
        if (successfulUploads.length !== images.length) {
          throw new Error("Some images failed to upload. Please try again.");
        }

        // Add new image URIs
        const newImageUris = successfulUploads.map(
          (upload) => `ipfs://${upload.ipfsHash}`
        );
        finalImageUris = [...finalImageUris, ...newImageUris];
      }

      // Create updated metadata
      const updatedMetadata = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        images: finalImageUris,
        attributes: [
          {
            trait_type: "Property Type",
            value: formData.propertyType || "Residential",
          },
          {
            trait_type: "Bedrooms",
            value: formData.bedrooms || 0,
          },
          {
            trait_type: "Bathrooms",
            value: formData.bathrooms || 0,
          },
          {
            trait_type: "Area",
            value: formData.area || 0,
            unit: "sq ft",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      // Upload updated metadata to IPFS
      setUploadingFiles(true);
      const metadataUpload = await uploadJSONToPinata(
        updatedMetadata,
        `Property - ${formData.title} - Updated`
      );
      setUploadingFiles(false);

      if (!metadataUpload.success) {
        throw new Error(
          metadataUpload.message || "Failed to upload property data to IPFS"
        );
      }

      // Get the contract with signer
      const contractWithSigner = writeContract();
      if (!contractWithSigner) {
        throw new Error("Failed to get contract with signer");
      }

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(formData.price.toString());

      // Update the property on the blockchain
      const transaction = await contractWithSigner.updateProperty(
        id,
        priceInWei,
        metadataUpload.ipfsUri
      );

      // Wait for transaction to be mined
      await transaction.wait();

      setSuccessMessage("Property updated successfully!");

      // Redirect to property details page after successful update
      setTimeout(() => {
        router.push(`/property/${id}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating property:", error);
      setErrorMessage(
        error.message || "Failed to update property. Please try again."
      );
    } finally {
      setIsLoading(false);
      setUploadingFiles(false);
    }
  };

  // Import functions from pinata utils
  const {
    uploadMultipleFilesToPinata,
    uploadJSONToPinata,
  } = require("../../utils/pinata");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <FaSpinner className="h-8 w-8 text-teal-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading property details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <FaExclamationTriangle className="h-12 w-12 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Property</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href="/my-properties">
          <button className="gradient-btn mx-auto">
            Back to My Properties
          </button>
        </Link>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card p-8 text-center">
        <FaExclamationTriangle className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">
          Please connect your wallet to edit your property.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Link
            href="/my-properties"
            className="text-gray-400 hover:text-white"
          >
            My Properties
          </Link>
          <span className="text-gray-600">/</span>
          <Link
            href={`/property/${id}`}
            className="text-gray-400 hover:text-white"
          >
            Property Details
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white">Edit</span>
        </div>
        <h1 className="text-3xl font-bold mb-1">Edit Property</h1>
        <p className="text-gray-400">
          Update your property listing information
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Property Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Luxury Apartment in Downtown"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-24"
                placeholder="Describe your property in detail..."
                required
                rows={4}
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. New York, NY"
                required
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Price (ETH) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 10.5"
                step="0.0001"
                min="0"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="propertyType"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Property Type
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Land">Land</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="area"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Area (sq ft)
                </label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 1500"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="bedrooms"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Bedrooms
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 3"
                  min="0"
                />
              </div>

              <div>
                <label
                  htmlFor="bathrooms"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Bathrooms
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 2"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Property Images *
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {/* Existing Images */}
                  {existingImages.map((img, index) => (
                    <div
                      key={`existing-${index}`}
                      className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden group"
                    >
                      <img
                        src={img.url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* New Images */}
                  {previewImages.map((url, index) => (
                    <div
                      key={`new-${index}`}
                      className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden group"
                    >
                      <img
                        src={url}
                        alt={`New property image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  {existingImages.length + previewImages.length < 5 && (
                    <div className="flex items-center justify-center aspect-video bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors">
                      <label
                        htmlFor="images"
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                      >
                        <FaImage className="h-8 w-8 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">Add Image</span>
                      </label>
                    </div>
                  )}
                </div>

                <p className="text-gray-500 text-sm mb-4">
                  {existingImages.length + previewImages.length > 0
                    ? `${
                        existingImages.length + previewImages.length
                      } of 5 images selected`
                    : "Upload up to 5 images of your property (JPEG, PNG or GIF)"}
                </p>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                  disabled={existingImages.length + previewImages.length >= 5}
                />
                <label
                  htmlFor="images"
                  className={`gradient-btn cursor-pointer inline-block ${
                    existingImages.length + previewImages.length >= 5
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={(e) => {
                    if (existingImages.length + previewImages.length >= 5) {
                      e.preventDefault();
                    }
                  }}
                >
                  <FaUpload className="inline-block mr-2" />
                  Upload Images
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-400">
                Property ID: <span className="font-bold text-white">#{id}</span>
              </p>
            </div>
            <div className="flex gap-4">
              <Link href={`/property/${id}`}>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition flex items-center"
                >
                  <FaArrowLeft className="mr-2" />
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                className="gradient-btn flex items-center"
                disabled={isLoading || uploadingFiles}
              >
                {isLoading || uploadingFiles ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {uploadingFiles ? "Uploading to IPFS..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Update Property
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
