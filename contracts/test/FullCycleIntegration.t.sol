// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RBFCampaign.sol";
import "../src/RBFCampaignFactory.sol";
import "../src/BusinessRegistry.sol";
import "../src/TestUSDC.sol";

contract FullCycleIntegrationTest is Test {
    RBFCampaignFactory public factory;
    BusinessRegistry public businessRegistry;
    TestUSDC public usdc;
    RBFCampaign public campaign;
    
    address public businessOwner = makeAddr("businessOwner");
    address public investor1 = makeAddr("investor1");
    address public investor2 = makeAddr("investor2");
    address public investor3 = makeAddr("investor3");
    
    string constant BUSINESS_NAME = "Tech Startup Inc.";
    string constant BUSINESS_METADATA = "ipfs://business-metadata";
    string constant CAMPAIGN_METADATA = "ipfs://campaign-metadata";
    uint256 constant FUNDING_GOAL = 100_000e6; // 100k USDC
    uint256 constant FUNDING_PERIOD = 30; // 30 days
    uint256 constant REVENUE_SHARE = 500; // 5%
    uint256 constant REPAYMENT_CAP = 15000; // 1.5x (150%)
    
    function setUp() public {
        // Deploy contracts
        usdc = new TestUSDC();
        businessRegistry = new BusinessRegistry();
        factory = new RBFCampaignFactory(address(usdc), address(businessRegistry));
        
        // Register business
        vm.prank(businessOwner);
        businessRegistry.registerBusiness(BUSINESS_NAME, BUSINESS_METADATA);
        
        // Create campaign
        vm.prank(businessOwner);
        address campaignAddr = factory.createCampaign(
            CAMPAIGN_METADATA,
            FUNDING_GOAL,
            FUNDING_PERIOD,
            REVENUE_SHARE,
            REPAYMENT_CAP
        );
        
        campaign = RBFCampaign(payable(campaignAddr));
        
        // Give participants USDC
        usdc.mint(investor1, 50_000e6);
        usdc.mint(investor2, 40_000e6);
        usdc.mint(investor3, 30_000e6);
        usdc.mint(businessOwner, 1_000_000e6); // For revenue sharing
    }
    
    function testCompleteRBFCycle() public {
        console.log("=== Starting Complete RBF Funding and Repayment Cycle ===");
        
        // === PHASE 1: FUNDING ===
        console.log("\n--- Phase 1: Campaign Funding ---");
        
        // Initial state verification
        assertEq(campaign.fundingActive(), true, "Funding should be active");
        assertEq(campaign.repaymentActive(), false, "Repayment should not be active");
        assertEq(campaign.totalFunded(), 0, "No funds raised initially");
        
        // Investor 1 contributes 40k
        console.log("Investor 1 contributing 40k USDC...");
        vm.startPrank(investor1);
        usdc.approve(address(campaign), 40_000e6);
        campaign.contribute(40_000e6);
        vm.stopPrank();
        
        assertEq(campaign.contributions(investor1), 40_000e6, "Investor 1 contribution recorded");
        assertEq(campaign.totalFunded(), 40_000e6, "Total funded updated");
        assertEq(campaign.getContributorCount(), 1, "Contributor count increased");
        
        // Investor 2 contributes 35k
        console.log("Investor 2 contributing 35k USDC...");
        vm.startPrank(investor2);
        usdc.approve(address(campaign), 35_000e6);
        campaign.contribute(35_000e6);
        vm.stopPrank();
        
        assertEq(campaign.totalFunded(), 75_000e6, "Total funded: 75k");
        assertEq(campaign.fundingActive(), true, "Still in funding phase");
        
        // Investor 3 contributes final 25k to reach goal
        console.log("Investor 3 contributing final 25k USDC to reach goal...");
        uint256 businessBalanceBefore = usdc.balanceOf(businessOwner);
        
        vm.startPrank(investor3);
        usdc.approve(address(campaign), 25_000e6);
        campaign.contribute(25_000e6);
        vm.stopPrank();
        
        // Verify funding goal reached and phase transition
        assertEq(campaign.totalFunded(), FUNDING_GOAL, "Funding goal reached");
        assertEq(campaign.fundingActive(), false, "Funding phase ended");
        assertEq(campaign.repaymentActive(), true, "Repayment phase started");
        
        // Business should receive the funds
        uint256 businessBalanceAfter = usdc.balanceOf(businessOwner);
        assertEq(businessBalanceAfter - businessBalanceBefore, FUNDING_GOAL, "Business received funding");
        
        console.log("Funding phase completed successfully!");
        
        // === PHASE 2: REVENUE SHARING ===
        console.log("\n--- Phase 2: Revenue Sharing ---");
        
        // Advance time by 31 days to allow first revenue submission
        vm.warp(block.timestamp + 31 days);
        
        // Month 1: Revenue share of 20k (5% = 1k to investors)
        console.log("Month 1: Submitting revenue share for 20k monthly revenue...");
        uint256 monthlyRevenue1 = 20_000e6;
        uint256 expectedShare1 = (monthlyRevenue1 * REVENUE_SHARE) / 10000; // 1k USDC
        
        vm.startPrank(businessOwner);
        usdc.approve(address(campaign), expectedShare1);
        campaign.submitRevenueShare(monthlyRevenue1);
        vm.stopPrank();
        
        // Verify revenue share distribution proportional to contributions
        uint256 investor1Share1 = (expectedShare1 * campaign.contributions(investor1)) / FUNDING_GOAL;
        uint256 investor2Share1 = (expectedShare1 * campaign.contributions(investor2)) / FUNDING_GOAL;
        uint256 investor3Share1 = (expectedShare1 * campaign.contributions(investor3)) / FUNDING_GOAL;
        
        assertEq(campaign.pendingReturns(investor1), investor1Share1, "Investor 1 share month 1");
        assertEq(campaign.pendingReturns(investor2), investor2Share1, "Investor 2 share month 1");
        assertEq(campaign.pendingReturns(investor3), investor3Share1, "Investor 3 share month 1");
        assertEq(campaign.totalRepaid(), expectedShare1, "Total repaid month 1");
        
        // Advance to month 2
        vm.warp(block.timestamp + 30 days);
        
        // Month 2: Higher revenue of 30k (5% = 1.5k to investors)
        console.log("Month 2: Submitting revenue share for 30k monthly revenue...");
        uint256 monthlyRevenue2 = 30_000e6;
        uint256 expectedShare2 = (monthlyRevenue2 * REVENUE_SHARE) / 10000; // 1.5k USDC
        
        vm.startPrank(businessOwner);
        usdc.approve(address(campaign), expectedShare2);
        campaign.submitRevenueShare(monthlyRevenue2);
        vm.stopPrank();
        
        // Total accumulated returns should now include both months
        uint256 totalExpectedShare = expectedShare1 + expectedShare2;
        assertEq(campaign.totalRepaid(), totalExpectedShare, "Total repaid after month 2");
        
        // === PHASE 3: INVESTOR WITHDRAWALS ===
        console.log("\n--- Phase 3: Investor Withdrawals ---");
        
        // Investor 1 withdraws returns
        console.log("Investor 1 withdrawing returns...");
        uint256 investor1BalanceBefore = usdc.balanceOf(investor1);
        uint256 investor1TotalReturns = campaign.pendingReturns(investor1);
        
        vm.prank(investor1);
        campaign.withdrawReturns();
        
        uint256 investor1BalanceAfter = usdc.balanceOf(investor1);
        assertEq(investor1BalanceAfter - investor1BalanceBefore, investor1TotalReturns, "Investor 1 withdrawal");
        assertEq(campaign.pendingReturns(investor1), 0, "Investor 1 returns cleared");
        
        // Continue revenue sharing for several more months
        console.log("\n--- Continuing Revenue Sharing (Months 3-10) ---");
        
        for (uint256 month = 3; month <= 10; month++) {
            vm.warp(block.timestamp + 30 days);
            
            // Simulate varying monthly revenue (15k to 40k)
            uint256 monthlyRevenue = 15_000e6 + (month * 2_500e6);
            uint256 expectedShare = (monthlyRevenue * REVENUE_SHARE) / 10000;
            
            vm.startPrank(businessOwner);
            usdc.approve(address(campaign), expectedShare);
            campaign.submitRevenueShare(monthlyRevenue);
            vm.stopPrank();
            
            console.log("Month completed, revenue submitted");
        }
        
        // === PHASE 4: REPAYMENT CAP VERIFICATION ===
        console.log("\n--- Phase 4: Repayment Cap Check ---");
        
        uint256 totalRepaidFinal = campaign.totalRepaid();
        uint256 maxRepayment = (FUNDING_GOAL * REPAYMENT_CAP) / 10000; // 150k USDC max
        
        console.log("Checking repayment cap compliance");
        
        // All investors withdraw final returns
        vm.prank(investor1); // Investor 1 needs to withdraw again after more revenue shares
        campaign.withdrawReturns();
        
        vm.prank(investor2);
        campaign.withdrawReturns();
        
        vm.prank(investor3);
        campaign.withdrawReturns();
        
        console.log("All investors have withdrawn their returns");
        
        // === PHASE 5: FINAL STATE VERIFICATION ===
        console.log("\n--- Phase 5: Final State Verification ---");
        
        // Verify final state
        assertEq(campaign.fundingActive(), false, "Funding remains inactive");
        assertEq(campaign.repaymentActive(), true, "Repayment remains active");
        
        // Calculate total repaid and verify it's reasonable
        uint256 totalRepaidActual = campaign.totalRepaid();
        assertTrue(totalRepaidActual > 0, "Some repayment occurred");
        assertTrue(totalRepaidActual <= maxRepayment, "Total repaid within cap");
        
        // Check that all pending returns are withdrawn
        assertEq(campaign.pendingReturns(investor1), 0, "No pending returns for investor 1");
        assertEq(campaign.pendingReturns(investor2), 0, "No pending returns for investor 2");
        assertEq(campaign.pendingReturns(investor3), 0, "No pending returns for investor 3");
        
        console.log("=== Complete RBF Cycle Test Successful! ===");
        console.log("Final ROI analysis completed");
    }
    
    function testRefundScenario() public {
        console.log("=== Testing Refund Scenario ===");
        
        // Partial funding only
        vm.startPrank(investor1);
        usdc.approve(address(campaign), 30_000e6);
        campaign.contribute(30_000e6);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        usdc.approve(address(campaign), 20_000e6);
        campaign.contribute(20_000e6);
        vm.stopPrank();
        
        assertEq(campaign.totalFunded(), 50_000e6, "Partial funding only");
        
        // Advance past deadline without reaching goal
        vm.warp(campaign.fundingDeadline() + 1);
        
        // Investors should be able to get refunds
        uint256 investor1BalanceBefore = usdc.balanceOf(investor1);
        vm.prank(investor1);
        campaign.refund();
        
        uint256 investor1BalanceAfter = usdc.balanceOf(investor1);
        assertEq(investor1BalanceAfter - investor1BalanceBefore, 30_000e6, "Investor 1 refunded");
        assertEq(campaign.contributions(investor1), 0, "Investor 1 contribution cleared");
        
        console.log("Refund scenario test successful!");
    }
}