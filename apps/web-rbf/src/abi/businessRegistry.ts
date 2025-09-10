export const businessRegistryAbi = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "business",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BusinessRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "business",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BusinessVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "business",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalRaised",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalRepaid",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BusinessMetricsUpdated",
    "type": "event"
  },

  // Read Functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "business",
        "type": "address"
      }
    ],
    "name": "isRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "business",
        "type": "address"
      }
    ],
    "name": "isVerified",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "business",
        "type": "address"
      }
    ],
    "name": "getBusinessProfile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "metadataURI",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "verified",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "totalRaised",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRepaid",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "onTimePayments",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "latePayments",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "defaultedAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "campaignCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "successfulCampaigns",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "activeInvestors",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "registeredAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastActivityAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct BusinessRegistry.BusinessProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "business",
        "type": "address"
      }
    ],
    "name": "getBusinessHealth",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "repaymentRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "successRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "healthScore",
            "type": "uint256"
          }
        ],
        "internalType": "struct BusinessRegistry.BusinessMetrics",
        "name": "metrics",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Write Functions
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      }
    ],
    "name": "registerBusiness",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "businessOwner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      }
    ],
    "name": "registerBusinessFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newURI",
        "type": "string"
      }
    ],
    "name": "updateBusinessMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "business",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "raised",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "repaid",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "onTime",
        "type": "bool"
      }
    ],
    "name": "updateBusinessMetrics",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "business",
        "type": "address"
      }
    ],
    "name": "incrementCampaignCount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // View Functions
  {
    "inputs": [],
    "name": "totalBusinesses",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVerifiedBusinesses",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;