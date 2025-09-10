// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BusinessRegistry
 * @notice Registry for business profiles and reputation tracking in the RBF ecosystem
 */
contract BusinessRegistry is Ownable {
    struct BusinessProfile {
        string name;
        string metadataURI;
        address owner;
        bool verified;
        uint256 totalRaised;
        uint256 totalRepaid;
        uint256 onTimePayments;
        uint256 latePayments;
        uint256 defaultedAmount;
        uint256 campaignCount;
        uint256 successfulCampaigns;
        uint256 activeInvestors;
        uint256 registeredAt;
        uint256 lastActivityAt;
    }

    struct BusinessMetrics {
        uint256 repaymentRate;
        uint256 successRate;
        uint256 healthScore;
    }

    mapping(address => BusinessProfile) public businesses;
    mapping(string => address) public businessNameToAddress;
    mapping(address => bool) public verifiers;

    uint256 public totalBusinesses;
    uint256 public totalVerifiedBusinesses;

    event BusinessRegistered(
        address indexed business,
        string name,
        string metadataURI,
        uint256 timestamp
    );

    event BusinessVerified(
        address indexed business,
        address indexed verifier,
        uint256 timestamp
    );

    event BusinessMetadataUpdated(
        address indexed business,
        string oldURI,
        string newURI,
        uint256 timestamp
    );

    event BusinessMetricsUpdated(
        address indexed business,
        uint256 totalRaised,
        uint256 totalRepaid,
        uint256 timestamp
    );

    modifier onlyBusinessOwner() {
        require(bytes(businesses[msg.sender].name).length > 0, "Not registered");
        require(businesses[msg.sender].owner == msg.sender, "Not business owner");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Not a verifier");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new business
     * @param name Business name (must be unique)
     * @param metadataURI IPFS URI containing business metadata
     */
    function registerBusiness(
        string memory name,
        string memory metadataURI
    ) external {
        _registerBusiness(msg.sender, name, metadataURI);
    }

    /**
     * @notice Register a business on behalf of another address (for factory contracts)
     * @param businessOwner Address of the business owner
     * @param name Business name (must be unique)
     * @param metadataURI IPFS URI containing business metadata
     */
    function registerBusinessFor(
        address businessOwner,
        string memory name,
        string memory metadataURI
    ) external {
        _registerBusiness(businessOwner, name, metadataURI);
    }

    /**
     * @notice Internal function to register a business
     * @param businessOwner Address of the business owner
     * @param name Business name (must be unique)
     * @param metadataURI IPFS URI containing business metadata
     */
    function _registerBusiness(
        address businessOwner,
        string memory name,
        string memory metadataURI
    ) internal {
        require(bytes(businesses[businessOwner].name).length == 0, "Already registered");
        require(bytes(name).length > 0, "Empty name");
        require(bytes(metadataURI).length > 0, "Empty metadata URI");
        require(businessNameToAddress[name] == address(0), "Name already taken");

        businesses[businessOwner] = BusinessProfile({
            name: name,
            metadataURI: metadataURI,
            owner: businessOwner,
            verified: false,
            totalRaised: 0,
            totalRepaid: 0,
            onTimePayments: 0,
            latePayments: 0,
            defaultedAmount: 0,
            campaignCount: 0,
            successfulCampaigns: 0,
            activeInvestors: 0,
            registeredAt: block.timestamp,
            lastActivityAt: block.timestamp
        });

        businessNameToAddress[name] = businessOwner;
        totalBusinesses++;

        emit BusinessRegistered(businessOwner, name, metadataURI, block.timestamp);
    }

    /**
     * @notice Update business metadata
     * @param newURI New IPFS URI for metadata
     */
    function updateBusinessMetadata(string memory newURI) external onlyBusinessOwner {
        require(bytes(newURI).length > 0, "Empty URI");
        
        string memory oldURI = businesses[msg.sender].metadataURI;
        businesses[msg.sender].metadataURI = newURI;
        businesses[msg.sender].lastActivityAt = block.timestamp;

        emit BusinessMetadataUpdated(msg.sender, oldURI, newURI, block.timestamp);
    }

    /**
     * @notice Verify a business (only by authorized verifiers)
     * @param business Address of the business to verify
     */
    function verifyBusiness(address business) external onlyVerifier {
        require(bytes(businesses[business].name).length > 0, "Business not registered");
        require(!businesses[business].verified, "Already verified");

        businesses[business].verified = true;
        totalVerifiedBusinesses++;

        emit BusinessVerified(business, msg.sender, block.timestamp);
    }

    /**
     * @notice Update business metrics (called by RBFCampaign contracts)
     * @param business Address of the business
     * @param raised Amount raised in the campaign
     * @param repaid Amount repaid so far
     */
    function updateBusinessMetrics(
        address business,
        uint256 raised,
        uint256 repaid,
        bool onTime
    ) external {
        // In production, this should be restricted to authorized contracts
        BusinessProfile storage profile = businesses[business];
        
        if (raised > 0) {
            profile.totalRaised += raised;
        }
        
        if (repaid > 0) {
            profile.totalRepaid += repaid;
            if (onTime) {
                profile.onTimePayments++;
            } else {
                profile.latePayments++;
            }
        }
        
        profile.lastActivityAt = block.timestamp;

        emit BusinessMetricsUpdated(
            business,
            profile.totalRaised,
            profile.totalRepaid,
            block.timestamp
        );
    }

    /**
     * @notice Increment campaign count for a business
     * @param business Address of the business
     */
    function incrementCampaignCount(address business) external {
        // In production, restrict to factory contract
        businesses[business].campaignCount++;
        businesses[business].lastActivityAt = block.timestamp;
    }

    /**
     * @notice Get business health metrics
     * @param business Address of the business
     * @return metrics Business health metrics
     */
    function getBusinessHealth(address business) 
        external 
        view 
        returns (BusinessMetrics memory metrics) 
    {
        BusinessProfile memory profile = businesses[business];
        
        // Calculate repayment rate (basis points)
        metrics.repaymentRate = profile.totalRaised > 0 
            ? (profile.totalRepaid * 10000) / profile.totalRaised 
            : 0;
        
        // Calculate success rate (basis points)
        metrics.successRate = profile.campaignCount > 0
            ? (profile.successfulCampaigns * 10000) / profile.campaignCount
            : 0;
        
        // Calculate health score
        metrics.healthScore = calculateHealthScore(profile);
    }

    /**
     * @notice Calculate health score for a business
     * @param profile Business profile
     * @return score Health score (0-10000, representing 0-100%)
     */
    function calculateHealthScore(BusinessProfile memory profile) 
        internal 
        pure 
        returns (uint256 score) 
    {
        score = 5000; // Start at 50%
        
        // Positive factors
        if (profile.verified) score += 1000;
        if (profile.onTimePayments > 10) score += 1000;
        if (profile.totalRepaid > profile.totalRaised) score += 1500;
        if (profile.successfulCampaigns > 0) {
            score += 500 * (profile.successfulCampaigns > 5 ? 5 : profile.successfulCampaigns);
        }
        
        // Negative factors
        if (profile.latePayments > 0) {
            uint256 penalty = profile.latePayments * 200;
            score = score > penalty ? score - penalty : 0;
        }
        
        if (profile.defaultedAmount > 0) {
            uint256 penalty = (profile.defaultedAmount / 1e6) * 10;
            score = score > penalty ? score - penalty : 0;
        }
        
        // Cap at 10000 (100%)
        return score > 10000 ? 10000 : score;
    }

    /**
     * @notice Check if a business is registered
     * @param business Address to check
     * @return bool True if registered
     */
    function isRegistered(address business) external view returns (bool) {
        return bytes(businesses[business].name).length > 0;
    }

    /**
     * @notice Check if a business is verified
     * @param business Address to check
     * @return bool True if verified
     */
    function isVerified(address business) external view returns (bool) {
        return businesses[business].verified;
    }

    /**
     * @notice Add a verifier (only owner)
     * @param verifier Address to add as verifier
     */
    function addVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = true;
    }

    /**
     * @notice Remove a verifier (only owner)
     * @param verifier Address to remove as verifier
     */
    function removeVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = false;
    }

    /**
     * @notice Get business profile
     * @param business Address of the business
     * @return Business profile data
     */
    function getBusinessProfile(address business) 
        external 
        view 
        returns (BusinessProfile memory) 
    {
        return businesses[business];
    }
}