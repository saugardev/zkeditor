# ZK Image Editor

An image editor that can generate zero-knowledge proofs for transformations using the SP1 zkVM.

## Requirements

- Rust 1.82.0
- Node.js 23.11.0
- wasm-pack (https://rustwasm.github.io/wasm-pack/installer/)
- Access to SP1 Prover Network (https://docs.succinct.xyz/docs/sp1/generating-proofs/prover-network)

## Features

- Basic image transformations (rotate, flip, crop, etc.)
- Region-based transformations
- Text overlay support
- Proof generation for all transformations
- WASM-based frontend for real-time editing
- Multi-tab support

## WIP Features
- Undo/redo support
- Image export

## Project Structure

- `/img-editor/api` - Axum-based REST API for proof generation
- `/img-editor/program` - SP1 RISC-V program for ZK proofs
- `/img-editor/lib` - Shared Rust library for image processing and WASM bindings
- `/ui` - Next.js frontend application

## Local Development

```bash
# Build WASM module
cd ui
pnpm install
pnpm run build:wasm

# Start development server
pnpm dev
```

## API Server

```bash
cd api
cargo run
```

## Generating Proofs (TODO)