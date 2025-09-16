// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "@forge-std/Test.sol";
import {AutomationRegistry} from "../src/AutomationRegistry.sol";

// Mock contracts for testing
contract MockCampaignFactory {
    address[] public repaymentCampaigns;
    mapping(address => bool) public validCampaigns;
    
    function addRepaymentCampaign(address campaign) external {
        repaymentCampaigns.push(campaign);
        validCampaigns[campaign] = true;
    }
    
    function getRepaymentCampaigns() external view returns (address[] memory) {
        return repaymentCampaigns;
    }
    
    function isValidCampaign(address campaign) external view returns (bool) {
        return validCampaigns[campaign];
    }
}

contract MockCampaign {
    uint256 public nextPaymentDue;
    bool public repaymentActive;
    address public campaignOwner;
    uint256 public lastRevenueShare;
    
    constructor(address _owner, bool _repaymentActive) {
        campaignOwner = _owner;
        repaymentActive = _repaymentActive;
        nextPaymentDue = block.timestamp + 30 days; // Start with future payment
    }
    
    function getNextPaymentDue() external view returns (uint256) {
        return nextPaymentDue;
    }
    
    function owner() external view returns (address) {
        return campaignOwner;
    }
    
    function submitRevenueShare(uint256 revenueAmount) external {
        lastRevenueShare = revenueAmount;
        // Update next payment due (30 days from now)
        nextPaymentDue = block.timestamp + 30 days;
    }
    
    function setNextPaymentDue(uint256 _nextPaymentDue) external {
        nextPaymentDue = _nextPaymentDue;
    }
}

contract AutomationRegistryTest is Test {
    AutomationRegistry public automationRegistry;
    MockCampaignFactory public mockFactory;
    MockCampaign public mockCampaign;
    
    address public owner = makeAddr("owner");
    address public executor = makeAddr("executor");
    address public campaignOwner = makeAddr("campaignOwner");
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock factory
        mockFactory = new MockCampaignFactory();
        
        // Deploy automation registry
        automationRegistry = new AutomationRegistry(address(mockFactory));
        
        // Create mock campaign
        mockCampaign = new MockCampaign(campaignOwner, true);
        
        // Add campaign to factory
        mockFactory.addRepaymentCampaign(address(mockCampaign));
        
        vm.stopPrank();
    }
    
    function testDeployment() public view {
        assertEq(address(automationRegistry.campaignFactory()), address(mockFactory));
        assertTrue(automationRegistry.authorizedExecutors(owner));
    }
    
    function testAuthorizeExecutor() public {
        vm.prank(owner);
        automationRegistry.authorizeExecutor(executor);
        
        assertTrue(automationRegistry.authorizedExecutors(executor));
    }
    
    function testCreateRevenueCollectionJob() public {
        vm.prank(owner);
        bytes32 jobId = automationRegistry.createRevenueCollectionJob(
            address(mockCampaign),
            1000e6 // 1000 USDC
        );
        
        (
            address campaign,
            uint256 revenueAmount,
            uint256 executionTime,
            bool executed,
            address jobExecutor
        ) = automationRegistry.getJobDetails(jobId);
        
        assertEq(campaign, address(mockCampaign));
        assertEq(revenueAmount, 1000e6);
        assertEq(executionTime, block.timestamp);
        assertFalse(executed);
        assertEq(jobExecutor, owner);
    }
    
    function testExecuteRevenueCollection() public {
        uint256 revenueAmount = 1000e6;
        
        // Create job
        vm.prank(owner);
        bytes32 jobId = automationRegistry.createRevenueCollectionJob(
            address(mockCampaign),
            revenueAmount
        );
        
        // Execute job
        vm.prank(owner);
        automationRegistry.executeRevenueCollection(jobId);
        
        // Check job was executed
        (, , , bool executed, ) = automationRegistry.getJobDetails(jobId);
        assertTrue(executed);
        
        // Check campaign received revenue share
        assertEq(mockCampaign.lastRevenueShare(), revenueAmount);
    }
    
    function testOverduePaymentPenalty() public {
        uint256 revenueAmount = 1000e6;
        
        // Set a specific timestamp to avoid underflow
        vm.warp(1000000); // Set to a large timestamp
        
        // Make campaign overdue by 8 days (1 day past grace period)
        uint256 overdueTime = block.timestamp - 8 days;
        mockCampaign.setNextPaymentDue(overdueTime);
        
        // Create and execute job
        vm.startPrank(owner);
        bytes32 jobId = automationRegistry.createRevenueCollectionJob(
            address(mockCampaign),
            revenueAmount
        );
        automationRegistry.executeRevenueCollection(jobId);
        vm.stopPrank();
        
        // Should have 1% penalty (1 day overdue)
        uint256 expectedPenalty = (revenueAmount * 100) / 10000; // 1%
        uint256 expectedTotal = revenueAmount + expectedPenalty;
        
        assertEq(mockCampaign.lastRevenueShare(), expectedTotal);
    }
    
    function testGetOverdueCampaigns() public {
        // Set a specific timestamp to avoid underflow
        vm.warp(1000000); // Set to a large timestamp
        
        // Make campaign overdue
        uint256 overdueTime = block.timestamp - 8 days;
        mockCampaign.setNextPaymentDue(overdueTime);
        
        address[] memory overdue = automationRegistry.getOverdueCampaigns();
        
        assertEq(overdue.length, 1);
        assertEq(overdue[0], address(mockCampaign));
    }
    
    function testUnauthorizedExecutorCannotCreateJob() public {
        vm.prank(executor); // Not authorized
        vm.expectRevert("Not authorized executor");
        automationRegistry.createRevenueCollectionJob(address(mockCampaign), 1000e6);
    }
}