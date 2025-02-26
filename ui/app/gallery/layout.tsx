import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Gallery - ZK Media",
  description: "Gallery of images with ZK proofs",
};

export default function GalleryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">{children}</main>
  );
}
