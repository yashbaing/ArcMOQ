// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StableFXAdapter.sol";

interface IWarehouseReceipt {
    function createBatch(bytes32 batchId, string calldata productName, uint256 totalQuantity) external returns (uint256);
}

/**
 * @title GroupOrder
 * @notice Pools buyer mandates, accepts supplier offers, and executes EURC settlement.
 */
contract GroupOrder is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable usdc;
    StableFXAdapter public fxAdapter;

    enum OrderStatus {
        Open,
        Funded,
        Negotiating,
        Accepted,
        Settled,
        Expired,
        Cancelled
    }

    struct BuyerMandate {
        address buyer;
        uint256 quantity;
        uint256 maxUSDC;
        uint256 deliveryDeadline;
        uint256 maxSlippageBps;
        uint256 fundedUSDC;
        bool funded;
        bool active;
    }

    struct SupplierOffer {
        address supplier;
        uint256 quantity;
        uint256 unitPriceEurCents;
        uint256 totalEURC;
        uint256 deliveryDays;
        uint256 expiry;
        bytes32 termsHash;
        bool accepted;
    }

    struct GroupOrderData {
        string productName;
        string origin;
        string packaging;
        uint256 targetQuantity;
        uint256 totalFundedUSDC;
        uint256 acceptedOfferId;
        OrderStatus status;
        uint256 createdAt;
        uint256 settledAt;
        address settlementRecipient;
        bytes32 batchId;
        bool exists;
    }

    uint256 public nextOrderId = 1;
    uint256 public nextOfferId = 1;

    mapping(uint256 => GroupOrderData) public orders;
    mapping(uint256 => mapping(address => BuyerMandate)) public mandates;
    mapping(uint256 => address[]) public orderBuyers;
    mapping(uint256 => mapping(uint256 => SupplierOffer)) public offers;
    mapping(uint256 => uint256[]) public orderOffers;
    mapping(address => bool) public whitelistedSuppliers;
    mapping(address => bool) public kybApproved;

    event OrderCreated(uint256 indexed orderId, string productName, uint256 targetQuantity);
    event MandateJoined(uint256 indexed orderId, address indexed buyer, uint256 quantity, uint256 maxUSDC);
    event MandateFunded(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OfferSubmitted(uint256 indexed orderId, uint256 indexed offerId, address supplier, uint256 totalEURC);
    event OfferAccepted(uint256 indexed orderId, uint256 indexed offerId);
    event SettlementExecuted(uint256 indexed orderId, uint256 usdcAmount, uint256 eurcPaid, address supplier);
    event MandateRefunded(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event UnusedFundsReleased(uint256 indexed orderId, address indexed buyer, uint256 amount);

    constructor(address _usdc, address _fxAdapter) {
        usdc = IERC20(_usdc);
        fxAdapter = StableFXAdapter(_fxAdapter);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    function setFxAdapter(address _fxAdapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fxAdapter = StableFXAdapter(_fxAdapter);
    }

    function setSupplierWhitelist(address supplier, bool allowed) external onlyRole(OPERATOR_ROLE) {
        whitelistedSuppliers[supplier] = allowed;
    }

    function setKybApproved(address buyer, bool approved) external onlyRole(OPERATOR_ROLE) {
        kybApproved[buyer] = approved;
    }

    function createOrder(
        string calldata productName,
        string calldata origin,
        string calldata packaging,
        uint256 targetQuantity
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 orderId) {
        orderId = nextOrderId++;
        orders[orderId] = GroupOrderData({
            productName: productName,
            origin: origin,
            packaging: packaging,
            targetQuantity: targetQuantity,
            totalFundedUSDC: 0,
            acceptedOfferId: 0,
            status: OrderStatus.Open,
            createdAt: block.timestamp,
            settledAt: 0,
            settlementRecipient: address(0),
            batchId: bytes32(0),
            exists: true
        });
        emit OrderCreated(orderId, productName, targetQuantity);
    }

    function joinOrder(
        uint256 orderId,
        uint256 quantity,
        uint256 maxUSDC,
        uint256 deliveryDeadline,
        uint256 maxSlippageBps
    ) external {
        GroupOrderData storage order = orders[orderId];
        require(order.exists, "GroupOrder: order not found");
        require(order.status == OrderStatus.Open, "GroupOrder: not open");
        require(kybApproved[msg.sender], "GroupOrder: KYB required");
        require(mandates[orderId][msg.sender].buyer == address(0), "GroupOrder: already joined");

        mandates[orderId][msg.sender] = BuyerMandate({
            buyer: msg.sender,
            quantity: quantity,
            maxUSDC: maxUSDC,
            deliveryDeadline: deliveryDeadline,
            maxSlippageBps: maxSlippageBps,
            fundedUSDC: 0,
            funded: false,
            active: true
        });
        orderBuyers[orderId].push(msg.sender);
        emit MandateJoined(orderId, msg.sender, quantity, maxUSDC);
    }

    function fundMandate(uint256 orderId, uint256 amount) external nonReentrant {
        GroupOrderData storage order = orders[orderId];
        BuyerMandate storage mandate = mandates[orderId][msg.sender];
        require(order.exists, "GroupOrder: order not found");
        require(mandate.active, "GroupOrder: no mandate");
        require(!mandate.funded, "GroupOrder: already funded");
        require(amount <= mandate.maxUSDC, "GroupOrder: exceeds max");

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        mandate.fundedUSDC = amount;
        mandate.funded = true;
        order.totalFundedUSDC += amount;

        if (order.status == OrderStatus.Open) {
            order.status = OrderStatus.Funded;
        }
        emit MandateFunded(orderId, msg.sender, amount);
    }

    function submitSupplierOffer(
        uint256 orderId,
        address supplier,
        uint256 quantity,
        uint256 unitPriceEurCents,
        uint256 deliveryDays,
        uint256 expiry,
        bytes32 termsHash
    ) external onlyRole(AGENT_ROLE) returns (uint256 offerId) {
        GroupOrderData storage order = orders[orderId];
        require(order.exists, "GroupOrder: order not found");
        require(whitelistedSuppliers[supplier], "GroupOrder: supplier not whitelisted");

        // unitPriceEurCents: e.g. 3810 = €38.10; result in EURC 6-decimal units
        uint256 totalEURC = (quantity * unitPriceEurCents * 1e4);
        offerId = nextOfferId++;
        offers[orderId][offerId] = SupplierOffer({
            supplier: supplier,
            quantity: quantity,
            unitPriceEurCents: unitPriceEurCents,
            totalEURC: totalEURC,
            deliveryDays: deliveryDays,
            expiry: expiry,
            termsHash: termsHash,
            accepted: false
        });
        orderOffers[orderId].push(offerId);
        order.status = OrderStatus.Negotiating;
        emit OfferSubmitted(orderId, offerId, supplier, totalEURC);
    }

    function acceptSupplierOffer(uint256 orderId, uint256 offerId) external onlyRole(AGENT_ROLE) {
        GroupOrderData storage order = orders[orderId];
        SupplierOffer storage offer = offers[orderId][offerId];
        require(order.exists, "GroupOrder: order not found");
        require(offer.supplier != address(0), "GroupOrder: offer not found");
        require(block.timestamp <= offer.expiry, "GroupOrder: offer expired");

        offer.accepted = true;
        order.acceptedOfferId = offerId;
        order.status = OrderStatus.Accepted;
        order.settlementRecipient = offer.supplier;
        emit OfferAccepted(orderId, offerId);
    }

    function executeSettlement(uint256 orderId, uint256 usdcAmount) external onlyRole(AGENT_ROLE) nonReentrant {
        GroupOrderData storage order = orders[orderId];
        require(order.exists, "GroupOrder: order not found");
        require(order.status == OrderStatus.Accepted, "GroupOrder: not accepted");

        SupplierOffer storage offer = offers[orderId][order.acceptedOfferId];
        require(offer.accepted, "GroupOrder: offer not accepted");
        require(block.timestamp <= offer.expiry, "GroupOrder: offer expired");
        require(order.totalFundedUSDC >= usdcAmount, "GroupOrder: insufficient funds");

        usdc.approve(address(fxAdapter), usdcAmount);
        uint256 eurcPaid = fxAdapter.swapToEURC(usdcAmount, offer.supplier);

        order.status = OrderStatus.Settled;
        order.settledAt = block.timestamp;
        emit SettlementExecuted(orderId, usdcAmount, eurcPaid, offer.supplier);
    }

    function releaseUnusedFunds(uint256 orderId, address buyer) external onlyRole(AGENT_ROLE) nonReentrant {
        BuyerMandate storage mandate = mandates[orderId][buyer];
        require(mandate.funded, "GroupOrder: not funded");
        uint256 unused = mandate.maxUSDC - mandate.fundedUSDC;
        if (unused > 0) {
            mandate.maxUSDC = mandate.fundedUSDC;
            usdc.safeTransfer(buyer, unused);
            emit UnusedFundsReleased(orderId, buyer, unused);
        }
    }

    function refundExpiredOrder(uint256 orderId) external onlyRole(OPERATOR_ROLE) nonReentrant {
        GroupOrderData storage order = orders[orderId];
        require(order.exists, "GroupOrder: order not found");
        require(order.status != OrderStatus.Settled, "GroupOrder: already settled");

        address[] memory buyers = orderBuyers[orderId];
        for (uint256 i = 0; i < buyers.length; i++) {
            BuyerMandate storage mandate = mandates[orderId][buyers[i]];
            if (mandate.funded && mandate.fundedUSDC > 0) {
                uint256 amount = mandate.fundedUSDC;
                mandate.fundedUSDC = 0;
                mandate.funded = false;
                mandate.active = false;
                order.totalFundedUSDC -= amount;
                usdc.safeTransfer(buyers[i], amount);
                emit MandateRefunded(orderId, buyers[i], amount);
            }
        }
        order.status = OrderStatus.Expired;
    }

    function cancelMandate(uint256 orderId) external nonReentrant {
        BuyerMandate storage mandate = mandates[orderId][msg.sender];
        GroupOrderData storage order = orders[orderId];
        require(mandate.active, "GroupOrder: no active mandate");
        require(order.status == OrderStatus.Open || order.status == OrderStatus.Funded, "GroupOrder: cannot cancel");

        if (mandate.funded) {
            uint256 amount = mandate.fundedUSDC;
            mandate.fundedUSDC = 0;
            mandate.funded = false;
            order.totalFundedUSDC -= amount;
            usdc.safeTransfer(msg.sender, amount);
            emit MandateRefunded(orderId, msg.sender, amount);
        }
        mandate.active = false;
    }

    function getOrderBuyers(uint256 orderId) external view returns (address[] memory) {
        return orderBuyers[orderId];
    }

    function getTotalDemand(uint256 orderId) external view returns (uint256 total) {
        address[] memory buyers = orderBuyers[orderId];
        for (uint256 i = 0; i < buyers.length; i++) {
            total += mandates[orderId][buyers[i]].quantity;
        }
    }

    function getOfferIds(uint256 orderId) external view returns (uint256[] memory) {
        return orderOffers[orderId];
    }
}
