// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IStableFXAdapter} from "./interfaces/IStableFXAdapter.sol";

/// @title StableFXAdapter
/// @notice Hackathon adapter labeled "StableFX: Test or Adapter Mode".
/// @dev Does NOT claim to convert AED→USDC. Only USDC↔EURC sandbox FX.
///      Holds EURC liquidity seeded by the deployer for demo settlements.
contract StableFXAdapter is IStableFXAdapter {
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;

    address public owner;
    uint256 public feeBps = 10; // 0.10% demo fee
    uint256 public rateEURCperUSDC = 920_000; // 0.92 EURC per 1 USDC (6-dec fixed: 920000/1e6)
    uint256 public constant RATE_SCALE = 1e6;
    uint256 public constant BPS = 10_000;

    mapping(bytes32 => bool) public usedQuotes;
    uint256 public quoteNonce;

    event QuoteGenerated(bytes32 indexed quoteId, uint256 usdcIn, uint256 eurcOut, uint256 feeBps);
    event SwapExecuted(
        bytes32 indexed quoteId, address indexed caller, address indexed recipient, uint256 usdcIn, uint256 eurcOut
    );
    event LiquiditySeeded(address token, uint256 amount);
    event RateUpdated(uint256 rateEURCperUSDC);

    error Unauthorized();
    error QuoteUsed();
    error Slippage();
    error TransferFailed();
    error InsufficientLiquidity();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address usdc_, address eurc_) {
        owner = msg.sender;
        usdc = IERC20(usdc_);
        eurc = IERC20(eurc_);
    }

    function setRate(uint256 rateEURCperUSDC_) external onlyOwner {
        rateEURCperUSDC = rateEURCperUSDC_;
        emit RateUpdated(rateEURCperUSDC_);
    }

    function setFeeBps(uint256 feeBps_) external onlyOwner {
        feeBps = feeBps_;
    }

    function seedEURC(uint256 amount) external onlyOwner {
        bool ok = eurc.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit LiquiditySeeded(address(eurc), amount);
    }

    function withdraw(address token, uint256 amount, address to) external onlyOwner {
        bool ok = IERC20(token).transfer(to, amount);
        if (!ok) revert TransferFailed();
    }

    function getQuote(uint256 usdcIn)
        external
        view
        returns (uint256 eurcOut, uint256 feeBpsOut, bytes32 quoteId)
    {
        feeBpsOut = feeBps;
        uint256 gross = (usdcIn * rateEURCperUSDC) / RATE_SCALE;
        uint256 fee = (gross * feeBps) / BPS;
        eurcOut = gross - fee;
        quoteId = keccak256(abi.encodePacked("stablefx-adapter", usdcIn, eurcOut, quoteNonce, block.timestamp));
    }

    function previewSwap(uint256 usdcIn) public view returns (uint256 eurcOut) {
        uint256 gross = (usdcIn * rateEURCperUSDC) / RATE_SCALE;
        uint256 fee = (gross * feeBps) / BPS;
        eurcOut = gross - fee;
    }

    function swapUSDCtoEURC(uint256 usdcIn, uint256 minEURCOut, bytes32 quoteId, address recipient)
        external
        returns (uint256 eurcOut)
    {
        if (usedQuotes[quoteId]) revert QuoteUsed();
        usedQuotes[quoteId] = true;

        eurcOut = previewSwap(usdcIn);
        if (eurcOut < minEURCOut) revert Slippage();
        if (eurc.balanceOf(address(this)) < eurcOut) revert InsufficientLiquidity();

        bool okIn = usdc.transferFrom(msg.sender, address(this), usdcIn);
        if (!okIn) revert TransferFailed();

        bool okOut = eurc.transfer(recipient, eurcOut);
        if (!okOut) revert TransferFailed();

        quoteNonce++;
        emit SwapExecuted(quoteId, msg.sender, recipient, usdcIn, eurcOut);
    }
}
