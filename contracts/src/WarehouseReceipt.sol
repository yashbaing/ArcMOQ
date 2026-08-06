// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title WarehouseReceipt
/// @notice ERC-1155 digital warehouse receipts for verified physical inventory.
/// @dev AI is NOT the sole attestation authority — warehouse/custodian must verify.
contract WarehouseReceipt is ERC1155, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");
    bytes32 public constant WAREHOUSE_ROLE = keccak256("WAREHOUSE_ROLE");

    enum BatchStatus {
        Pending,
        Verified,
        InTransit,
        Arrived,
        PartiallyRedeemed,
        Redeemed,
        Disputed,
        Paused
    }

    uint256 public nextTokenId = 1;
    bool public transfersRestricted = true;

    mapping(uint256 => uint256) public orderIdOf;
    mapping(uint256 => string) public batchIdOf;
    mapping(uint256 => string) public productNameOf;
    mapping(uint256 => string) public originOf;
    mapping(uint256 => string) public packagingOf;
    mapping(uint256 => uint256) public totalQuantityOf;
    mapping(uint256 => uint256) public mintedQuantityOf;
    mapping(uint256 => uint256) public redeemedQuantityOf;
    mapping(uint256 => address) public supplierOf;
    mapping(uint256 => address) public custodianOf;
    mapping(uint256 => BatchStatus) public statusOf;
    mapping(uint256 => bytes32) public attestationHashOf;
    mapping(uint256 => bool) public verifiedOf;
    mapping(uint256 => uint256) public createdAtOf;
    mapping(uint256 => uint256) public verifiedAtOf;

    mapping(uint256 => mapping(address => uint256)) public allocationQty;
    mapping(uint256 => mapping(address => uint256)) public redeemedQty;
    mapping(uint256 => address[]) private _batchBuyers;
    mapping(address => bool) public transferAllowlist;
    mapping(string => uint256) public batchIdToTokenId;

    event BatchCreated(uint256 indexed tokenId, uint256 indexed orderId, string batchId, uint256 totalQuantity);
    event BatchVerified(uint256 indexed tokenId, bytes32 attestationHash, address attestor);
    event AllocationMinted(uint256 indexed tokenId, address indexed buyer, uint256 quantity);
    event RedemptionRequested(uint256 indexed tokenId, address indexed buyer, uint256 quantity);
    event RedemptionConfirmed(uint256 indexed tokenId, address indexed buyer, uint256 quantity);
    event BatchPaused(uint256 indexed tokenId);
    event TransferAllowlistUpdated(address indexed account, bool approved);

    error NotVerified();
    error AlreadyVerified();
    error TransfersRestricted();
    error NotAllowlisted();
    error InvalidAllocation();
    error InsufficientBalance();
    error BatchPausedErr();
    error LengthMismatch();
    error ZeroAmount();
    error DuplicateBatch();

    constructor(address admin, address attestor, address warehouse)
        ERC1155("https://arcmoq.app/api/receipt/{id}.json")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(ATTESTOR_ROLE, attestor);
        _grantRole(WAREHOUSE_ROLE, warehouse);
        transferAllowlist[admin] = true;
    }

    function setTransferAllowlist(address account, bool approved) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transferAllowlist[account] = approved;
        emit TransferAllowlistUpdated(account, approved);
    }

    function setTransfersRestricted(bool restricted) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transfersRestricted = restricted;
    }

    function createBatch(
        uint256 orderId,
        string calldata batchId,
        string calldata productName,
        string calldata origin,
        string calldata packaging,
        uint256 totalQuantity,
        address supplier
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (totalQuantity == 0) revert ZeroAmount();
        if (batchIdToTokenId[batchId] != 0) revert DuplicateBatch();

        tokenId = nextTokenId++;
        orderIdOf[tokenId] = orderId;
        batchIdOf[tokenId] = batchId;
        productNameOf[tokenId] = productName;
        originOf[tokenId] = origin;
        packagingOf[tokenId] = packaging;
        totalQuantityOf[tokenId] = totalQuantity;
        supplierOf[tokenId] = supplier;
        statusOf[tokenId] = BatchStatus.Pending;
        createdAtOf[tokenId] = block.timestamp;
        batchIdToTokenId[batchId] = tokenId;

        emit BatchCreated(tokenId, orderId, batchId, totalQuantity);
    }

    function verifyBatch(uint256 tokenId, bytes32 attestationHash, address custodian)
        external
        onlyRole(ATTESTOR_ROLE)
    {
        if (totalQuantityOf[tokenId] == 0) revert InvalidAllocation();
        if (verifiedOf[tokenId]) revert AlreadyVerified();

        verifiedOf[tokenId] = true;
        attestationHashOf[tokenId] = attestationHash;
        custodianOf[tokenId] = custodian;
        statusOf[tokenId] = BatchStatus.Verified;
        verifiedAtOf[tokenId] = block.timestamp;

        emit BatchVerified(tokenId, attestationHash, msg.sender);
    }

    function mintAllocation(uint256 tokenId, address[] calldata buyers, uint256[] calldata quantities)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (!verifiedOf[tokenId]) revert NotVerified();
        BatchStatus st = statusOf[tokenId];
        if (st == BatchStatus.Paused || st == BatchStatus.Disputed) revert BatchPausedErr();
        if (buyers.length != quantities.length) revert LengthMismatch();

        uint256 sum;
        for (uint256 i = 0; i < buyers.length; i++) {
            if (!transferAllowlist[buyers[i]]) revert NotAllowlisted();
            if (quantities[i] == 0) revert ZeroAmount();
            sum += quantities[i];
            allocationQty[tokenId][buyers[i]] = quantities[i];
            _batchBuyers[tokenId].push(buyers[i]);
            _mint(buyers[i], tokenId, quantities[i], "");
            emit AllocationMinted(tokenId, buyers[i], quantities[i]);
        }

        if (mintedQuantityOf[tokenId] + sum > totalQuantityOf[tokenId]) revert InvalidAllocation();
        mintedQuantityOf[tokenId] += sum;
        statusOf[tokenId] = BatchStatus.InTransit;
    }

    function verifyAndMint(
        uint256 tokenId,
        address[] calldata buyers,
        uint256[] calldata quantities,
        bytes32 attestationHash
    ) external {
        require(hasRole(ATTESTOR_ROLE, msg.sender), "need attestor");
        require(hasRole(MINTER_ROLE, msg.sender), "need minter");

        if (!verifiedOf[tokenId]) {
            verifiedOf[tokenId] = true;
            attestationHashOf[tokenId] = attestationHash;
            statusOf[tokenId] = BatchStatus.Verified;
            verifiedAtOf[tokenId] = block.timestamp;
            emit BatchVerified(tokenId, attestationHash, msg.sender);
        }

        BatchStatus st = statusOf[tokenId];
        if (st == BatchStatus.Paused || st == BatchStatus.Disputed) revert BatchPausedErr();
        if (buyers.length != quantities.length) revert LengthMismatch();

        uint256 sum;
        for (uint256 i = 0; i < buyers.length; i++) {
            if (!transferAllowlist[buyers[i]]) revert NotAllowlisted();
            if (quantities[i] == 0) revert ZeroAmount();
            sum += quantities[i];
            allocationQty[tokenId][buyers[i]] = quantities[i];
            _batchBuyers[tokenId].push(buyers[i]);
            _mint(buyers[i], tokenId, quantities[i], "");
            emit AllocationMinted(tokenId, buyers[i], quantities[i]);
        }

        if (mintedQuantityOf[tokenId] + sum > totalQuantityOf[tokenId]) revert InvalidAllocation();
        mintedQuantityOf[tokenId] += sum;
        statusOf[tokenId] = BatchStatus.InTransit;
    }

    function markArrived(uint256 tokenId) external onlyRole(WAREHOUSE_ROLE) {
        require(verifiedOf[tokenId], "not verified");
        statusOf[tokenId] = BatchStatus.Arrived;
    }

    function requestRedemption(uint256 tokenId, uint256 quantity) external whenNotPaused {
        if (quantity == 0) revert ZeroAmount();
        BatchStatus st = statusOf[tokenId];
        if (st == BatchStatus.Paused || st == BatchStatus.Disputed) revert BatchPausedErr();
        if (balanceOf(msg.sender, tokenId) < quantity) revert InsufficientBalance();
        emit RedemptionRequested(tokenId, msg.sender, quantity);
    }

    function confirmRedemption(uint256 tokenId, address buyer, uint256 quantity)
        external
        onlyRole(WAREHOUSE_ROLE)
        whenNotPaused
    {
        if (quantity == 0) revert ZeroAmount();
        BatchStatus st = statusOf[tokenId];
        if (st == BatchStatus.Paused || st == BatchStatus.Disputed) revert BatchPausedErr();
        if (balanceOf(buyer, tokenId) < quantity) revert InsufficientBalance();

        redeemedQty[tokenId][buyer] += quantity;
        redeemedQuantityOf[tokenId] += quantity;
        _burn(buyer, tokenId, quantity);

        if (redeemedQuantityOf[tokenId] >= mintedQuantityOf[tokenId]) {
            statusOf[tokenId] = BatchStatus.Redeemed;
        } else {
            statusOf[tokenId] = BatchStatus.PartiallyRedeemed;
        }

        emit RedemptionConfirmed(tokenId, buyer, quantity);
    }

    function pauseBatch(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        statusOf[tokenId] = BatchStatus.Paused;
        emit BatchPaused(tokenId);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
        whenNotPaused
    {
        if (transfersRestricted && from != address(0) && to != address(0)) {
            if (!transferAllowlist[from] || !transferAllowlist[to]) revert TransfersRestricted();
        }
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getBatchBuyers(uint256 tokenId) external view returns (address[] memory) {
        return _batchBuyers[tokenId];
    }
}
