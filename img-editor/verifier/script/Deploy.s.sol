// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ImageVerifier} from "../src/ImageVerifier.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        bytes32 vkey = vm.envBytes32("IMAGE_TRANSFORM_VKEY");
        bytes32 salt = vm.envBytes32("DEPLOY_SALT");

        console.log("Environment variables loaded:");
        console.log("PRIVATE_KEY:", vm.toString(deployerPrivateKey));
        console.log("IMAGE_TRANSFORM_VKEY:", vm.toString(vkey));
        console.log("DEPLOY_SALT:", vm.toString(salt));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy using CREATE2 with salt
        ImageVerifier imageVerifier = new ImageVerifier{salt: salt}(
            vm.addr(deployerPrivateKey),
            vkey
        );
        
        vm.stopBroadcast();

        console.log("ImageVerifier deployed at:", address(imageVerifier));
    }
} 