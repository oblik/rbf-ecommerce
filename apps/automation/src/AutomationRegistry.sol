// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRBFCampaign {
    function submitRevenueShare(uint256 revenueAmount) external;
    function getNextPaymentDue() external view returns (uint256);
    function owner() external view returns (address);
    function repaymentActive() external view returns (bool);
}

interface IRBFCampaignFactory {
    function getRepaymentCampaigns() external view returns (address[] memory);
    function isValidCampaign(address campaign) external view returns (bool);
}

contract AutomationRegistry is Ownable, ReentrancyGuard {
    
    struct AutomationJob {
        address campaign;
        uint256 revenueAmount;
        uint256 executionTime;
        bool executed;
        address executor;
    }
    
    IRBFCampaignFactory public immutable campaignFactory;
    mapping(bytes32 => AutomationJob) public jobs;
    mapping(address => bool) public authorizedExecutors;
    mapping(address => uint256) public lastExecution;
    
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 public constant MAX_PENALTY_RATE = 500; // 5% per day
    
    event JobCreated(bytes32 indexed jobId, address indexed campaign, uint256 revenueAmount);
    event JobExecuted(bytes32 indexed jobId, address indexed executor);
    event ExecutorAuthorized(address indexed executor);
    event ExecutorRevoked(address indexed executor);
    event PenaltyApplied(address indexed campaign, uint256 penaltyAmount);
    
    modifier onlyAuthorizedExecutor() {
        require(authorizedExecutors[msg.sender], "Not authorized executor");
        _;
    }
    
    constructor(address _campaignFactory) Ownable(msg.sender) {
        campaignFactory = IRBFCampaignFactory(_campaignFactory);
        authorizedExecutors[msg.sender] = true;
    }
    
    function authorizeExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = true;
        emit ExecutorAuthorized(executor);
    }
    
    function revokeExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = false;
        emit ExecutorRevoked(executor);
    }
    
    function createRevenueCollectionJob(
        address campaign,
        uint256 revenueAmount
    ) external onlyAuthorizedExecutor returns (bytes32) {
        require(campaignFactory.isValidCampaign(campaign), "Invalid campaign");
        require(IRBFCampaign(campaign).repaymentActive(), "Campaign not in repayment");
        
        bytes32 jobId = keccak256(abi.encodePacked(
            campaign,
            revenueAmount,
            block.timestamp,
            msg.sender
        ));
        
        jobs[jobId] = AutomationJob({
            campaign: campaign,
            revenueAmount: revenueAmount,
            executionTime: block.timestamp,
            executed: false,
            executor: msg.sender
        });
        
        emit JobCreated(jobId, campaign, revenueAmount);
        return jobId;
    }
    
    function executeRevenueCollection(bytes32 jobId) external onlyAuthorizedExecutor nonReentrant {
        AutomationJob storage job = jobs[jobId];
        require(!job.executed, "Job already executed");
        require(job.campaign != address(0), "Job does not exist");
        
        IRBFCampaign campaign = IRBFCampaign(job.campaign);
        
        // Check if payment is overdue and apply penalty if necessary
        uint256 nextPaymentDue = campaign.getNextPaymentDue();
        uint256 revenueAmount = job.revenueAmount;
        
        if (nextPaymentDue > 0 && block.timestamp > nextPaymentDue + GRACE_PERIOD) {
            uint256 daysOverdue = (block.timestamp - nextPaymentDue - GRACE_PERIOD) / 1 days;
            uint256 penaltyRate = daysOverdue * 100; // 1% per day
            if (penaltyRate > MAX_PENALTY_RATE) {
                penaltyRate = MAX_PENALTY_RATE;
            }
            
            uint256 penalty = (revenueAmount * penaltyRate) / 10000;
            revenueAmount += penalty;
            
            emit PenaltyApplied(job.campaign, penalty);
        }
        
        // Execute the revenue share submission
        campaign.submitRevenueShare(revenueAmount);
        
        // Mark job as executed
        job.executed = true;
        lastExecution[job.campaign] = block.timestamp;
        
        emit JobExecuted(jobId, msg.sender);
    }
    
    function getOverdueCampaigns() external view returns (address[] memory) {
        address[] memory repaymentCampaigns = campaignFactory.getRepaymentCampaigns();
        address[] memory overdueCampaigns = new address[](repaymentCampaigns.length);
        uint256 overdueCount = 0;
        
        for (uint256 i = 0; i < repaymentCampaigns.length; i++) {
            IRBFCampaign campaign = IRBFCampaign(repaymentCampaigns[i]);
            uint256 nextPaymentDue = campaign.getNextPaymentDue();
            
            if (nextPaymentDue > 0 && block.timestamp > nextPaymentDue + GRACE_PERIOD) {
                overdueCampaigns[overdueCount] = repaymentCampaigns[i];
                overdueCount++;
            }
        }
        
        // Resize array to actual count
        address[] memory result = new address[](overdueCount);
        for (uint256 i = 0; i < overdueCount; i++) {
            result[i] = overdueCampaigns[i];
        }
        
        return result;
    }
    
    function getJobDetails(bytes32 jobId) external view returns (
        address campaign,
        uint256 revenueAmount,
        uint256 executionTime,
        bool executed,
        address executor
    ) {
        AutomationJob memory job = jobs[jobId];
        return (
            job.campaign,
            job.revenueAmount,
            job.executionTime,
            job.executed,
            job.executor
        );
    }
    
    function calculatePenalty(address campaign, uint256 revenueAmount) external view returns (uint256) {
        IRBFCampaign campaignContract = IRBFCampaign(campaign);
        uint256 nextPaymentDue = campaignContract.getNextPaymentDue();
        
        if (nextPaymentDue == 0 || block.timestamp <= nextPaymentDue + GRACE_PERIOD) {
            return 0;
        }
        
        uint256 daysOverdue = (block.timestamp - nextPaymentDue - GRACE_PERIOD) / 1 days;
        uint256 penaltyRate = daysOverdue * 100; // 1% per day
        if (penaltyRate > MAX_PENALTY_RATE) {
            penaltyRate = MAX_PENALTY_RATE;
        }
        
        return (revenueAmount * penaltyRate) / 10000;
    }
}