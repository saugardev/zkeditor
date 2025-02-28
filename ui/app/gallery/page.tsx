"use client";

import { useEffect, useState } from "react";
import { getAllProofs } from "@/lib/database-service";
import Link from "next/link";
import { GalleryGrid } from "@/components/GalleryGrid";
import { ProofRecord } from "@/lib/database-service";

export default function GalleryPage() {
  const [proofs, setProofs] = useState<ProofRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProofs() {
      try {
        setLoading(true);
        const { success, data } = await getAllProofs();
        if (success && data) {
          setProofs(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching proofs:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProofs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 pb-16">
      {/* Header with blur effect */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-neutral-900/80 border-b border-neutral-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Image Gallery</h1>
              <div className="hidden sm:flex items-center bg-blue-900/30 px-3 py-1 rounded-full">
                <span className="text-xs text-blue-300 font-medium">
                  {proofs.length} {proofs.length === 1 ? "image" : "images"}
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 font-medium"
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Back to Editor
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center p-8 bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-neutral-700/50 max-w-md">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-6 text-neutral-300 font-medium">
                Loading gallery...
              </p>
              <p className="mt-2 text-neutral-500 text-sm">
                Please wait while we fetch your images
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
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
                Error Loading Gallery
              </h2>
              <p className="text-red-200 mb-6">
                Failed to load images. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && proofs.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center p-8 bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-neutral-700/50 max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Gallery Empty
              </h2>
              <p className="text-neutral-300 mb-6">
                No images found in the gallery. Create your first image to get
                started.
              </p>
              <Link
                href="/"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Your First Image
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && proofs.length > 0 && (
          <GalleryGrid proofs={proofs} />
        )}
      </div>
    </div>
  );
}
