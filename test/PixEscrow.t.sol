// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/PixEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract PixEscrowTest is Test {
    PixEscrow public escrow;
    MockUSDC public usdc;

    address public owner = address(1);
    address public feeRecipient = address(2);
    address public buyer = address(3);
    address public seller = address(4);

    uint256 public constant INITIAL_BALANCE = 10_000 * 1e6; // $10,000.00 USDC

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        // 100 bps = 1.00% de taxa
        escrow = new PixEscrow(address(usdc), feeRecipient, 100);
        vm.stopPrank();

        usdc.mint(buyer, INITIAL_BALANCE);

        vm.prank(buyer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function test_CreateEscrow() public {
        vm.prank(buyer);
        uint256 amount = 1_000 * 1e6; // $1,000 USDC
        uint256 escrowId = escrow.createEscrow(seller, amount, 1 hours);

        assertEq(escrowId, 0);
        assertEq(usdc.balanceOf(address(escrow)), amount);
        assertEq(usdc.balanceOf(buyer), INITIAL_BALANCE - amount);
    }

    function test_ReleaseFundsWithFee() public {
        uint256 amount = 1_000 * 1e6;

        vm.prank(buyer);
        uint256 escrowId = escrow.createEscrow(seller, amount, 1 hours);

        vm.prank(buyer);
        escrow.releaseFunds(escrowId);

        // Taxa de 1% ($10 USDC) vai para feeRecipient e $990 USDC para o vendedor
        assertEq(usdc.balanceOf(feeRecipient), 10 * 1e6);
        assertEq(usdc.balanceOf(seller), 990 * 1e6);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_RefundOnExpiration() public {
        uint256 amount = 500 * 1e6;

        vm.prank(buyer);
        uint256 escrowId = escrow.createEscrow(seller, amount, 1 hours);

        // Avanca o tempo na EVM
        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(buyer);
        escrow.refundBuyer(escrowId);

        assertEq(usdc.balanceOf(buyer), INITIAL_BALANCE);
    }
}