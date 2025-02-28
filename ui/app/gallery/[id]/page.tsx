"use client";

import { useEffect, useState } from "react";
import { getProofById, ProofRecord } from "@/lib/database-service";
import { getIPFSGatewayURL } from "@/lib/ipfs-service";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import ImageLineage from "@/components/ImageLineage";

export default function ImageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [proof, setProof] = useState<ProofRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useNextImage, setUseNextImage] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "lineage">("details");

  useEffect(() => {
    async function fetchProofDetails() {
      try {
        setLoading(true);

        if (!params?.id) {
          router.push("/gallery");
          return;
        }

        const { success, data } = await getProofById(params.id);

        if (success && data) {
          setProof(data);
        } else {
          // Proof not found or error occurred
          setError(true);
          if (!data) {
            // Specifically not found
            router.push("/404");
          }
        }
      } catch (err) {
        console.error("Error fetching proof details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      fetchProofDetails();
    } else {
      router.push("/gallery");
    }
  }, [params, router]);

  const imageUrl = proof?.ipfsImageUri
    ? getIPFSGatewayURL(proof.ipfsImageUri)
    : undefined;
  const metadataUrl = proof?.ipfsMetadataUri
    ? getIPFSGatewayURL(proof.ipfsMetadataUri)
    : undefined;

  // Handle image error by switching to regular img tags
  const handleImageError = () => {
    setUseNextImage(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="text-center p-8 bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-neutral-700/50 max-w-md">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-6 text-neutral-300 font-medium">
            Loading image details...
          </p>
          <p className="mt-2 text-neutral-500 text-sm">
            Please wait while we fetch the proof information
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 p-4">
        <div className="text-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-2xl border border-red-800/50 max-w-md w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Error Loading Image
          </h2>
          <p className="text-red-200 mb-6">
            Failed to load image data. Please try again later.
          </p>
          <Link
            href="/gallery"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 inline-flex items-center gap-2 font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 p-4">
        <div className="text-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-2xl border border-yellow-800/50 max-w-md w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-900/30 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Image Not Found</h2>
          <p className="text-yellow-200 mb-6">
            The requested image could not be found in our database.
          </p>
          <Link
            href="/gallery"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 inline-flex items-center gap-2 font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 pb-16">
      {/* Header with blur effect */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-neutral-900/80 border-b border-neutral-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link
                href="/gallery"
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors duration-300"
                title="Back to Gallery"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold truncate max-w-md text-white">
                {proof.imageName}
              </h1>
              {proof.txHash && (
                <div className="hidden sm:flex items-center bg-green-900/30 px-3 py-1 rounded-full">
                  <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                  <span className="text-xs text-green-400 font-medium">
                    Verified
                  </span>
                </div>
              )}
            </div>

            {metadataUrl && (
              <a
                href={metadataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors duration-300 border border-blue-500/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                View Metadata
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Section - Takes up 2/3 of the space on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-700/50 overflow-hidden transition-all duration-500 hover:shadow-blue-900/20 group">
              <div className="relative h-[60vh] w-full overflow-hidden">
                {imageUrl ? (
                  <>
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-neutral-800/90 hover:bg-blue-600 p-3 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-lg"
                        title="View Full Size Image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                    {useNextImage ? (
                      <Image
                        src={imageUrl}
                        alt={proof.imageName || "Transformed image"}
                        fill
                        className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                        onError={handleImageError}
                        unoptimized
                      />
                    ) : (
                      <img
                        src={imageUrl}
                        alt={proof.imageName || "Transformed image"}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-neutral-800/50 p-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-24 w-24 text-neutral-500 mb-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-neutral-400 mb-4 text-lg">
                      Image not available
                    </p>
                    {proof?.originalImageHash && (
                      <div className="bg-neutral-800 px-4 py-3 rounded-lg shadow-inner">
                        <p className="text-sm text-neutral-300 font-mono">
                          Original Hash: {proof.originalImageHash}
                        </p>
                      </div>
                    )}
                    {proof?.transformedImageHash && (
                      <div className="bg-neutral-800 px-4 py-3 rounded-lg shadow-inner mt-3">
                        <p className="text-sm text-neutral-300 font-mono">
                          Transformed Hash: {proof.transformedImageHash}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image caption/info bar */}
              <div className="p-4 border-t border-neutral-700/50 bg-neutral-800/30">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-400">Created</p>
                    <p className="font-medium text-white">
                      {new Date(proof.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {proof.txHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${proof.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors duration-300"
                      title="View Transaction on Etherscan"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-white">
                        View Transaction
                      </span>
                    </a>
                  )}

                  {metadataUrl && (
                    <a
                      href={metadataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors duration-300 border border-blue-500/30"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm">View Metadata</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Section - Takes up 1/3 of the space on large screens */}
          <div className="lg:col-span-1">
            {/* Tabs for switching between details and lineage */}
            <div className="flex mb-4 bg-neutral-800/30 rounded-lg p-1 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === "details"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("lineage")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === "lineage"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                }`}
              >
                Image Lineage
              </button>
            </div>

            {/* Details Tab Content */}
            {activeTab === "details" && (
              <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-700/50 overflow-hidden transition-all duration-300 hover:shadow-blue-900/20">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-white border-b border-neutral-700 pb-3">
                    Image Information
                  </h2>

                  <div className="space-y-5">
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Name</p>
                      <p className="font-medium text-white text-lg">
                        {proof.imageName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-500 mb-1">
                        Verification Status
                      </p>
                      <div className="flex items-center">
                        {proof.txHash ? (
                          <>
                            <span className="inline-block h-3 w-3 rounded-full bg-green-400 mr-2"></span>
                            <p className="font-medium text-green-400">
                              Verified on blockchain
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 mr-2"></span>
                            <p className="font-medium text-yellow-400">
                              Not verified
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {proof.txHash && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">
                          Transaction Hash
                        </p>
                        <div className="bg-neutral-900/50 rounded-lg p-3 font-mono text-sm text-neutral-300 break-all border border-neutral-700/50">
                          {proof.txHash}
                        </div>
                      </div>
                    )}

                    {proof.originalImageHash && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">
                          Original Image Hash
                        </p>
                        <div className="bg-neutral-900/50 rounded-lg p-3 font-mono text-sm text-neutral-300 break-all border border-neutral-700/50">
                          {proof.originalImageHash}
                        </div>
                      </div>
                    )}

                    {proof.transformedImageHash && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">
                          Transformed Image Hash
                        </p>
                        <div className="bg-neutral-900/50 rounded-lg p-3 font-mono text-sm text-neutral-300 break-all border border-neutral-700/50">
                          {proof.transformedImageHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lineage Tab Content */}
            {activeTab === "lineage" && (
              <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-700/50 overflow-hidden transition-all duration-300 hover:shadow-blue-900/20">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-white border-b border-neutral-700 pb-3">
                    Image Lineage
                  </h2>

                  {proof && <ImageLineage currentProof={proof} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
