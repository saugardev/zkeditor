/**
 * Blockchain Service for interacting with smart contracts
 */
import { imageVerifierAbi } from "@/ABIs/ImageVerifier";
import { WriteContractParameters } from "wagmi/actions";
import { Abi } from "viem";

// Contract addresses
const IMAGE_VERIFIER_ADDRESS = "0x9b574eF6677c87da28B38291EE2dF679622f8E26";

// Types for verification
export interface VerificationResult {
  txHash: string;
  originalImageHash?: string;
  transformedImageHash?: string;
  signerPublicKey?: string;
  hasSignature?: boolean;
}

/**
 * Verify a proof on-chain using the ImageVerifier contract
 * @param publicValues The public values from the proof
 * @param proofBytes The proof data
 * @param writeContractAsync The wagmi writeContractAsync function
 * @returns The verification result with transaction hash
 */
export async function verifyProofOnChain(
  publicValues: string,
  proofBytes: string,
  writeContractAsync: (
    params: WriteContractParameters
  ) => Promise<`0x${string}`>
): Promise<VerificationResult> {
  // Call the contract
  const txHash = await writeContractAsync({
    address: IMAGE_VERIFIER_ADDRESS as `0x${string}`,
    abi: imageVerifierAbi as unknown as Abi,
    functionName: "verifyImageTransformProof",
    args: [publicValues, proofBytes],
  });

  // Return the transaction hash
  return {
    txHash,
  };
}

/**
 * Get the Etherscan URL for a transaction
 * @param txHash The transaction hash
 * @returns The Etherscan URL for the transaction
 */
export function getEtherscanUrl(txHash: string | undefined): string {
  if (!txHash) return "";
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}
