// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestUSDC is ERC20, ERC20Permit, Ownable {
    uint8 private constant DECIMALS = 6;
    
    constructor() 
        ERC20("Test USD Coin", "USDC") 
        ERC20Permit("Test USD Coin")
        Ownable(msg.sender)
    {
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet() external {
        uint256 amount = 10_000 * 10**DECIMALS; // 10,000 USDC
        _mint(msg.sender, amount);
    }
}