// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ImageVerifier} from "../src/ImageVerifier.sol";
import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

contract MockSP1Verifier is ISP1Verifier {
    function verifyProof(
        bytes32 vkey,
        bytes calldata publicValues,
        bytes calldata proof
    ) external pure override {
        // Basic validation
        require(vkey != bytes32(0), "Invalid vkey");
        require(publicValues.length > 0, "Invalid public values");
        
        // Verify the actual proof matches our known good proof
        bytes memory expectedProof = hex"11b6a09d16cb34a923bf3916729f5055f8b00818dfaff3af10eb6d872aab1fdaa15afd3d1d526768e87949d637501454a2826c356ec4d902426f575b08f95003b221a2c722ff2beca8f43ce49d8767e25f6b0e1862c788951887225b00e4fbaa0d3b7d08175a526744b373192f20a52c1b04235409eddb978cea4b73f09423f4eec724ec0f788404fbe4d1f977e8f5d039eee6f711880da6b5f9605cf7d2f6941fe446103024bf4b3ce6939aaff7d52b6b413ba1bcf523cc202ee22bd18ad15b2e935b520cd10b68f3cde30e3f33e7894f5078012e10dcbee0d89af20a28a5ae5cb47f93128714438cb745988af786a08fc93ae38549bfb380c8576057c10f0ead4a2f0a";
        
        require(keccak256(proof) == keccak256(expectedProof), "Invalid proof data");
    }
}

contract ImageVerifierTest is Test {
    ImageVerifier public verifier;
    MockSP1Verifier public mockSp1Verifier;
    bytes32 public constant TEST_VKEY = bytes32(uint256(1));
    bytes32 public constant REAL_VKEY = 0x007261dcd0ab391f9c56656f0de02002bc0dfb375275dccbb600ab283df7f8f5;

    function setUp() public {
        mockSp1Verifier = new MockSP1Verifier();
        verifier = new ImageVerifier(address(mockSp1Verifier), TEST_VKEY);
    }

    function testVerifyImageTransformProof() public {
        // Setup verifier with real vkey
        ImageVerifier realVerifier = new ImageVerifier(address(mockSp1Verifier), REAL_VKEY);
        
        string memory imageId = "1788e580c16eb58097b7f698af8ca60e5e4609d4fdcb9d08f1b7d37f15213249";
        bytes memory publicValues = abi.encode(imageId);
        bytes memory proofData = hex"11b6a09d16cb34a923bf3916729f5055f8b00818dfaff3af10eb6d872aab1fdaa15afd3d1d526768e87949d637501454a2826c356ec4d902426f575b08f95003b221a2c722ff2beca8f43ce49d8767e25f6b0e1862c788951887225b00e4fbaa0d3b7d08175a526744b373192f20a52c1b04235409eddb978cea4b73f09423f4eec724ec0f788404fbe4d1f977e8f5d039eee6f711880da6b5f9605cf7d2f6941fe446103024bf4b3ce6939aaff7d52b6b413ba1bcf523cc202ee22bd18ad15b2e935b520cd10b68f3cde30e3f33e7894f5078012e10dcbee0d89af20a28a5ae5cb47f93128714438cb745988af786a08fc93ae38549bfb380c8576057c10f0ead4a2f0a";

        string memory returnedId = realVerifier.verifyImageTransformProof(
            publicValues,
            proofData
        );

        assertEq(returnedId, imageId, "Returned ID should match input ID");
    }

    function testFailVerifyWithInvalidProof() public {
        string memory testId = "test-image-1";
        bytes memory publicValues = abi.encode(testId);
        bytes memory emptyProof = new bytes(0);

        verifier.verifyImageTransformProof(publicValues, emptyProof);
    }

    function testVerifyWithRealData() public {
        // Setup verifier with real vkey
        ImageVerifier realVerifier = new ImageVerifier(address(mockSp1Verifier), REAL_VKEY);
        
        // Real data
        string memory imageId = "1788e580c16eb58097b7f698af8ca60e5e4609d4fdcb9d08f1b7d37f15213249";
        bytes memory publicValues = abi.encode(imageId);
        bytes memory proofData = hex"11b6a09d16cb34a923bf3916729f5055f8b00818dfaff3af10eb6d872aab1fdaa15afd3d1d526768e87949d637501454a2826c356ec4d902426f575b08f95003b221a2c722ff2beca8f43ce49d8767e25f6b0e1862c788951887225b00e4fbaa0d3b7d08175a526744b373192f20a52c1b04235409eddb978cea4b73f09423f4eec724ec0f788404fbe4d1f977e8f5d039eee6f711880da6b5f9605cf7d2f6941fe446103024bf4b3ce6939aaff7d52b6b413ba1bcf523cc202ee22bd18ad15b2e935b520cd10b68f3cde30e3f33e7894f5078012e10dcbee0d89af20a28a5ae5cb47f93128714438cb745988af786a08fc93ae38549bfb380c8576057c10f0ead4a2f0a";

        string memory returnedId = realVerifier.verifyImageTransformProof(
            publicValues,
            proofData
        );

        assertEq(returnedId, imageId, "Returned ID should match input ID");
    }

    function testFailWithWrongProofData() public {
        ImageVerifier realVerifier = new ImageVerifier(address(mockSp1Verifier), REAL_VKEY);
        
        string memory imageId = "1788e580c16eb58097b7f698af8ca60e5e4609d4fdcb9d08f1b7d37f15213249";
        bytes memory publicValues = abi.encode(imageId);
        // Different proof data that should fail
        bytes memory wrongProofData = hex"deadbeef11b6a09d16cb34a923bf3916729f5055f8b00818dfaff3af10eb6d872aab1fdaa15afd3d1d526768e87949d637501454a2826c356ec4d902426f575b08f95003";

        realVerifier.verifyImageTransformProof(
            publicValues,
            wrongProofData
        );
    }
} 