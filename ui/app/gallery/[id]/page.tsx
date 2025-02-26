"use client";

import { useEffect, useState } from "react";
import { getProofById, ProofRecord } from "@/lib/database-service";
import { getIPFSGatewayURL } from "@/lib/ipfs-service";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

export default function ImageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [proof, setProof] = useState<ProofRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useNextImage, setUseNextImage] = useState(true);

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-neutral-400">Loading image details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
          Failed to load image data. Please try again later.
        </div>
        <Link
          href="/gallery"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-200 px-4 py-3 rounded mb-4">
          Image not found.
        </div>
        <Link
          href="/gallery"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold truncate max-w-2xl text-white">
          {proof.imageName}
        </h1>
        <Link
          href="/gallery"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          Back to Gallery
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-neutral-800 p-4 rounded-lg shadow-md border border-neutral-700 transition-all duration-300 hover:shadow-xl hover:border-blue-500">
          <div className="relative h-[500px] w-full mb-4 overflow-hidden">
            {imageUrl ? (
              <>
                <div className="absolute top-1 right-1 z-10">
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-neutral-800/80 hover:bg-blue-600/80 p-2 rounded-full transition-colors duration-300 flex items-center justify-center"
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
                    className="object-contain"
                    onError={handleImageError}
                    unoptimized
                  />
                ) : (
                  <img
                    src={imageUrl}
                    alt={proof.imageName || "Transformed image"}
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-neutral-700">
                <p className="text-neutral-400">No image available</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-700 transition-all duration-300 hover:shadow-xl hover:border-blue-500">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Image Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Name</p>
                <p className="font-medium text-white">{proof.imageName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Created</p>
                <p className="font-medium text-white">
                  {new Date(proof.timestamp).toLocaleString()}
                </p>
              </div>
              {proof.txHash && (
                <div>
                  <p className="text-sm text-neutral-500">Transaction Hash</p>
                  <div className="flex items-center">
                    <p className="font-medium break-all text-white mr-2">
                      {proof.txHash}
                    </p>
                    <a
                      href={`https://sepolia.basescan.org/tx/${proof.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-neutral-800/80 hover:bg-blue-600/80 p-1.5 rounded-full transition-colors duration-300 flex items-center justify-center"
                      title="View Transaction on Etherscan"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-white"
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
                </div>
              )}
              <div>
                <p className="text-sm text-neutral-500">Proof Status</p>
                <p className="font-medium">
                  {proof.txHash ? (
                    <span className="text-green-400">Verified</span>
                  ) : (
                    <span className="text-yellow-400">Non verified</span>
                  )}
                </p>
              </div>
              <div className="space-y-3">
                {metadataUrl && (
                  <div className="pt-2">
                    <a
                      href={metadataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 inline-block hover:shadow-lg transform hover:-translate-y-1"
                    >
                      View Proof Metadata
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
