"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "@reown/appkit/networks";

export const ConnectButton = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();

  // Check if user is on the wrong chain
  const isWrongChain = isConnected && chainId !== baseSepolia.id;

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: baseSepolia.id });
    }
  };

  return (
    <div>
      {isWrongChain && (
        <button
          onClick={handleSwitchNetwork}
          className="px-4 py-2 bg-red-600 text-white rounded-lg mb-2 hover:bg-red-700 transition-colors"
        >
          Switch to Base Sepolia
        </button>
      )}
      {/* @ts-expect-error Add this line while our team fix the upgrade to react 19 for global components */}
      <appkit-button />
    </div>
  );
};
