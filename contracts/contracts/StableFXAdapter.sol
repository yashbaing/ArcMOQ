// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StableFXAdapter
 * @notice Demo/test adapter for USDC → EURC conversion on Arc Testnet.
 *         Labeled "StableFX: Test Adapter Mode" — not production StableFX.
 */
contract StableFXAdapter is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    address public groupOrder;
    uint256 public feeBps = 30; // 0.30%
    uint256 public rateNumerator = 92; // 0.92 EURC per USDC (demo rate)
    uint256 public rateDenominator = 100;

    event SwapExecuted(
        address indexed caller,
        uint256 usdcIn,
        uint256 eurcOut,
        uint256 feeUsdc
    );

    constructor(address _usdc, address _eurc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
    }

    function setGroupOrder(address _groupOrder) external onlyOwner {
        groupOrder = _groupOrder;
    }

    function setRate(uint256 numerator, uint256 denominator) external onlyOwner {
        rateNumerator = numerator;
        rateDenominator = denominator;
    }

    function quote(uint256 usdcAmount) public view returns (uint256 eurcOut, uint256 fee) {
        fee = (usdcAmount * feeBps) / 10_000;
        uint256 netUsdc = usdcAmount - fee;
        eurcOut = (netUsdc * rateNumerator) / rateDenominator;
    }

    /**
     * @dev Pull USDC from caller, send EURC to recipient.
     */
    function swapToEURC(uint256 usdcAmount, address recipient) external returns (uint256 eurcOut) {
        require(msg.sender == groupOrder || msg.sender == owner(), "StableFXAdapter: unauthorized");
        (eurcOut, ) = quote(usdcAmount);
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        eurc.safeTransfer(recipient, eurcOut);
        emit SwapExecuted(msg.sender, usdcAmount, eurcOut, (usdcAmount * feeBps) / 10_000);
    }

    function fundLiquidity(uint256 eurcAmount) external onlyOwner {
        eurc.safeTransferFrom(msg.sender, address(this), eurcAmount);
    }
}
