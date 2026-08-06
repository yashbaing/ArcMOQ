export const groupOrderAbi = [
  {
    type: "function",
    name: "createOrder",
    stateMutability: "nonpayable",
    inputs: [
      { name: "productName_", type: "string" },
      { name: "origin_", type: "string" },
      { name: "packaging_", type: "string" },
      { name: "supplierMOQ_", type: "uint256" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
  },
  {
    type: "function",
    name: "joinOrder",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "maxUSDC", type: "uint256" },
      { name: "deliveryDeadline", type: "uint256" },
      { name: "maxSlippageBps", type: "uint256" },
      { name: "businessName_", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "fundMandate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "amountUSDC", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submitSupplierOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "supplier", type: "address" },
      { name: "quantity", type: "uint256" },
      { name: "unitPriceEURC", type: "uint256" },
      { name: "deliveryDays", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "supplierId", type: "bytes32" },
      { name: "paysEURC", type: "bool" },
      { name: "termsHash", type: "bytes32" },
    ],
    outputs: [{ name: "offerId", type: "uint256" }],
  },
  {
    type: "function",
    name: "acceptSupplierOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "offerId", type: "uint256" },
      { name: "maxUSDCForFX", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "executeSettlement",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "usdcAmount", type: "uint256" },
      { name: "fxQuoteId", type: "bytes32" },
      { name: "minEURCOut", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "totalDemand",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "orderStatus",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "setKYB",
    stateMutability: "nonpayable",
    inputs: [
      { name: "buyer", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setSupplierWhitelist",
    stateMutability: "nonpayable",
    inputs: [
      { name: "supplier", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
] as const;

export const warehouseAbi = [
  {
    type: "function",
    name: "createBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "batchId", type: "string" },
      { name: "productName", type: "string" },
      { name: "origin", type: "string" },
      { name: "packaging", type: "string" },
      { name: "totalQuantity", type: "uint256" },
      { name: "supplier", type: "address" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "verifyBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "attestationHash", type: "bytes32" },
      { name: "custodian", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mintAllocation",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "buyers", type: "address[]" },
      { name: "quantities", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "confirmRedemption",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "buyer", type: "address" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;
