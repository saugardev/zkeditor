# ZK Image Editor

A zero-knowledge proof image editor that verifies image transformations and allows to prove image provenance.

## How It Works

The ZK Image Editor creates a ZK proof for image transformations using [Succinct SP1](https://github.com/succinctlabs/sp1), allowing anyone to verify the authenticity and history of edited images. The system:

- **Binds transformations to images**: Computes the hashes of both original and transformed images
- **Provides trustless verification**: Anyone can verify the proof without trusting any participant
- **Creates immutable provenance chains**: Each verified proof establishes a link between the original image hash and the transformed image hash

When a user edits an image, the browser loads a WASM module compiled from the Rust library, allowing transformations to be rendered in real-time. Once editing is complete, both the original image and the list of transformations are sent to the Prover API.

The API processes the request through an SP1 program that applies each transformation, creates hashes for both original and transformed images, and verifies signatures. The resulting proof can be submitted to an instance of the [ImageVerifier](./img-editor/verifier/src/ImageVerifier.sol) contract for on-chain verification, creating an immutable record of the image's provenance.

For more details, see the [blog post](https://blog.succinct.xyz/tales-from-the-hacker-house-building-an-attested-image-editor/).

## Project Structure

The project consists of five core components:

1. **Image Processing Library** (`/img-editor/lib`): Rust library for image transformations, compiled to both WASM (browser) and RISC-V (SP1)
2. **SP1 Program** (`/img-editor/program`): Core SP1 program that generates proofs for image transformations
3. **Prover API** (`/img-editor/api`): Axum-based API that handles proof generation requests
4. **Image Verifier Contract** (`/contracts`): Smart contract for on-chain verification of image transformation proofs
5. **User Interface** (`/ui`): Next.js application with real-time image editing capabilities

## Building and Running

### Prerequisites

- Rust (latest stable)
- Node.js (v20+)
- Access to SP1 Prover Network (https://docs.succinct.xyz/docs/sp1/generating-proofs/prover-network)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saugardev/zkeditor.git
   cd zkeditor
   ```

2. **Build and run the API**:
   ```bash
   cd img-editor/api
   cargo run --release
   ```

3. **Run the UI**:
   ```bash
   cd ui
   pnpm install
   pnpm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

For detailed build and run instructions for each component, refer to their respective README files:
- [Image Library README](/img-editor/lib/README.md)
- [SP1 Program README](/img-editor/program/README.md)
- [API README](/img-editor/api/README.md)
- [Verifier Contract README](/img-editor/verifier/README.md)
- [UI README](/ui/README.md)
