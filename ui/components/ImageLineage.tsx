import { useState, useEffect } from "react";
import { findProofsByHash, ProofRecord } from "@/lib/database-service";
import Link from "next/link";
import Image from "next/image";
import { getIPFSGatewayURL } from "@/lib/ipfs-service";

interface ImageLineageProps {
  currentProof: ProofRecord;
}

interface LineageNode {
  proof: ProofRecord;
  level: number;
  isOrphan?: boolean;
}

export default function ImageLineage({ currentProof }: ImageLineageProps) {
  const [lineage, setLineage] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLineage() {
      try {
        setLoading(true);
        setError(null);

        // Start with the current proof
        const lineageNodes: LineageNode[] = [{ proof: currentProof, level: 0 }];

        // Track visited hashes to avoid infinite loops
        const visitedHashes = new Set<string>();

        // Add the current hash to visited
        if (currentProof.originalImageHash) {
          visitedHashes.add(currentProof.originalImageHash);
        }
        if (currentProof.transformedImageHash) {
          visitedHashes.add(currentProof.transformedImageHash);
        }

        // Start with the original hash of the current proof
        let currentHash = currentProof.originalImageHash;
        let level = 1;
        let foundParent = false;

        // Keep searching for parents until we don't find any more
        while (currentHash) {
          foundParent = false;
          // Find proofs where this hash is the transformed hash (meaning it's a parent)
          const { success, data } = await findProofsByHash(currentHash);

          if (success && data && data.length > 0) {
            // Find the proof where this hash is the transformed hash
            const parentProof = data.find(
              (p) => p.transformedImageHash === currentHash
            );

            if (
              parentProof &&
              parentProof.originalImageHash &&
              !visitedHashes.has(parentProof.originalImageHash)
            ) {
              // Add this proof to the lineage
              lineageNodes.push({ proof: parentProof, level });
              foundParent = true;

              // Mark as visited
              visitedHashes.add(parentProof.originalImageHash);
              if (parentProof.transformedImageHash) {
                visitedHashes.add(parentProof.transformedImageHash);
              }

              // Move to the next parent
              currentHash = parentProof.originalImageHash;
              level++;
            } else if (parentProof && parentProof.originalImageHash) {
              // We've seen this hash before, but we'll add it as the last node
              lineageNodes.push({
                proof: parentProof,
                level,
                isOrphan: true,
              });
              foundParent = true;
              break;
            } else {
              // No more parents
              break;
            }
          } else if (currentHash) {
            // No parent found in database, but we have a hash
            const orphanProof: ProofRecord = {
              imageName: "Unknown Image",
              originalImageHash: currentHash,
              transformedImageHash: undefined,
              proof: "",
              publicValues: "",
              ipfsMetadataUri: "",
              timestamp: new Date().toISOString(),
            };

            lineageNodes.push({
              proof: orphanProof,
              level,
              isOrphan: true,
            });
            foundParent = true;
            break;
          } else {
            // No hash to continue with
            break;
          }
        }

        // If we didn't find a parent for the last node and it has an original hash,
        // add a placeholder node for its parent
        const lastNode = lineageNodes[lineageNodes.length - 1];
        if (!foundParent && lastNode && lastNode.proof.originalImageHash) {
          const orphanProof: ProofRecord = {
            imageName: "Unknown Parent Image",
            originalImageHash: lastNode.proof.originalImageHash,
            transformedImageHash: undefined,
            proof: "",
            publicValues: "",
            ipfsMetadataUri: "",
            timestamp: new Date().toISOString(),
          };

          lineageNodes.push({
            proof: orphanProof,
            level: lastNode.level + 1,
            isOrphan: true,
          });
        }

        setLineage(lineageNodes);
      } catch (err) {
        console.error("Error fetching image lineage:", err);
        setError("Failed to load image lineage");
      } finally {
        setLoading(false);
      }
    }

    fetchLineage();
  }, [currentProof]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="ml-2 text-neutral-400">Loading lineage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-700 transition-all duration-300 hover:shadow-xl hover:border-blue-500 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Image Lineage</h2>

      <div className="relative pl-8">
        {/* Lineage nodes */}
        <div className="space-y-8 relative">
          {/* Vertical line - positioned on the left and only appears between nodes */}
          {lineage.length > 1 && (
            <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-blue-500"></div>
          )}

          {lineage.map((node, index) => (
            <div
              key={`${node.proof.id || node.proof.originalImageHash}-${index}`}
              className="relative"
            >
              {/* Dot - positioned on the left */}
              <div
                className={`absolute left-0 top-6 w-4 h-4 rounded-full border-2 z-10 transform -translate-x-1.5 ${
                  index === 0
                    ? "bg-blue-500 border-blue-600"
                    : node.isOrphan
                    ? "bg-gray-500 border-gray-600"
                    : "bg-neutral-700 border-blue-500"
                }`}
              ></div>

              <div className="flex items-start pl-8">
                {/* Thumbnail */}
                <div className="relative h-16 w-16 mr-4 overflow-hidden rounded-md border border-neutral-700">
                  {node.proof.ipfsImageUri ? (
                    <div className="relative h-full w-full">
                      <img
                        src={getIPFSGatewayURL(node.proof.ipfsImageUri)}
                        alt={node.proof.imageName || "Image"}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col items-center justify-center h-full ${
                        node.isOrphan ? "bg-gray-900/30" : "bg-neutral-700"
                      } p-1`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-8 w-8 ${
                          node.isOrphan ? "text-gray-500" : "text-neutral-500"
                        }`}
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
                      {node.proof.originalImageHash && (
                        <p className="text-[6px] text-neutral-400 mt-1 truncate w-full text-center">
                          {node.proof.originalImageHash.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-medium text-white">
                    {index === 0 ? (
                      <span className="text-blue-400">Current Image</span>
                    ) : node.isOrphan ? (
                      <span className="text-gray-400">
                        {node.proof.id ? "Circular Reference" : "Unknown Image"}
                      </span>
                    ) : (
                      <Link
                        href={`/gallery/${node.proof.id}`}
                        className="text-blue-400 hover:underline"
                      >
                        {node.proof.imageName}
                      </Link>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(node.proof.timestamp).toLocaleString()}
                  </p>
                  {node.proof.originalImageHash && (
                    <p className="text-xs text-neutral-500 mt-1 truncate max-w-xs">
                      Original: {node.proof.originalImageHash.substring(0, 10)}
                      ...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
