// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RBFCampaignFactory.sol";
import "../src/BusinessRegistry.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        // Ensure USDC address is provided
        require(usdcAddress != address(0), "USDC_ADDRESS must be set in .env");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy BusinessRegistry first
        BusinessRegistry businessRegistry = new BusinessRegistry();
        console.log("BusinessRegistry deployed at:", address(businessRegistry));
        
        // Deploy RBFCampaignFactory with both USDC and BusinessRegistry addresses
        RBFCampaignFactory factory = new RBFCampaignFactory(usdcAddress, address(businessRegistry));
        
        console.log("RBFCampaignFactory deployed at:", address(factory));
        console.log("Using USDC at:", usdcAddress);
        
        vm.stopBroadcast();
    }
}