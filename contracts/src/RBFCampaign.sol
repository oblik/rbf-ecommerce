// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RBFCampaign is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NotOwner();
    error CampaignHasEnded();
    error CampaignNotActive();
    error InvalidAmount();
    error FundingGoalExceeded();
    error InsufficientFunding();
    error RevenueReportTooEarly();
    error RepaymentComplete();
    error NoReturnsAvailable();
    error TransferFailed();
    error PermitDeadlineExpired();

    address public immutable owner;
    IERC20 public immutable token;
    string public metadataURI;

    uint256 public immutable fundingGoal;
    uint256 public immutable fundingDeadline;
    uint256 public totalFunded;
    bool public fundingActive = true;
    
    uint256 public immutable revenueSharePercent;
    uint256 public immutable repaymentCap;
    uint256 public totalRepaid;
    uint256 public lastRevenueReport;
    bool public repaymentActive;

    mapping(address => uint256) public contributions;
    mapping(address => uint256) public pendingReturns;
    address[] public contributors;

    event Contributed(address indexed contributor, uint256 amount);
    event FundingGoalReached(uint256 totalAmount);
    event FundingWithdrawn(uint256 amount);
    event RevenueShared(uint256 revenueAmount, uint256 shareAmount);
    event ReturnsWithdrawn(address indexed contributor, uint256 amount);
    event RepaymentCompleted(uint256 totalAmount);
    event CampaignRefunded(address indexed contributor, uint256 amount);
    event MetadataUpdated(string newURI);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _owner,
        address _token,
        string memory _metadataURI,
        uint256 _fundingGoal,
        uint256 _fundingDeadline,
        uint256 _revenueSharePercent,
        uint256 _repaymentCap
    ) {
        owner = _owner;
        token = IERC20(_token);
        metadataURI = _metadataURI;
        fundingGoal = _fundingGoal;
        fundingDeadline = _fundingDeadline;
        revenueSharePercent = _revenueSharePercent;
        repaymentCap = _repaymentCap;
        lastRevenueReport = block.timestamp;
    }

    function contribute(uint256 amount) external nonReentrant {
        if (!fundingActive) revert CampaignNotActive();
        if (block.timestamp >= fundingDeadline) revert CampaignHasEnded();
        if (amount == 0) revert InvalidAmount();
        if (totalFunded + amount > fundingGoal) revert FundingGoalExceeded();

        token.safeTransferFrom(msg.sender, address(this), amount);

        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }

        contributions[msg.sender] += amount;
        totalFunded += amount;

        emit Contributed(msg.sender, amount);

        if (totalFunded >= fundingGoal) {
            _startRepaymentPhase();
        }
    }

    function contributeWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        if (!fundingActive) revert CampaignNotActive();
        if (block.timestamp >= fundingDeadline) revert CampaignHasEnded();
        if (amount == 0) revert InvalidAmount();
        if (totalFunded + amount > fundingGoal) revert FundingGoalExceeded();
        if (block.timestamp > deadline) revert PermitDeadlineExpired();

        IERC20Permit(address(token)).permit(
            msg.sender,
            address(this),
            amount,
            deadline,
            v,
            r,
            s
        );

        token.safeTransferFrom(msg.sender, address(this), amount);

        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }

        contributions[msg.sender] += amount;
        totalFunded += amount;

        emit Contributed(msg.sender, amount);

        if (totalFunded >= fundingGoal) {
            _startRepaymentPhase();
        }
    }

    function startRepaymentPhase() external onlyOwner {
        if (totalFunded < fundingGoal) revert InsufficientFunding();
        _startRepaymentPhase();
    }

    function _startRepaymentPhase() private {
        fundingActive = false;
        repaymentActive = true;
        
        token.safeTransfer(owner, totalFunded);
        
        emit FundingGoalReached(totalFunded);
    }

    function submitRevenueShare(uint256 revenueAmount) external nonReentrant {
        if (msg.sender != owner) revert NotOwner();
        if (!repaymentActive) revert CampaignNotActive();
        if (block.timestamp < lastRevenueReport + 30 days) revert RevenueReportTooEarly();

        uint256 shareAmount = (revenueAmount * revenueSharePercent) / 10000;
        uint256 maxRepayment = (totalFunded * repaymentCap) / 10000;
        uint256 remainingCap = maxRepayment - totalRepaid;

        if (shareAmount > remainingCap) {
            shareAmount = remainingCap;
        }

        if (shareAmount == 0) revert InvalidAmount();

        token.safeTransferFrom(msg.sender, address(this), shareAmount);

        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            uint256 contributorShare = (shareAmount * contributions[contributor]) / totalFunded;
            pendingReturns[contributor] += contributorShare;
        }

        totalRepaid += shareAmount;
        lastRevenueReport = block.timestamp;

        emit RevenueShared(revenueAmount, shareAmount);

        if (totalRepaid >= maxRepayment) {
            repaymentActive = false;
            emit RepaymentCompleted(totalRepaid);
        }
    }

    function withdrawReturns() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        if (amount == 0) revert NoReturnsAvailable();

        pendingReturns[msg.sender] = 0;
        token.safeTransfer(msg.sender, amount);

        emit ReturnsWithdrawn(msg.sender, amount);
    }

    function refund() external nonReentrant {
        if (fundingActive && block.timestamp < fundingDeadline) revert CampaignHasEnded();
        if (totalFunded >= fundingGoal) revert FundingGoalExceeded();
        
        uint256 contribution = contributions[msg.sender];
        if (contribution == 0) revert InvalidAmount();

        contributions[msg.sender] = 0;
        totalFunded -= contribution;
        
        token.safeTransfer(msg.sender, contribution);
        
        emit CampaignRefunded(msg.sender, contribution);
    }

    function updateMetadata(string memory newURI) external onlyOwner {
        metadataURI = newURI;
        emit MetadataUpdated(newURI);
    }

    function getCampaignDetails() external view returns (
        uint256 _fundingGoal,
        uint256 _totalFunded,
        uint256 _totalRepaid,
        uint256 _revenueSharePercent,
        uint256 _repaymentCap,
        bool _fundingActive,
        bool _repaymentActive,
        uint256 _contributorCount
    ) {
        return (
            fundingGoal,
            totalFunded,
            totalRepaid,
            revenueSharePercent,
            repaymentCap,
            fundingActive,
            repaymentActive,
            contributors.length
        );
    }

    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }

    function calculateExpectedReturn(address contributor) external view returns (uint256) {
        if (totalFunded == 0) return 0;
        uint256 maxRepayment = (totalFunded * repaymentCap) / 10000;
        return (maxRepayment * contributions[contributor]) / totalFunded;
    }

    function getRemainingRepayment() external view returns (uint256) {
        if (!repaymentActive) return 0;
        uint256 maxRepayment = (totalFunded * repaymentCap) / 10000;
        return maxRepayment - totalRepaid;
    }

    function getNextPaymentDue() external view returns (uint256) {
        if (!repaymentActive) return 0;
        return lastRevenueReport + 30 days;
    }

    receive() external payable {
        revert TransferFailed();
    }
}

