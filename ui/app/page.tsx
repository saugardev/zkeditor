"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold text-white">
                    ✧ zkMedia
                  </span>
                </Link>
              </div>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link href="/" className="text-white hover:text-gray-300">
                  Home
                </Link>
                <Link
                  href="#features"
                  className="text-white hover:text-gray-300"
                >
                  Features
                </Link>
                <Link
                  href="#benefits"
                  className="text-white hover:text-gray-300"
                >
                  Benefits
                </Link>
                <Link
                  href="/gallery"
                  className="text-white hover:text-gray-300"
                >
                  Gallery
                </Link>
                <Link
                  href="#contact"
                  className="text-white hover:text-gray-300"
                >
                  Contact
                </Link>
              </div>
            </nav>
            <div>
              <Link
                href="/editor"
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-16"></div>

      {/* Hero Section */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-blue-900/20 px-3 py-1 text-sm">
              <span className="mr-2 rounded bg-blue-500 px-1.5 py-0.5 text-xs font-semibold uppercase text-white">
                NEW
              </span>
              <span className="text-gray-300">
                Explore the 2025 innovations in image verification
              </span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Ensure Image Authenticity
              <br />
              <span className="text-white">with Onchain ZK Proofs</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Leverage decentralized verification, cryptographic proofs, and
              traceability to confirm the originality of any image.
            </p>

            <div className="mt-10 flex justify-center">
              <Link
                href="/editor"
                className="flex items-center rounded-md bg-white px-6 py-3 text-base font-medium text-black hover:bg-gray-200"
              >
                Start Editing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Background gradient effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-900/20 blur-3xl"></div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-400">
              Blockchain Verification
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Cryptographic proof for your digital assets
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-400">
              Our platform combines zero-knowledge proofs with blockchain
              technology to ensure your images remain authentic and verifiable.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  Zero-Knowledge Verification
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                  <p className="flex-auto">
                    Verify image authenticity without revealing sensitive
                    information, maintaining privacy while ensuring trust.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  Immutable Blockchain Records
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                  <p className="flex-auto">
                    Every edit is recorded on the blockchain, creating a
                    permanent and transparent history of changes.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  Cryptographic Proofs
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                  <p className="flex-auto">
                    Generate mathematical proofs that verify image authenticity
                    without revealing the original content.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="benefits" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <h2 className="text-base font-semibold leading-7 text-blue-400">
                Benefits
              </h2>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Our solution
              </h3>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                Protect the authenticity of your images and detect modifications
                with advanced traceability technology and cryptographic testing.
                Security, transparency and verification without intermediaries.
              </p>
            </div>

            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Benefit Card 1 */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                  <div className="text-5xl font-bold text-gray-700 mb-4">
                    01
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Verified Authenticity, Effortlessly
                  </h3>
                  <p className="text-gray-400">
                    Upload your image and our platform will compare each version
                    to the original using zero-knowledge proofs (ZK Proofs).
                    Ensure provenance and prevent counterfeiting with blockchain
                    traceability.
                  </p>
                </div>

                {/* Benefit Card 2 */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                  <div className="text-5xl font-bold text-gray-700 mb-4">
                    02
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Avoid manipulations and frauds
                  </h3>
                  <p className="text-gray-400">
                    Edited images can distort reality. With our solution, you
                    can check the integrity of any visual file and validate its
                    modification history accurately.
                  </p>
                </div>

                {/* Benefit Card 3 */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                  <div className="text-5xl font-bold text-gray-700 mb-4">
                    03
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Total Traceability in Blockchain
                  </h3>
                  <p className="text-gray-400">
                    Each recorded image gets an immutable hash that guarantees
                    its authenticity. Verify any changes and access the full
                    history without relying on third parties. Security is in
                    your hands.
                  </p>
                </div>

                {/* Benefit Card 4 */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
                  <div className="text-5xl font-bold text-gray-700 mb-4">
                    04
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Advanced Technology, Intuitive Use
                  </h3>
                  <p className="text-gray-400">
                    Our platform combines Celestia, SZ Proofs, and blockchain to
                    offer a robust and accessible verification solution. Upload,
                    verify, and share images with complete confidence in their
                    legitimacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact/CTA Section */}
      <div id="contact" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to secure your images?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-400">
              Start using our blockchain-powered verification platform today and
              ensure the authenticity of your digital assets.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/editor"
                className="rounded-md bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Get started
              </Link>
              <Link
                href="#features"
                className="text-sm font-semibold leading-6 text-white"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a
              href="https://twitter.com/zkMediaLabs"
              className="text-gray-400 hover:text-gray-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} zkMedia. All rights reserved.
            </p>
          </div>
          <nav className="mt-8 md:order-3 md:mt-0">
            <ul className="flex justify-center space-x-6 md:justify-end">
              <li>
                <Link
                  href="/privacy"
                  className="text-xs leading-5 text-gray-400 hover:text-gray-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-xs leading-5 text-gray-400 hover:text-gray-300"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
