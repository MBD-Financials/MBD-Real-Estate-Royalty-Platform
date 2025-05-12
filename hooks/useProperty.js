// hooks/useProperty.js
import { useState, useEffect, useCallback } from "react";
import { useContract } from "./useContract";
import { ipfsToHttp } from "../utils/contracts";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";

export function useProperty(propertyId) {
  const [property, setProperty] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [royaltyHolders, setRoyaltyHolders] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { contract } = useContract();

  const fetchPropertyDetails = useCallback(async () => {
    if (!contract || !propertyId) return;

    try {
      setLoading(true);

      // Fetch basic property details
      const details = await contract.getPropertyDetails(propertyId);
      const propertyData = {
        id: details.id.toString(),
        uri: details.uri,
        owner: details.owner,
        price: details.price,
        status: details.status,
        royaltyHolderCount: details.royaltyHolderCount.toNumber(),
        buyerCount: details.buyerCount.toNumber(),
        createdAt: details.createdAt.toNumber(),
        updatedAt: details.updatedAt.toNumber(),
      };
      setProperty(propertyData);

      // Fetch metadata from IPFS if available
      if (details.uri) {
        try {
          const response = await fetch(ipfsToHttp(details.uri));
          const metadataJson = await response.json();
          setMetadata(metadataJson);
        } catch (metadataErr) {
          console.error("Error fetching metadata:", metadataErr);
          // Don't fail the entire request if metadata can't be fetched
          setMetadata({ error: "Failed to load metadata" });
        }
      }

      // Fetch royalty holders
      const royaltyHoldersArray = [];
      for (let i = 0; i < propertyData.royaltyHolderCount; i++) {
        const holder = await contract.getRoyaltyHolderDetails(propertyId, i);
        royaltyHoldersArray.push({
          address: holder.holderAddress,
          percentage: holder.percentage,
          hasApproved: holder.hasApproved,
        });
      }
      setRoyaltyHolders(royaltyHoldersArray);

      // Fetch buyers
      const buyersArray = [];
      for (let i = 0; i < propertyData.buyerCount; i++) {
        const buyer = await contract.getBuyerDetails(propertyId, i);
        buyersArray.push({
          address: buyer.buyerAddress,
          sharePercentage: buyer.sharePercentage,
          amountPaid: buyer.amountPaid,
          hasPaid: buyer.hasPaid,
        });
      }
      setBuyers(buyersArray);

      setError(null);
    } catch (err) {
      console.error("Error fetching property details:", err);
      setError(err.message || "Failed to fetch property details");
    } finally {
      setLoading(false);
    }
  }, [contract, propertyId]);

  useEffect(() => {
    if (contract && propertyId) {
      fetchPropertyDetails();
    }
  }, [contract, propertyId, fetchPropertyDetails]);

  return {
    property,
    metadata,
    royaltyHolders,
    buyers,
    loading,
    error,
    refetch: fetchPropertyDetails,
  };
}
