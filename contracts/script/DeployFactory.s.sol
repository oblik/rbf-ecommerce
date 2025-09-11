// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RBFCampaignFactory.sol";
import "../src/BusinessRegistry.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        // Use existing deployed addresses on Base Sepolia
        address businessRegistryAddress = 0x1b9BE43D71612bd47bca2CeC92055679B5a95167;
        address factoryAddress = 0x8180E2B27BC4F01e97Ffc6bbC10b5C679ad716A7;
        
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Base Sepolia");
        console.log("BusinessRegistry:", businessRegistryAddress);
        console.log("RBFCampaignFactory:", factoryAddress);
        console.log("USDC:", usdcAddress);
        console.log("=========================");
        
        // Contracts are already deployed - no need to redeploy
        console.log("Contracts already deployed successfully!");
    }
}