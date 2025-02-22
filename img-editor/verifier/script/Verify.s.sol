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
        
        ImageVerifier verifier = ImageVerifier(0x97c6568c9941e45D4cCCbfBf7Da838470C936930);
        require(verifier.imageTransformVKey() == REAL_VKEY, "Wrong vkey");
        
        bytes memory pngData = verifier.decodePublicValues(publicValues);
        
        vm.writeFileBinary(string.concat(root, "/script/decoded_image.png"), pngData);
        console.log("Decoded image saved as decoded_image.png");
        
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
        bytes memory returnedData = verifier.verifyImageTransformProof(
            publicValues,
            proofData
        );
        vm.stopBroadcast();
        
        // Since we're reading raw bytes now, we need to decode the returnedId to match the format
        require(keccak256(returnedData) == keccak256(publicValues), "Verification failed");
    }
} 