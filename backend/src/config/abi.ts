export const pixEscrowABI = [
  {
    type: 'function',
    name: 'createEscrow',
    inputs: [
      { name: 'pixEndToEnd', type: 'string' },
      { name: 'buyer', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'escrowId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'EscrowCreated',
    inputs: [
      { name: 'escrowId', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'pixEndToEnd', type: 'string', indexed: false },
    ],
  },
] as const;