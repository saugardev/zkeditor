"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getIPFSGatewayURL } from "@/lib/ipfs-service";
import { ProofRecord } from "@/lib/database-service";
import { Search, Calendar, ArrowUpDown, Filter, X, Check } from "lucide-react";
import Link from "next/link";

interface GalleryGridProps {
  proofs: ProofRecord[];
}

export function GalleryGrid({ proofs }: GalleryGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [filteredProofs, setFilteredProofs] = useState<ProofRecord[]>(proofs);
  const [useNextImage, setUseNextImage] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);

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

    // Apply verification filter
    if (filterVerified !== null) {
      result = result.filter((proof) =>
        filterVerified ? !!proof.txHash : !proof.txHash
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredProofs(result);
  }, [proofs, searchTerm, sortBy, filterVerified]);

  // Handle image error by switching to regular img tags
  const handleImageError = () => {
    setUseNextImage(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("newest");
    setFilterVerified(null);
  };

  return (
    <div className="space-y-8">
      {/* Filter and Search Bar */}
      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              className="bg-neutral-900/70 border border-neutral-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3 transition-all duration-300 hover:border-blue-500/50"
              placeholder="Search images by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sort Options */}
            <div className="flex items-center gap-2 bg-neutral-900/70 px-3 py-2 rounded-lg border border-neutral-700">
              <Calendar size={16} className="text-neutral-400" />
              <select
                className="bg-transparent text-white text-sm focus:outline-none"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest")
                }
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilterVerified(filterVerified === true ? null : true)
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
                  filterVerified === true
                    ? "bg-green-900/30 border-green-700 text-green-400"
                    : "bg-neutral-900/70 border-neutral-700 text-neutral-400 hover:border-green-700/50"
                }`}
              >
                <Check size={16} />
                <span className="text-sm">Verified</span>
              </button>

              <button
                onClick={() =>
                  setFilterVerified(filterVerified === false ? null : false)
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
                  filterVerified === false
                    ? "bg-yellow-900/30 border-yellow-700 text-yellow-400"
                    : "bg-neutral-900/70 border-neutral-700 text-neutral-400 hover:border-yellow-700/50"
                }`}
              >
                <X size={16} />
                <span className="text-sm">Unverified</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-900/70 rounded-lg border border-neutral-700 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Grid View"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="List View"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* Clear Filters */}
            {(searchTerm || sortBy !== "newest" || filterVerified !== null) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors duration-300"
              >
                <X size={16} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-neutral-400 text-sm">
          Showing {filteredProofs.length} of {proofs.length} images
        </p>
        {filteredProofs.length > 0 && (
          <p className="text-neutral-400 text-sm">
            {filterVerified === true
              ? "Showing verified images only"
              : filterVerified === false
              ? "Showing unverified images only"
              : "Showing all images"}
          </p>
        )}
      </div>

      {/* No Results */}
      {filteredProofs.length === 0 ? (
        <div className="flex items-center justify-center py-16 bg-neutral-800/30 backdrop-blur-sm rounded-xl border border-neutral-700/50">
          <div className="text-center p-6 max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-700/50 mb-4">
              <Search size={24} className="text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Images Found
            </h3>
            <p className="text-neutral-400 mb-4">
              No images match your current search criteria. Try adjusting your
              filters or search term.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors duration-300 border border-blue-500/30"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProofs.map((proof) => {
                const imageUrl = proof.ipfsImageUri
                  ? getIPFSGatewayURL(proof.ipfsImageUri)
                  : undefined;

                return (
                  <div
                    key={proof.id}
                    className="group bg-neutral-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-neutral-700/50 hover:border-blue-500/50 hover:shadow-blue-900/20"
                  >
                    <Link
                      href={`/gallery/${proof.id}`}
                      className="block relative"
                    >
                      <div className="relative h-64 w-full overflow-hidden">
                        {imageUrl ? (
                          useNextImage ? (
                            <Image
                              src={imageUrl}
                              alt={proof.imageName || "Transformed image"}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={handleImageError}
                              unoptimized
                            />
                          ) : (
                            <img
                              src={imageUrl}
                              alt={proof.imageName || "Transformed image"}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-neutral-700/50">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-16 w-16 text-neutral-500 mb-2"
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
                            <p className="text-neutral-400">
                              No image available
                            </p>
                          </div>
                        )}

                        {/* Verification Badge */}
                        {proof.txHash && (
                          <div className="absolute top-2 right-2 bg-green-900/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
                            <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                            <span className="text-xs text-green-400 font-medium">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-4 w-full">
                          <h2 className="text-lg font-bold text-white truncate mb-1">
                            {proof.imageName}
                          </h2>
                          <p className="text-xs text-neutral-300">
                            {new Date(proof.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="p-4 border-t border-neutral-700/50">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/gallery/${proof.id}`}
                          className="text-white hover:text-blue-400 transition-colors duration-300 font-medium"
                        >
                          View Details
                        </Link>

                        <div className="flex items-center gap-2">
                          {imageUrl && (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-neutral-400 hover:text-blue-400 transition-colors duration-300"
                              title="View Full Image"
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
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          )}

                          {proof.ipfsMetadataUri && (
                            <a
                              href={
                                getIPFSGatewayURL(proof.ipfsMetadataUri) || "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-neutral-400 hover:text-blue-400 transition-colors duration-300"
                              title="View Metadata"
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
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {filteredProofs.map((proof) => {
                const imageUrl = proof.ipfsImageUri
                  ? getIPFSGatewayURL(proof.ipfsImageUri)
                  : undefined;

                return (
                  <div
                    key={proof.id}
                    className="group bg-neutral-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-neutral-700/50 hover:border-blue-500/50 hover:shadow-blue-900/20"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <Link
                        href={`/gallery/${proof.id}`}
                        className="block relative sm:w-48 h-48"
                      >
                        <div className="relative h-full w-full overflow-hidden">
                          {imageUrl ? (
                            useNextImage ? (
                              <Image
                                src={imageUrl}
                                alt={proof.imageName || "Transformed image"}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={handleImageError}
                                unoptimized
                              />
                            ) : (
                              <img
                                src={imageUrl}
                                alt={proof.imageName || "Transformed image"}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-neutral-700/50">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-neutral-500 mb-2"
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
                              <p className="text-sm text-neutral-400">
                                No image
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Link
                              href={`/gallery/${proof.id}`}
                              className="hover:text-blue-400 transition-colors duration-300"
                            >
                              <h2 className="text-xl font-semibold text-white">
                                {proof.imageName}
                              </h2>
                            </Link>

                            {proof.txHash && (
                              <div className="bg-green-900/30 px-2 py-1 rounded-full flex items-center">
                                <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                                <span className="text-xs text-green-400 font-medium">
                                  Verified
                                </span>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-neutral-400 mb-2">
                            Created:{" "}
                            {new Date(proof.timestamp).toLocaleString()}
                          </p>

                          {proof.txHash && (
                            <div className="mb-2">
                              <p className="text-xs text-neutral-500 font-mono bg-neutral-800/80 p-2 rounded truncate">
                                TX: {proof.txHash}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-700/30">
                          <Link
                            href={`/gallery/${proof.id}`}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors duration-300 text-sm"
                          >
                            View Details
                          </Link>

                          <div className="flex items-center gap-2">
                            {imageUrl && (
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 text-white rounded-lg transition-colors duration-300 text-sm flex items-center gap-1"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
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
                                <span>Full Image</span>
                              </a>
                            )}

                            {proof.ipfsMetadataUri && (
                              <a
                                href={
                                  getIPFSGatewayURL(proof.ipfsMetadataUri) ||
                                  "#"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 text-white rounded-lg transition-colors duration-300 text-sm flex items-center gap-1"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
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
                                <span>Metadata</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
