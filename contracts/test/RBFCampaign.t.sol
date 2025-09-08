// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RBFCampaign.sol";
import "../src/RBFCampaignFactory.sol";
import "../src/TestUSDC.sol";

contract RBFCampaignTest is Test {
    RBFCampaignFactory public factory;
    TestUSDC public usdc;
    RBFCampaign public campaign;
    
    address public owner = makeAddr("owner");
    address public investor1 = makeAddr("investor1");
    address public investor2 = makeAddr("investor2");
    
    string constant METADATA_URI = "ipfs://QmTest123";
    uint256 constant FUNDING_GOAL = 100_000e6; // 100k USDC
    uint256 constant FUNDING_PERIOD = 30 days;
    uint256 constant REVENUE_SHARE = 500; // 5%
    uint256 constant REPAYMENT_CAP = 15000; // 1.5x
    
    function setUp() public {
        // Deploy USDC and Factory
        usdc = new TestUSDC();
        factory = new RBFCampaignFactory(address(usdc));
        
        // Create a campaign
        vm.prank(owner);
        address campaignAddr = factory.createCampaign(
            METADATA_URI,
            FUNDING_GOAL,
            30, // 30 days
            REVENUE_SHARE,
            REPAYMENT_CAP
        );
        
        campaign = RBFCampaign(payable(campaignAddr));
        
        // Give investors some USDC
        usdc.mint(investor1, 200_000e6);
        usdc.mint(investor2, 200_000e6);
        usdc.mint(owner, 1_000_000e6); // For revenue sharing
    }
    
    function testCampaignCreation() public {
        assertEq(campaign.owner(), owner);
        assertEq(address(campaign.token()), address(usdc));
        assertEq(campaign.fundingGoal(), FUNDING_GOAL);
        assertEq(campaign.fundingActive(), true);
        assertEq(campaign.repaymentActive(), false);
    }
    
    function testContribute() public {
        uint256 amount = 25_000e6; // 25k USDC
        
        vm.startPrank(investor1);
        usdc.approve(address(campaign), amount);
        campaign.contribute(amount);
        vm.stopPrank();
        
        assertEq(campaign.contributions(investor1), amount);
        assertEq(campaign.totalFunded(), amount);
        assertEq(campaign.getContributorCount(), 1);
    }
    
    function testFullFundingTriggersRepayment() public {
        // Fund the campaign completely
        vm.startPrank(investor1);
        usdc.approve(address(campaign), 50_000e6);
        campaign.contribute(50_000e6);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        usdc.approve(address(campaign), 50_000e6);
        campaign.contribute(50_000e6);
        vm.stopPrank();
        
        // Check that repayment phase started
        assertEq(campaign.fundingActive(), false);
        assertEq(campaign.repaymentActive(), true);
        assertEq(campaign.totalFunded(), FUNDING_GOAL);
        
        // Owner should have received the funds
        assertEq(usdc.balanceOf(owner), 1_000_000e6 + FUNDING_GOAL);
    }
    
    function testRevenueSharing() public {
        // First, fully fund the campaign
        vm.startPrank(investor1);
        usdc.approve(address(campaign), FUNDING_GOAL);
        campaign.contribute(FUNDING_GOAL);
        vm.stopPrank();
        
        // Advance time by 31 days to allow revenue submission
        vm.warp(block.timestamp + 31 days);
        
        // Submit revenue share
        uint256 monthlyRevenue = 20_000e6; // 20k revenue
        uint256 expectedShare = (monthlyRevenue * REVENUE_SHARE) / 10000; // 5% = 1k
        
        vm.startPrank(owner);
        usdc.approve(address(campaign), expectedShare);
        campaign.submitRevenueShare(monthlyRevenue);
        vm.stopPrank();
        
        // Check investor received their share
        assertEq(campaign.pendingReturns(investor1), expectedShare);
        assertEq(campaign.totalRepaid(), expectedShare);
        
        // Investor withdraws returns
        uint256 balanceBefore = usdc.balanceOf(investor1);
        vm.prank(investor1);
        campaign.withdrawReturns();
        
        assertEq(usdc.balanceOf(investor1), balanceBefore + expectedShare);
        assertEq(campaign.pendingReturns(investor1), 0);
    }
    
    function testRefund() public {
        uint256 amount = 25_000e6;
        
        // Contribute but don't reach goal
        vm.startPrank(investor1);
        usdc.approve(address(campaign), amount);
        campaign.contribute(amount);
        vm.stopPrank();
        
        // Advance time past deadline
        vm.warp(campaign.fundingDeadline() + 1);
        
        // Refund should work
        vm.prank(investor1);
        campaign.refund();
        
        assertEq(usdc.balanceOf(investor1), 200_000e6); // Back to original amount
        assertEq(campaign.contributions(investor1), 0);
    }
    
    function testFactoryTracking() public {
        address[] memory campaigns = factory.getCampaigns();
        assertEq(campaigns.length, 1);
        assertEq(campaigns[0], address(campaign));
        
        address[] memory businessCampaigns = factory.getBusinessCampaigns(owner);
        assertEq(businessCampaigns.length, 1);
        assertEq(businessCampaigns[0], address(campaign));
    }
}