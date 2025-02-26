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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Image Gallery</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Editor
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-neutral-400">Loading gallery...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
          Failed to load images. Please try again later.
        </div>
      )}

      {!loading && !error && proofs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-neutral-400">
            No images found in the gallery.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create your first image
          </Link>
        </div>
      )}

      {!loading && !error && proofs.length > 0 && (
        <GalleryGrid proofs={proofs} />
      )}
    </div>
  );
}
