"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getIPFSGatewayURL } from "@/lib/ipfs-service";
import { ProofRecord } from "@/lib/database-service";
import { Search, Calendar, ArrowUpDown } from "lucide-react";
import Link from "next/link";

interface GalleryGridProps {
  proofs: ProofRecord[];
}

export function GalleryGrid({ proofs }: GalleryGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [filteredProofs, setFilteredProofs] = useState<ProofRecord[]>(proofs);
  const [useNextImage, setUseNextImage] = useState(true);

  // Update filtered proofs when props change
  useEffect(() => {
    setFilteredProofs(proofs);
  }, [proofs]);

  useEffect(() => {
    // Filter and sort proofs based on search term and sort option
    let result = [...proofs];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((proof) =>
        proof.imageName.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredProofs(result);
  }, [proofs, searchTerm, sortBy]);

  // Handle image error by switching to regular img tags
  const handleImageError = () => {
    setUseNextImage(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-neutral-400" />
          </div>
          <input
            type="text"
            className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-neutral-400" />
          <select
            className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredProofs.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800 rounded-lg">
          <p className="text-xl text-neutral-400">
            No images found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProofs.map((proof) => {
            const imageUrl = proof.ipfsImageUri
              ? getIPFSGatewayURL(proof.ipfsImageUri)
              : undefined;

            return (
              <div
                key={proof.id}
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-neutral-800 border-neutral-700 hover:border-blue-500"
              >
                <Link href={`/gallery/${proof.id}`}>
                  <div className="relative h-64 w-full overflow-hidden">
                    {imageUrl ? (
                      useNextImage ? (
                        <Image
                          src={imageUrl}
                          alt={proof.imageName || "Transformed image"}
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-110"
                          onError={handleImageError}
                          unoptimized
                        />
                      ) : (
                        <img
                          src={imageUrl}
                          alt={proof.imageName || "Transformed image"}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full bg-neutral-700">
                        <p className="text-neutral-400">No image available</p>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link
                    href={`/gallery/${proof.id}`}
                    className="hover:text-blue-400 transition-colors duration-300"
                  >
                    <h2 className="text-xl font-semibold mb-2 truncate text-white">
                      {proof.imageName}
                    </h2>
                  </Link>
                  <p className="text-sm text-neutral-400 mb-2">
                    Created: {new Date(proof.timestamp).toLocaleString()}
                  </p>
                  {proof.txHash && (
                    <p className="text-xs text-neutral-500 truncate">
                      TX: {proof.txHash}
                    </p>
                  )}
                  <div className="mt-4 flex justify-between">
                    {imageUrl && (
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-300 hover:underline"
                      >
                        View Full Image
                      </a>
                    )}
                    {proof.ipfsMetadataUri && (
                      <a
                        href={getIPFSGatewayURL(proof.ipfsMetadataUri) || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-300 hover:underline"
                      >
                        View Metadata
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
