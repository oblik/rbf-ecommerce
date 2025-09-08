export const campaignAbi = [
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "string", name: "_metadataURI", type: "string" },
      { internalType: "uint256", name: "_fundingGoal", type: "uint256" },
      { internalType: "uint256", name: "_fundingDeadline", type: "uint256" },
      { internalType: "uint256", name: "_revenueSharePercent", type: "uint256" },
      { internalType: "uint256", name: "_repaymentCap", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "contributor", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "Contributed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "totalAmount", type: "uint256" }
    ],
    name: "FundingGoalReached",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "revenueAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "shareAmount", type: "uint256" }
    ],
    name: "RevenueShared",
    type: "event"
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" }
    ],
    name: "contributeWithPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "revenueAmount", type: "uint256" }],
    name: "submitRevenueShare",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawReturns",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getCampaignDetails",
    outputs: [
      { internalType: "uint256", name: "_fundingGoal", type: "uint256" },
      { internalType: "uint256", name: "_totalFunded", type: "uint256" },
      { internalType: "uint256", name: "_totalRepaid", type: "uint256" },
      { internalType: "uint256", name: "_revenueSharePercent", type: "uint256" },
      { internalType: "uint256", name: "_repaymentCap", type: "uint256" },
      { internalType: "bool", name: "_fundingActive", type: "bool" },
      { internalType: "bool", name: "_repaymentActive", type: "bool" },
      { internalType: "uint256", name: "_contributorCount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "metadataURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "fundingGoal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "fundingDeadline",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalFunded",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "fundingActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "repaymentActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "contributions",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "pendingReturns",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;