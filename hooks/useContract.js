// hooks/useContract.js
import { useState, useEffect } from "react";
import { getContract } from "../utils/contracts";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";

export function useContract() {
  const [contract, setContract] = useState(null);
  const provider = useEthersProvider();
  const signer = useEthersSigner();

  useEffect(() => {
    if (provider) {
      const contractInstance = getContract(provider);
      setContract(contractInstance);
    }
  }, [provider]);

  const writeContract = () => {
    if (signer) {
      return getContract(signer);
    }
    return null;
  };

  return {
    contract,
    writeContract,
    isReady: !!contract,
  };
}
