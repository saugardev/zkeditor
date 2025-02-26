import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Loader2,
  Upload,
  ExternalLink,
  Shield,
  Eye,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useTabs } from "@/contexts/TabsContext";
import {
  uploadBlobToIPFS,
  uploadProofMetadata,
  getIPFSGatewayURL,
} from "@/lib/ipfs-service";
import { generateProof } from "@/lib/proof-service";
import { useWriteContract, useAccount } from "wagmi";
import { verifyProofOnChain, getEtherscanUrl } from "@/lib/blockchain-service";
import {
  saveProofToDatabase,
  updateProofWithTxHash,
} from "@/lib/database-service";
import { Transformation } from "@/types/transformations";

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabId: string;
}

export function ProofModal({ isOpen, onClose, tabId }: ProofModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    originalImageHash?: string;
    transformedImageHash?: string;
    signerPublicKey?: string;
    hasSignature?: boolean;
    txHash?: string;
  } | null>(null);
  const [proofData, setProofData] = useState<
    Record<
      string,
      {
        proof: string | null;
        publicValues: string | null;
        finalImage: string | null;
        ipfsImageUri: string | null;
        ipfsMetadataUri: string | null;
        txHash: string | null;
        verified: boolean;
      }
    >
  >({});
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { showToast } = useToast();
  const { tabs } = useTabs();
  const { isConnected } = useAccount();

  // Contract write hook for verification
  const { writeContractAsync, isPending: isContractWritePending } =
    useWriteContract();

  // Function to reset all states
  const resetState = () => {
    setError(null);
    setCopiedField(null);
    // Only reset these states if they're not already in progress
    if (!isGenerating) setIsGenerating(false);
    if (!isPublishing) setIsPublishing(false);
    if (!isVerifying) setIsVerifying(false);
    // Don't reset verification result here, as we want to preserve it between modal sessions
  };

  // Reset states when the modal is opened
  useEffect(() => {
    if (isOpen) {
      // Only reset these states if they're not already in progress
      if (!isGenerating) {
        resetState();
        // Set verification result based on stored proof data
        if (proofData[tabId]?.txHash) {
          setVerificationResult({
            txHash: proofData[tabId].txHash,
          });
        } else {
          setVerificationResult(null);
        }
      }
    }
  }, [isOpen, tabId, proofData, isGenerating]);

  // Handle modal close with state reset
  const handleClose = () => {
    resetState();
    onClose();
  };

  const currentTab = tabs.find((tab) => tab.id === tabId);
  const currentProofData = proofData[tabId] || {
    proof: null,
    publicValues: null,
    finalImage: null,
    ipfsImageUri: null,
    ipfsMetadataUri: null,
    txHash: null,
    verified: false,
  };

  // Helper function to truncate long strings
  const truncateString = (str: string, maxLength: number = 50) => {
    if (!str) return "";
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength / 2)}...${str.substring(
      str.length - maxLength / 2
    )}`;
  };

  // Helper function to convert array of numbers to image URL
  const arrayToImageUrl = (imageData: number[]): string => {
    const uint8Array = new Uint8Array(imageData);
    const blob = new Blob([uint8Array], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast(`${field} copied to clipboard`);
    } catch {
      showToast("Failed to copy to clipboard");
    }
  };

  const handleGenerateProof = async () => {
    if (!currentTab?.imageUrl) {
      setError("No image selected");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      // Reset verification result when generating a new proof
      setVerificationResult(null);
      setProofData((prev) => ({
        ...prev,
        [tabId]: {
          proof: null,
          publicValues: null,
          finalImage: null,
          ipfsImageUri: null,
          ipfsMetadataUri: null,
          txHash: null,
          verified: false,
        },
      }));

      // Use the proof service to generate the proof
      const result = await generateProof(
        currentTab.imageUrl,
        currentTab.id,
        currentTab.transformations
      );

      setProofData((prev) => ({
        ...prev,
        [tabId]: {
          proof: result.proof,
          publicValues: result.publicValues,
          finalImage: result.finalImageUrl,
          ipfsImageUri: null,
          ipfsMetadataUri: null,
          txHash: null,
          verified: false,
        },
      }));

      showToast(result.message);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate proof. Please try again.";
      setError(message);
      showToast("Failed to generate proof");
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to publish to IPFS using Pinata
  const publishToIPFS = async () => {
    if (
      !currentProofData.finalImage ||
      !currentProofData.proof ||
      !currentProofData.publicValues
    ) {
      setError("No proof or image data available to publish");
      return;
    }

    try {
      setIsPublishing(true);
      setError(null);
      // Reset verification result when publishing to IPFS
      setVerificationResult(null);

      // 1. Upload the transformed image to IPFS
      const imageBlob = await fetch(currentProofData.finalImage).then((r) =>
        r.blob()
      );
      const fileName = `${currentTab?.name || "transformed-image"}.jpg`;

      // Use the IPFS service to upload the image
      const ipfsImageUri = await uploadBlobToIPFS(imageBlob, fileName);

      // 2. Create and upload JSON metadata with proof and image URI
      const ipfsMetadataUri = await uploadProofMetadata({
        imageCID: ipfsImageUri,
        proof: currentProofData.proof,
        publicValues: currentProofData.publicValues,
        name: currentTab?.name,
        transformations: currentTab?.transformations,
      });

      // 3. Update state with IPFS URIs
      setProofData((prev) => ({
        ...prev,
        [tabId]: {
          ...prev[tabId]!,
          ipfsImageUri,
          ipfsMetadataUri,
          txHash: null,
          verified: false,
        },
      }));

      // 4. Save the proof information to the database
      const dbResult = await saveProofToDatabase({
        imageName: currentTab?.name || "Unnamed Image",
        proof: currentProofData.proof,
        publicValues: currentProofData.publicValues,
        ipfsImageUri,
        ipfsMetadataUri,
        timestamp: new Date().toISOString(),
      });

      if (!dbResult.success) {
        console.warn("Failed to save proof to database:", dbResult.message);
      }

      showToast("Successfully published to IPFS");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to publish to IPFS. Please try again.";
      setError(message);
      showToast("Failed to publish to IPFS");
    } finally {
      setIsPublishing(false);
    }
  };

  // Function to verify the proof on-chain
  const verifyProof = async () => {
    if (!currentProofData.proof || !currentProofData.publicValues) {
      setError("No proof or public values available to verify");
      return;
    }

    if (!isConnected) {
      showToast("Please connect your wallet to verify the proof on-chain");
      return;
    }

    if (!currentProofData.ipfsMetadataUri) {
      showToast("Please publish to IPFS before verifying on-chain");
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setVerificationResult(null);

      // Use the blockchain service to verify the proof
      const result = await verifyProofOnChain(
        currentProofData.publicValues,
        currentProofData.proof,
        writeContractAsync
      );

      showToast("Verification transaction submitted");

      // Store the transaction hash in the verification result
      setVerificationResult({
        txHash: result.txHash,
      });

      // Store the transaction hash in the proofData state
      setProofData((prev) => ({
        ...prev,
        [tabId]: {
          ...prev[tabId]!,
          txHash: result.txHash,
          verified: true,
        },
      }));

      // Update the database record with the transaction hash
      const updateResult = await updateProofWithTxHash(
        currentProofData.ipfsMetadataUri,
        result.txHash
      );

      if (!updateResult.success) {
        console.warn(
          "Failed to update proof with transaction hash:",
          updateResult.message
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to verify proof on-chain. Please try again.";
      setError(message);
      showToast("Failed to verify proof on-chain");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-[520px] relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Generate Proof for {currentTab?.name}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {currentTab ? (
            <>
              {currentTab.transformations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">
                    Applied Transformations
                  </p>
                  <div className="bg-neutral-800 rounded p-2 text-sm text-neutral-300">
                    {currentTab.transformations.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span>{t.type}</span>
                        {t.params && (
                          <span className="text-neutral-500">
                            {Object.entries(t.params)
                              .map(
                                ([key, value]) =>
                                  `${key}: ${JSON.stringify(value)}`
                              )
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentProofData.finalImage && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">Transformed Image</p>
                  <div className="flex justify-center">
                    <img
                      src={currentProofData.finalImage}
                      alt="Transformed image"
                      className="max-w-full max-h-[200px] rounded-md object-contain"
                    />
                  </div>
                </div>
              )}

              {currentProofData.proof && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">Generated Proof</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white break-all flex-1">
                      {truncateString(currentProofData.proof, 80)}
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(currentProofData.proof!, "Proof")
                      }
                      className="text-neutral-400 hover:text-white p-1"
                    >
                      {copiedField === "Proof" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {currentProofData.publicValues && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">Public Values</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white break-all flex-1">
                      {truncateString(currentProofData.publicValues, 80)}
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(
                          currentProofData.publicValues!,
                          "Public Values"
                        )
                      }
                      className="text-neutral-400 hover:text-white p-1"
                    >
                      {copiedField === "Public Values" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {currentProofData.ipfsMetadataUri && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">IPFS Metadata URI</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        window.open(
                          getIPFSGatewayURL(currentProofData.ipfsMetadataUri!),
                          "_blank"
                        )
                      }
                      className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      <span>View on IPFS Gateway</span>
                      <ExternalLink size={16} className="ml-auto" />
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(
                          currentProofData.ipfsMetadataUri!,
                          "IPFS URI"
                        )
                      }
                      className="text-neutral-400 hover:text-white p-1"
                    >
                      {copiedField === "IPFS URI" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(verificationResult?.txHash || currentProofData.txHash) && (
                <div className="space-y-2">
                  <p className="text-sm text-green-400 font-medium">
                    Verification Transaction Submitted
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        window.open(
                          getEtherscanUrl(
                            verificationResult?.txHash ||
                              currentProofData.txHash!
                          ),
                          "_blank"
                        )
                      }
                      className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      <span>View Transaction on Etherscan</span>
                      <ExternalLink size={16} className="ml-auto" />
                    </button>
                    <button
                      onClick={() => {
                        const txHash =
                          verificationResult?.txHash || currentProofData.txHash;
                        if (txHash) {
                          handleCopy(txHash, "Transaction Hash");
                        }
                      }}
                      className="text-neutral-400 hover:text-white p-1"
                    >
                      {copiedField === "Transaction Hash" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex gap-2">
                <button
                  className={`flex-1 py-2.5 px-4 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isGenerating
                      ? "bg-blue-600/50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  onClick={handleGenerateProof}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : currentProofData.proof ? (
                    <>Regenerate Proof</>
                  ) : (
                    <>Generate Proof</>
                  )}
                </button>

                {currentProofData.proof && currentProofData.finalImage && (
                  <button
                    className={`flex-1 py-2.5 px-4 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isPublishing
                        ? "bg-green-600/50 cursor-not-allowed"
                        : currentProofData.ipfsMetadataUri
                        ? "bg-green-700 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    onClick={publishToIPFS}
                    disabled={
                      isPublishing || !!currentProofData.ipfsMetadataUri
                    }
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : currentProofData.ipfsMetadataUri ? (
                      <>
                        <Check size={16} />
                        <span>Published to IPFS</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Publish to IPFS</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {currentProofData.proof && currentProofData.publicValues && (
                <div className="mt-2">
                  <button
                    className={`w-full py-2.5 px-4 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isVerifying || isContractWritePending
                        ? "bg-purple-600/50 cursor-not-allowed"
                        : currentProofData.verified ||
                          verificationResult?.txHash
                        ? "bg-purple-700 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    onClick={verifyProof}
                    disabled={
                      isVerifying ||
                      isContractWritePending ||
                      currentProofData.verified ||
                      !!verificationResult?.txHash ||
                      !currentProofData.ipfsMetadataUri
                    }
                  >
                    {isVerifying || isContractWritePending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying on-chain...</span>
                      </>
                    ) : currentProofData.verified ||
                      verificationResult?.txHash ? (
                      <>
                        <Check size={16} />
                        <span>Proof verified onchain</span>
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        <span>Verify onchain</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-neutral-400">Image not found</p>
          )}
        </div>
      </div>
    </div>
  );
}
