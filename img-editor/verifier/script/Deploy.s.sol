// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ImageVerifier} from "../src/ImageVerifier.sol";
import {SP1Verifier} from "@sp1-contracts/v4.0.0-rc.3/SP1VerifierGroth16.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        bytes32 vkey = bytes32(0x0098b93fac3c1779fac511286c4a3088a4cacac4c4c239a205be90135eb73e68);
        
        console.log("Deploying with verification key:", vm.toString(vkey));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy SP1Verifier first
        SP1Verifier sp1Verifier = new SP1Verifier();
        console.log("SP1Verifier deployed at:", address(sp1Verifier));

        // Deploy ImageVerifier using the SP1Verifier address
        ImageVerifier imageVerifier = new ImageVerifier(
            address(sp1Verifier),
            vkey
        );
        
        vm.stopBroadcast();

        console.log("ImageVerifier deployed at:", address(imageVerifier));
    }
} 