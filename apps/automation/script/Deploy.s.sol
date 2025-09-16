// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "@forge-std/Script.sol";
import {AutomationRegistry} from "../src/AutomationRegistry.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        // Get environment variables
        address campaignFactory = vm.envAddress("CAMPAIGN_FACTORY_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        require(campaignFactory != address(0), "CAMPAIGN_FACTORY_ADDRESS not set");
        require(deployerPrivateKey != 0, "PRIVATE_KEY not set");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy AutomationRegistry
        AutomationRegistry automationRegistry = new AutomationRegistry(campaignFactory);
        
        console.log("AutomationRegistry deployed to:", address(automationRegistry));
        console.log("Campaign Factory:", campaignFactory);
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.stopBroadcast();

        // Save deployment info
        string memory json = string(abi.encodePacked(
            '{"automationRegistry":"', vm.toString(address(automationRegistry)), '"',
            ',"campaignFactory":"', vm.toString(campaignFactory), '"',
            ',"deployer":"', vm.toString(vm.addr(deployerPrivateKey)), '"',
            ',"network":"', vm.toString(block.chainid), '"',
            ',"timestamp":"', vm.toString(block.timestamp), '"}'
        ));
        
        vm.writeFile("./deployment.json", json);
        console.log("Deployment info saved to deployment.json");
    }
}