import { useState, useEffect, useCallback } from "react";
import { useContract } from "./useContract";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { ipfsToHttp } from "../utils/contracts";
import axios from "axios";

export function useProperties(status = 0, limit = 10, offset = 0) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { contract } = useContract();

  const fetchPropertyMetadata = async (uri) => {
    if (!uri) return null;

    try {
      // Convert IPFS URI to HTTP URL if necessary
      // const url = ipfsToHttp(uri);

      const response = await axios.get(uri, {
        timeout: 10000, // 10 second timeout
        headers: {
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (err) {
      console.error(`Error fetching metadata from ${uri}:`, err);
      return null;
    }
  };

  const fetchProperties = useCallback(async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const propertyIds = await contract.getPropertiesByStatus(
        status,
        limit,
        offset
      );

      const propertyPromises = propertyIds.map(async (id) => {
        try {
          // Get basic property details from contract
          const details = await contract.getPropertyDetails(id);

          // Parse and convert BigNumber values
          const parsedDetails = {
            id: details.id.toString(),
            uri: details.uri,
            owner: details.owner,
            price: details.price, // Keep as BigNumber for now
            status: Number(details.status),
            royaltyHolderCount: details.royaltyHolderCount.toNumber(),
            buyerCount: details.buyerCount.toNumber(),
            createdAt: details.createdAt.toNumber(),
            updatedAt: details.updatedAt.toNumber(),
          };

          // Fetch metadata from IPFS/HTTP URI
          let metadata = null;
          if (details.uri) {
            metadata = await fetchPropertyMetadata(details.uri);
          }

          // Return property with metadata
          return {
            ...parsedDetails,
            // Add metadata fields or defaults
            title: metadata?.title || `Property #${parsedDetails.id}`,
            description: metadata?.description || "No description available",
            location: metadata?.location || "Location not specified",
            images: metadata?.images || [],
            attributes: metadata?.attributes || [],
            // Include the original metadata
            metadata,
          };
        } catch (err) {
          console.error(`Error fetching property ${id}:`, err);
          // Return partial property data on error
          return {
            id: id.toString(),
            error: err.message,
          };
        }
      });

      const fetchedProperties = await Promise.all(propertyPromises);

      // Filter out properties with errors
      const validProperties = fetchedProperties.filter((p) => !p.error);

      setProperties(validProperties);
      setError(null);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err.message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  }, [contract, status, limit, offset]);

  useEffect(() => {
    if (contract) {
      fetchProperties();
    }
  }, [contract, fetchProperties]);

  return { properties, loading, error, refetch: fetchProperties };
}
