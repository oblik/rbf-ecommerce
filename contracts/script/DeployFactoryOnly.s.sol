// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RBFCampaignFactory.sol";

contract DeployFactoryOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        address businessRegistryAddress = 0x1b9BE43D71612bd47bca2CeC92055679B5a95167;
        
        // Ensure addresses are provided
        require(usdcAddress != address(0), "USDC_ADDRESS must be set in .env");
        require(businessRegistryAddress != address(0), "BusinessRegistry address not set");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy RBFCampaignFactory with both USDC and BusinessRegistry addresses
        RBFCampaignFactory factory = new RBFCampaignFactory(usdcAddress, businessRegistryAddress);
        
        console.log("RBFCampaignFactory deployed at:", address(factory));
        console.log("Using USDC at:", usdcAddress);
        console.log("Using BusinessRegistry at:", businessRegistryAddress);
        
        vm.stopBroadcast();
    }
}