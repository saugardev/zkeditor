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

    /// @notice Struct containing all image-related data
    struct ImageData {
        bytes32[] children;        // Transformed image hashes derived from this image
        bytes32 parent;           // Parent image hash (zero if original)
        address signerAddress;    // Address of the signer
        bool hasSignature;        // Whether the image has a signature
    }

    /// @notice Mapping from image hash to its data
    mapping(bytes32 => ImageData) public imageData;

    /// @notice Event emitted when a proof is verified
    event ProofVerified(
        bytes32 indexed originalImageHash,
        bytes32 indexed transformedImageHash,
        address indexed signerAddress,
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

        // Convert bytes32 to address by taking the last 20 bytes
        address signerAddress = address(uint160(uint256(signerPublicKey)));

        // Store transformed image data
        imageData[transformedImageHash].parent = originalImageHash;
        imageData[transformedImageHash].signerAddress = signerAddress;
        imageData[transformedImageHash].hasSignature = hasSignature;

        // Add to parent's children
        imageData[originalImageHash].children.push(transformedImageHash);

        emit ProofVerified(
            originalImageHash,
            transformedImageHash,
            signerAddress,
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

    /// @notice Get all transformed image hashes derived from an original image
    /// @param _imageHash The hash of the original image
    /// @return An array of transformed image hashes that are children of the original
    function getImageChildren(bytes32 _imageHash) external view returns (bytes32[] memory) {
        return imageData[_imageHash].children;
    }

    /// @notice Get the parent (original) image hash of a transformed image
    /// @param _transformedHash The hash of the transformed image
    /// @return The hash of the parent image
    function getImageParent(bytes32 _transformedHash) external view returns (bytes32) {
        return imageData[_transformedHash].parent;
    }

    /// @notice Check if an image hash is an original (has no parent)
    /// @param _imageHash The hash to check
    /// @return True if the image is original (has no parent), false otherwise
    function isOriginalImage(bytes32 _imageHash) external view returns (bool) {
        return imageData[_imageHash].parent == bytes32(0);
    }

    /// @notice Get the number of transformations (children) for an image
    /// @param _imageHash The hash of the image to check
    /// @return The number of direct transformations
    function getChildCount(bytes32 _imageHash) external view returns (uint256) {
        return imageData[_imageHash].children.length;
    }

    /// @notice Get the signature information for an image
    /// @param _imageHash The hash of the image to check
    /// @return signer The address of the signer
    /// @return signed Whether the image has a signature
    function getSignatureInfo(bytes32 _imageHash) external view returns (address signer, bool signed) {
        ImageData storage data = imageData[_imageHash];
        return (data.signerAddress, data.hasSignature);
    }
} 