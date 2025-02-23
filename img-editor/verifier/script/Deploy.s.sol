// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ImageVerifier} from "../src/ImageVerifier.sol";
import {SP1Verifier} from "@sp1-contracts/v4.0.0-rc.3/SP1VerifierGroth16.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        bytes32 vkey = bytes32(0x003bea7317440f6a314441219533085c36f8b15ffb0da0d3627b17c46b5f438e);
        
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