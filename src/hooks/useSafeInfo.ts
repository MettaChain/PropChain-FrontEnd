import { useState, useEffect, useMemo } from "react";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { logger } from "@/utils/logger";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const SAFE_MASTER_COPY_ADDRESS = "0x6851D6f8ADC5e91A94AAb91F358A4f3d4293504A"; // Example for Gnosis Safe v1.3.0

export function useSafeInfo(address: string | undefined) {
  const [isSafe, setIsSafe] = useState(false);
  const [safeInfo, setSafeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const provider = useMemo(
    () => new ethers.providers.Web3Provider(window.ethereum as any),
    [],
  );

  useEffect(() => {
    async function checkSafe() {
      if (!address || !provider) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const code = await publicClient.getBytecode({
          address: address as `0x${string}`,
        });

        if (
          code &&
          code.includes(SAFE_MASTER_COPY_ADDRESS.slice(2).toLowerCase())
        ) {
          setIsSafe(true);
          const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: provider.getSigner(),
          });

          const safeSdk = await Safe.create({
            ethAdapter,
            safeAddress: address,
          });
          const owners = await safeSdk.getOwners();
          const threshold = await safeSdk.getThreshold();
          const queuedTxs = await safeSdk.getPendingTransactions();

          setSafeInfo({
            owners,
            threshold,
            queuedTxs,
            version: await safeSdk.getContractVersion(),
          });
        } else {
          setIsSafe(false);
          setSafeInfo(null);
        }
      } catch (error) {
        logger.error("Failed to check Safe info:", error);
        setIsSafe(false);
        setSafeInfo(null);
      } finally {
        setLoading(false);
      }
    }

    checkSafe();
  }, [address, provider]);

  return { isSafe, safeInfo, loading };
}
