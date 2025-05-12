// hooks/useTransactions.js
import { useState, useEffect, useCallback } from "react";
import { useContract } from "./useContract";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";

export function useTransactions(propertyId, limit = 10, offset = 0) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { contract } = useContract();

  const fetchTransactions = useCallback(async () => {
    if (!contract || !propertyId) return;

    try {
      setLoading(true);
      const transactionIds = await contract.getTransactionsByProperty(
        propertyId,
        limit,
        offset
      );

      const transactionPromises = transactionIds.map(async (id) => {
        const details = await contract.getTransactionDetails(id);
        return {
          id: details.id.toString(),
          propertyId: details.propertyId.toString(),
          from: details.from,
          to: details.to,
          amount: details.amount,
          timestamp: details.timestamp.toNumber(),
          transactionType: details.transactionType,
        };
      });

      const fetchedTransactions = await Promise.all(transactionPromises);
      setTransactions(fetchedTransactions);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [contract, propertyId, limit, offset]);

  useEffect(() => {
    if (contract && propertyId) {
      fetchTransactions();
    }
  }, [contract, propertyId, fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}
