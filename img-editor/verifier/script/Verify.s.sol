// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ImageVerifier} from "../src/ImageVerifier.sol";
import {console} from "forge-std/console.sol";
import {ISP1VerifierWithHash} from "@sp1-contracts/ISP1Verifier.sol";
import {SP1Verifier} from "@sp1-contracts/v4.0.0-rc.3/SP1VerifierGroth16.sol";

contract Verify is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory rpcUrl = "https://sepolia.base.org";
        
        string memory root = vm.projectRoot();
        
        // Read verification key from env
        bytes32 REAL_VKEY = vm.envBytes32("IMAGE_TRANSFORM_VKEY");
        
        // Read proof from binary file
        bytes memory proofData = vm.readFileBinary(string.concat(root, "/script/proof.bin"));
        
        // Read public values from binary file
        bytes memory publicValues = vm.readFileBinary(string.concat(root, "/script/public_values.bin"));
        
        vm.createSelectFork(rpcUrl);
        
        ImageVerifier verifier = ImageVerifier(0x4774679E67637c9db1A6275180be003f25609C51);
        require(verifier.imageTransformVKey() == REAL_VKEY, "Wrong vkey");
        
        address sp1verifier = verifier.verifier();
        console.log("SP1 Verifier address:", sp1verifier);
        
        try ISP1VerifierWithHash(sp1verifier).VERIFIER_HASH() returns (bytes32 hash) {
            console.log("SP1 Verifier hash:", vm.toString(hash));
            console.log("First 4 bytes should be:", vm.toString(bytes4(hash)));
        } catch {
            console.log("Could not get verifier hash");
        }

        console.log("Proof first 4 bytes:", vm.toString(bytes4(proofData)));

        vm.startBroadcast(deployerPrivateKey);
        (bytes32 originalImageHash, bytes32 transformedImageHash, bytes32 signerPublicKey, bool hasSignature) = verifier.verifyImageTransformProof(
            publicValues,
            proofData
        );
        vm.stopBroadcast();
        
        console.log("Original image hash:", vm.toString(originalImageHash));
        console.log("Transformed image hash:", vm.toString(transformedImageHash));
        console.log("Signer public key:", vm.toString(signerPublicKey));
        console.log("Has signature:", hasSignature);
    }
} 