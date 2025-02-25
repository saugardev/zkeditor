export const imageVerifierAbi = [
  {
    inputs: [
      { internalType: "address", name: "_verifier", type: "address" },
      { internalType: "bytes32", name: "_imageTransformVKey", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "originalImageHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "transformedImageHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "signerAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "hasSignature",
        type: "bool",
      },
      { indexed: false, internalType: "bytes", name: "proof", type: "bytes" },
    ],
    name: "ProofVerified",
    type: "event",
  },
  {
    inputs: [{ internalType: "bytes", name: "_publicValues", type: "bytes" }],
    name: "decodePublicValues",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_imageHash", type: "bytes32" }],
    name: "getChildCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_imageHash", type: "bytes32" }],
    name: "getImageChildren",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_transformedHash", type: "bytes32" },
    ],
    name: "getImageParent",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_imageHash", type: "bytes32" }],
    name: "getSignatureInfo",
    outputs: [
      { internalType: "address", name: "signer", type: "address" },
      { internalType: "bool", name: "signed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "imageData",
    outputs: [
      { internalType: "bytes32", name: "parent", type: "bytes32" },
      { internalType: "address", name: "signerAddress", type: "address" },
      { internalType: "bool", name: "hasSignature", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "imageTransformVKey",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_imageHash", type: "bytes32" }],
    name: "isOriginalImage",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "verifier",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "_publicValues", type: "bytes" },
      { internalType: "bytes", name: "_proofBytes", type: "bytes" },
    ],
    name: "verifyImageTransformProof",
    outputs: [
      { internalType: "bytes32", name: "originalImageHash", type: "bytes32" },
      {
        internalType: "bytes32",
        name: "transformedImageHash",
        type: "bytes32",
      },
      { internalType: "bytes32", name: "signerPublicKey", type: "bytes32" },
      { internalType: "bool", name: "hasSignature", type: "bool" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
