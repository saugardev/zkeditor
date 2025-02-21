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
    event ProofVerified(bytes indexed imageData, bytes proof);

    constructor(address _verifier, bytes32 _imageTransformVKey) {
        verifier = _verifier;
        imageTransformVKey = _imageTransformVKey;
    }

    /// @notice Verifies a proof of image transformation
    /// @param _publicValues The encoded public values (image data)
    /// @param _proofBytes The encoded proof
    /// @return imageData The PNG image data that was transformed
    function verifyImageTransformProof(
        bytes calldata _publicValues,
        bytes calldata _proofBytes
    ) public returns (bytes memory imageData) {
        ISP1Verifier(verifier).verifyProof(
            imageTransformVKey,
            _publicValues,
            _proofBytes
        );

        imageData = _publicValues;
        emit ProofVerified(imageData, _proofBytes);
    }
} 