// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

/// @title ImageVerifier
/// @author ZKMedia
/// @notice This contract verifies proofs of image transformations
contract ImageVerifier {
    /// @notice The address of the SP1 verifier contract
    address public verifier;

    /// @notice The verification key for the image transformation program
    bytes32 public imageTransformVKey;

    /// @notice Event emitted when a proof is verified
    event ProofVerified(
        bytes32 indexed originalImageHash,
        bytes32 indexed transformedImageHash,
        bytes32 indexed signerPublicKey,
        bool hasSignature,
        bytes proof
    );

    constructor(address _verifier, bytes32 _imageTransformVKey) {
        verifier = _verifier;
        imageTransformVKey = _imageTransformVKey;
    }

    /// @notice Verifies a proof of image transformation
    /// @param _publicValues The encoded public values
    /// @param _proofBytes The encoded proof
    /// @return originalImageHash The hash of the original image
    /// @return transformedImageHash The hash of the transformed image
    /// @return signerPublicKey The public key of the signer (if any)
    /// @return hasSignature Whether the image was signed
    function verifyImageTransformProof(
        bytes calldata _publicValues,
        bytes calldata _proofBytes
    ) public returns (
        bytes32 originalImageHash,
        bytes32 transformedImageHash,
        bytes32 signerPublicKey,
        bool hasSignature
    ) {
        ISP1Verifier(verifier).verifyProof(
            imageTransformVKey,
            _publicValues,
            _proofBytes
        );

        (originalImageHash, transformedImageHash, signerPublicKey, hasSignature) = 
            abi.decode(_publicValues, (bytes32, bytes32, bytes32, bool));

        emit ProofVerified(
            originalImageHash,
            transformedImageHash,
            signerPublicKey,
            hasSignature,
            _proofBytes
        );
    }

    /// @notice Decodes SP1 public values into PNG data by removing the 8-byte prefix
    /// @param _publicValues The SP1 public values (includes 8 byte prefix)
    /// @return The raw PNG data
    function decodePublicValues(bytes calldata _publicValues) public pure returns (bytes memory) {
        require(_publicValues.length > 8, "Invalid public values length");
        
        // Create new bytes array without prefix
        bytes memory pngData = new bytes(_publicValues.length - 8);
        
        // Copy bytes after prefix
        for(uint i = 8; i < _publicValues.length; i++) {
            pngData[i - 8] = _publicValues[i];
        }
        
        return pngData;
    }
} 