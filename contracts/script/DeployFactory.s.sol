// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RBFCampaignFactory.sol";
import "../src/TestUSDC.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // If no USDC address provided, deploy TestUSDC
        if (usdcAddress == address(0)) {
            TestUSDC testUsdc = new TestUSDC();
            usdcAddress = address(testUsdc);
            console.log("TestUSDC deployed at:", usdcAddress);
        }
        
        RBFCampaignFactory factory = new RBFCampaignFactory(usdcAddress);
        
        console.log("RBFCampaignFactory deployed at:", address(factory));
        console.log("Using USDC at:", usdcAddress);
        
        vm.stopBroadcast();
    }
}