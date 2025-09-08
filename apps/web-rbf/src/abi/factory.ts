export const factoryAbi = [
  {
    inputs: [{ internalType: "address", name: "_usdcToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "EmptyMetadataURI",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidDeadline",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidFundingGoal",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidParameterUpdate",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidRepaymentCap",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidRevenueShare",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "campaign", type: "address" },
      { indexed: true, internalType: "address", name: "business", type: "address" },
      { indexed: false, internalType: "uint256", name: "fundingGoal", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "revenueSharePercent", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "repaymentCap", type: "uint256" }
    ],
    name: "CampaignCreated",
    type: "event"
  },
  {
    inputs: [
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "fundingGoal", type: "uint256" },
      { internalType: "uint256", name: "fundingPeriodDays", type: "uint256" },
      { internalType: "uint256", name: "revenueSharePercent", type: "uint256" },
      { internalType: "uint256", name: "repaymentCap", type: "uint256" }
    ],
    name: "createCampaign",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getCampaigns",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getActiveCampaigns",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "business", type: "address" }],
    name: "getBusinessCampaigns",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "campaignAddress", type: "address" }],
    name: "getCampaignDetails",
    outputs: [
      { internalType: "bool", name: "isValid", type: "bool" },
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "fundingGoal", type: "uint256" },
      { internalType: "uint256", name: "totalFunded", type: "uint256" },
      { internalType: "bool", name: "fundingActive", type: "bool" },
      { internalType: "bool", name: "repaymentActive", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;