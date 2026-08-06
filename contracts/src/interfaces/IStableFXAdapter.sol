// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStableFXAdapter {
    /// @notice Swap USDC → EURC. Labeled Test/Adapter Mode for hackathon.
    /// @param usdcIn Amount of USDC (6 decimals) pulled from caller
    /// @param minEURCOut Minimum EURC (6 decimals) acceptable
    /// @param quoteId Off-chain RFQ quote id
    /// @param recipient Where EURC should be sent (may be supplier or caller)
    /// @return eurcOut Amount of EURC produced
    function swapUSDCtoEURC(uint256 usdcIn, uint256 minEURCOut, bytes32 quoteId, address recipient)
        external
        returns (uint256 eurcOut);

    function getQuote(uint256 usdcIn) external view returns (uint256 eurcOut, uint256 feeBps, bytes32 quoteId);
}
