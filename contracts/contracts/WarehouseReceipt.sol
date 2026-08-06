// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WarehouseReceipt
 * @notice ERC-1155 digital warehouse receipts for verified physical inventory.
 */
contract WarehouseReceipt is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct Batch {
        bytes32 batchId;
        string productName;
        string origin;
        string packaging;
        address supplier;
        uint256 totalQuantity;
        uint256 mintedQuantity;
        uint256 redeemedQuantity;
        bool verified;
        bool paused;
        string warehouse;
        string shipmentStatus;
    }

    struct Allocation {
        address buyer;
        uint256 quantity;
        bool minted;
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => Batch) public batches;
    mapping(bytes32 => uint256) public batchIdToTokenId;
    mapping(uint256 => mapping(address => Allocation)) public allocations;
    mapping(uint256 => address[]) public batchBuyers;
    mapping(address => bool) public kybApproved;
    mapping(address => bool) public transferApproved;

    event BatchCreated(uint256 indexed tokenId, bytes32 batchId, string productName, uint256 totalQuantity);
    event BatchVerified(uint256 indexed tokenId, string warehouse);
    event AllocationMinted(uint256 indexed tokenId, address indexed buyer, uint256 quantity);
    event RedemptionRequested(uint256 indexed tokenId, address indexed buyer, uint256 quantity);
    event RedemptionConfirmed(uint256 indexed tokenId, address indexed buyer, uint256 quantity);
    event BatchPaused(uint256 indexed tokenId);

    constructor(string memory uri) ERC1155(uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    function setURI(string memory newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    function setKybApproved(address buyer, bool approved) external onlyRole(OPERATOR_ROLE) {
        kybApproved[buyer] = approved;
    }

    function setTransferApproved(address addr, bool approved) external onlyRole(OPERATOR_ROLE) {
        transferApproved[addr] = approved;
    }

    function createBatch(
        bytes32 batchId,
        string calldata productName,
        string calldata origin,
        string calldata packaging,
        address supplier,
        uint256 totalQuantity,
        string calldata warehouse
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 tokenId) {
        require(batchIdToTokenId[batchId] == 0, "WarehouseReceipt: batch exists");
        tokenId = nextTokenId++;
        batches[tokenId] = Batch({
            batchId: batchId,
            productName: productName,
            origin: origin,
            packaging: packaging,
            supplier: supplier,
            totalQuantity: totalQuantity,
            mintedQuantity: 0,
            redeemedQuantity: 0,
            verified: false,
            paused: false,
            warehouse: warehouse,
            shipmentStatus: "pending"
        });
        batchIdToTokenId[batchId] = tokenId;
        emit BatchCreated(tokenId, batchId, productName, totalQuantity);
    }

    function registerAllocation(uint256 tokenId, address buyer, uint256 quantity) external onlyRole(OPERATOR_ROLE) {
        require(batches[tokenId].batchId != bytes32(0), "WarehouseReceipt: batch not found");
        require(allocations[tokenId][buyer].buyer == address(0), "WarehouseReceipt: allocation exists");
        allocations[tokenId][buyer] = Allocation({ buyer: buyer, quantity: quantity, minted: false });
        batchBuyers[tokenId].push(buyer);
    }

    function verifyBatch(uint256 tokenId, string calldata warehouse) external onlyRole(VERIFIER_ROLE) {
        Batch storage batch = batches[tokenId];
        require(batch.batchId != bytes32(0), "WarehouseReceipt: batch not found");
        batch.verified = true;
        batch.warehouse = warehouse;
        batch.shipmentStatus = "verified";
        emit BatchVerified(tokenId, warehouse);
    }

    function mintAllocation(uint256 tokenId, address buyer) external onlyRole(MINTER_ROLE) nonReentrant {
        Batch storage batch = batches[tokenId];
        Allocation storage alloc = allocations[tokenId][buyer];
        require(batch.verified, "WarehouseReceipt: not verified");
        require(!batch.paused, "WarehouseReceipt: paused");
        require(alloc.buyer != address(0), "WarehouseReceipt: no allocation");
        require(!alloc.minted, "WarehouseReceipt: already minted");
        require(kybApproved[buyer], "WarehouseReceipt: KYB required");

        alloc.minted = true;
        batch.mintedQuantity += alloc.quantity;
        _mint(buyer, tokenId, alloc.quantity, "");
        emit AllocationMinted(tokenId, buyer, alloc.quantity);
    }

    function mintAllAllocations(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        address[] memory buyers = batchBuyers[tokenId];
        for (uint256 i = 0; i < buyers.length; i++) {
            Allocation storage alloc = allocations[tokenId][buyers[i]];
            if (!alloc.minted && alloc.buyer != address(0)) {
                this.mintAllocation(tokenId, buyers[i]);
            }
        }
    }

    function restrictedTransfer(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external {
        require(kybApproved[to] && transferApproved[to], "WarehouseReceipt: transfer not allowed");
        require(!batches[id].paused, "WarehouseReceipt: paused");
        safeTransferFrom(from, to, id, amount, data);
    }

    function requestRedemption(uint256 tokenId, uint256 quantity) external {
        require(balanceOf(msg.sender, tokenId) >= quantity, "WarehouseReceipt: insufficient balance");
        emit RedemptionRequested(tokenId, msg.sender, quantity);
    }

    function confirmRedemption(uint256 tokenId, address buyer, uint256 quantity) external onlyRole(VERIFIER_ROLE) nonReentrant {
        Batch storage batch = batches[tokenId];
        require(batch.verified, "WarehouseReceipt: not verified");
        require(balanceOf(buyer, tokenId) >= quantity, "WarehouseReceipt: insufficient balance");

        _burn(buyer, tokenId, quantity);
        batch.redeemedQuantity += quantity;
        if (batch.redeemedQuantity >= batch.mintedQuantity) {
            batch.shipmentStatus = "fully_redeemed";
        } else {
            batch.shipmentStatus = "partially_redeemed";
        }
        emit RedemptionConfirmed(tokenId, buyer, quantity);
    }

    function pauseBatch(uint256 tokenId) external onlyRole(OPERATOR_ROLE) {
        batches[tokenId].paused = true;
        emit BatchPaused(tokenId);
    }

    function updateShipmentStatus(uint256 tokenId, string calldata status) external onlyRole(OPERATOR_ROLE) {
        batches[tokenId].shipmentStatus = status;
    }

    function getBatchBuyers(uint256 tokenId) external view returns (address[] memory) {
        return batchBuyers[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
