// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWarehouseReceipt {
    function createBatch(
        uint256 orderId,
        string calldata batchId,
        string calldata productName,
        string calldata origin,
        string calldata packaging,
        uint256 totalQuantity,
        address supplier
    ) external returns (uint256 tokenId);

    function verifyAndMint(
        uint256 tokenId,
        address[] calldata buyers,
        uint256[] calldata quantities,
        bytes32 attestationHash
    ) external;
}
