// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IStableFXAdapter} from "./interfaces/IStableFXAdapter.sol";
import {IWarehouseReceipt} from "./interfaces/IWarehouseReceipt.sol";

/// @title GroupOrder
/// @notice Pools UAE SME buyer mandates in USDC and settles Spanish suppliers in EURC on Arc.
/// @dev AI agent may only execute when policy gates pass (whitelist, funding, expiry, budgets).
contract GroupOrder {
    enum OrderStatus {
        Open,
        Funded,
        OfferAccepted,
        Settled,
        Cancelled,
        Expired
    }

    struct BuyerMandate {
        address buyer;
        uint256 quantity;
        uint256 maxUSDC;
        uint256 deliveryDeadline;
        uint256 maxSlippageBps;
        bool funded;
        bool active;
        uint256 fundedUSDC;
        uint256 usedUSDC;
    }

    struct SupplierOffer {
        address supplier;
        uint256 quantity;
        uint256 unitPriceEURC;
        uint256 totalEURC;
        uint256 deliveryDays;
        uint256 expiry;
        bytes32 termsHash;
        bytes32 supplierId;
        bool accepted;
        bool paysEURC;
    }

    IERC20 public immutable usdc;
    IERC20 public immutable eurc;
    IStableFXAdapter public stableFX;
    IWarehouseReceipt public warehouseReceipt;

    address public owner;
    address public agent;

    uint256 public nextOrderId = 1;
    uint256 public nextOfferId = 1;
    uint256 public defaultMaxSlippageBps = 200;

    // order metadata
    mapping(uint256 => string) public productName;
    mapping(uint256 => string) public origin;
    mapping(uint256 => string) public packaging;
    mapping(uint256 => string) public businessName; // keyed as orderId<<160 | buyer — too heavy; use separate map
    mapping(uint256 => mapping(address => string)) public mandateBusinessName;

    mapping(uint256 => uint256) public supplierMOQ;
    mapping(uint256 => uint256) public totalDemand;
    mapping(uint256 => uint256) public totalFundedUSDC;
    mapping(uint256 => OrderStatus) public orderStatus;
    mapping(uint256 => uint256) public createdAt;
    mapping(uint256 => uint256) public expiresAt;
    mapping(uint256 => address) public acceptedSupplier;
    mapping(uint256 => uint256) public acceptedOfferId;
    mapping(uint256 => uint256) public settlementUSDC;
    mapping(uint256 => uint256) public settlementEURC;
    mapping(uint256 => bytes32) public settlementTxMemo;

    mapping(uint256 => mapping(address => BuyerMandate)) public mandates;
    mapping(uint256 => address[]) private _orderBuyers;
    mapping(uint256 => mapping(uint256 => SupplierOffer)) public offers;
    mapping(uint256 => uint256[]) private _orderOfferIds;
    mapping(address => bool) public whitelistedSuppliers;
    mapping(address => bool) public kybApproved;

    event OrderCreated(uint256 indexed orderId, string product, uint256 supplierMOQ_, uint256 expiresAt_);
    event MandateJoined(uint256 indexed orderId, address indexed buyer, uint256 quantity, uint256 maxUSDC);
    event MandateFunded(uint256 indexed orderId, address indexed buyer, uint256 amountUSDC);
    event SupplierWhitelisted(address indexed supplier, bool approved);
    event BuyerKYBUpdated(address indexed buyer, bool approved);
    event AgentUpdated(address indexed agent);
    event SupplierOfferSubmitted(
        uint256 indexed orderId, uint256 indexed offerId, address supplier, uint256 quantity, uint256 totalEURC
    );
    event SupplierOfferAccepted(uint256 indexed orderId, uint256 indexed offerId, address supplier);
    event SettlementExecuted(
        uint256 indexed orderId, address supplier, uint256 usdcIn, uint256 eurcOut, bytes32 fxQuoteId
    );
    event UnusedFundsReleased(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OrderRefunded(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OrderCancelled(uint256 indexed orderId);
    event OrderExpired(uint256 indexed orderId);

    error NotOwner();
    error NotAgent();
    error NotKYB();
    error InvalidStatus();
    error MandateExists();
    error NoMandate();
    error AlreadyFunded();
    error NotFunded();
    error InsufficientAllowance();
    error TransferFailed();
    error SupplierNotWhitelisted();
    error OfferExpired();
    error OfferNotFound();
    error BudgetsInsufficient();
    error SlippageExceeded();
    error DeadlineMismatch();
    error OrderNotFullyFunded();
    error ZeroAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent && msg.sender != owner) revert NotAgent();
        _;
    }

    constructor(address usdc_, address eurc_, address agent_, address stableFX_) {
        owner = msg.sender;
        usdc = IERC20(usdc_);
        eurc = IERC20(eurc_);
        agent = agent_;
        if (stableFX_ != address(0)) stableFX = IStableFXAdapter(stableFX_);
    }

    function setAgent(address agent_) external onlyOwner {
        agent = agent_;
        emit AgentUpdated(agent_);
    }

    function setStableFX(address stableFX_) external onlyOwner {
        stableFX = IStableFXAdapter(stableFX_);
    }

    function setWarehouseReceipt(address receipt_) external onlyOwner {
        warehouseReceipt = IWarehouseReceipt(receipt_);
    }

    function setSupplierWhitelist(address supplier, bool approved) external onlyOwner {
        whitelistedSuppliers[supplier] = approved;
        emit SupplierWhitelisted(supplier, approved);
    }

    function setKYB(address buyer, bool approved) external onlyOwner {
        kybApproved[buyer] = approved;
        emit BuyerKYBUpdated(buyer, approved);
    }

    function createOrder(
        string calldata productName_,
        string calldata origin_,
        string calldata packaging_,
        uint256 supplierMOQ_,
        uint256 durationSeconds
    ) external onlyOwner returns (uint256 orderId) {
        orderId = nextOrderId++;
        productName[orderId] = productName_;
        origin[orderId] = origin_;
        packaging[orderId] = packaging_;
        supplierMOQ[orderId] = supplierMOQ_;
        orderStatus[orderId] = OrderStatus.Open;
        createdAt[orderId] = block.timestamp;
        expiresAt[orderId] = block.timestamp + durationSeconds;
        emit OrderCreated(orderId, productName_, supplierMOQ_, expiresAt[orderId]);
    }

    function joinOrder(
        uint256 orderId,
        uint256 quantity,
        uint256 maxUSDC,
        uint256 deliveryDeadline,
        uint256 maxSlippageBps,
        string calldata businessName_
    ) external {
        OrderStatus st = orderStatus[orderId];
        if (st != OrderStatus.Open && st != OrderStatus.Funded) revert InvalidStatus();
        if (block.timestamp > expiresAt[orderId]) revert OfferExpired();
        if (!kybApproved[msg.sender]) revert NotKYB();
        if (mandates[orderId][msg.sender].active) revert MandateExists();
        if (quantity == 0 || maxUSDC == 0) revert ZeroAmount();

        uint256 slip = maxSlippageBps == 0 ? defaultMaxSlippageBps : maxSlippageBps;

        BuyerMandate storage m = mandates[orderId][msg.sender];
        m.buyer = msg.sender;
        m.quantity = quantity;
        m.maxUSDC = maxUSDC;
        m.deliveryDeadline = deliveryDeadline;
        m.maxSlippageBps = slip;
        m.funded = false;
        m.active = true;
        m.fundedUSDC = 0;
        m.usedUSDC = 0;
        mandateBusinessName[orderId][msg.sender] = businessName_;

        _orderBuyers[orderId].push(msg.sender);
        totalDemand[orderId] += quantity;

        emit MandateJoined(orderId, msg.sender, quantity, maxUSDC);
    }

    function fundMandate(uint256 orderId, uint256 amountUSDC) external {
        BuyerMandate storage m = mandates[orderId][msg.sender];
        if (!m.active) revert NoMandate();
        if (m.funded) revert AlreadyFunded();
        if (amountUSDC == 0 || amountUSDC > m.maxUSDC) revert ZeroAmount();
        if (usdc.allowance(msg.sender, address(this)) < amountUSDC) revert InsufficientAllowance();

        if (!usdc.transferFrom(msg.sender, address(this), amountUSDC)) revert TransferFailed();

        m.funded = true;
        m.fundedUSDC = amountUSDC;
        totalFundedUSDC[orderId] += amountUSDC;

        if (_allFunded(orderId)) orderStatus[orderId] = OrderStatus.Funded;

        emit MandateFunded(orderId, msg.sender, amountUSDC);
    }

    function cancelMandate(uint256 orderId) external {
        BuyerMandate storage m = mandates[orderId][msg.sender];
        if (!m.active) revert NoMandate();
        OrderStatus st = orderStatus[orderId];
        if (st == OrderStatus.Settled || st == OrderStatus.OfferAccepted) revert InvalidStatus();

        m.active = false;
        totalDemand[orderId] -= m.quantity;

        if (m.funded && m.fundedUSDC > m.usedUSDC) {
            uint256 refund = m.fundedUSDC - m.usedUSDC;
            m.fundedUSDC = m.usedUSDC;
            totalFundedUSDC[orderId] -= refund;
            if (!usdc.transfer(msg.sender, refund)) revert TransferFailed();
            emit OrderRefunded(orderId, msg.sender, refund);
        }
    }

    function submitSupplierOffer(
        uint256 orderId,
        address supplier,
        uint256 quantity,
        uint256 unitPriceEURC,
        uint256 deliveryDays,
        uint256 expiry,
        bytes32 supplierId,
        bool paysEURC,
        bytes32 termsHash
    ) external onlyAgent returns (uint256 offerId) {
        OrderStatus st = orderStatus[orderId];
        if (st != OrderStatus.Open && st != OrderStatus.Funded) revert InvalidStatus();
        if (!whitelistedSuppliers[supplier]) revert SupplierNotWhitelisted();
        if (expiry <= block.timestamp) revert OfferExpired();

        offerId = nextOfferId++;
        uint256 total = quantity * unitPriceEURC;

        SupplierOffer storage offer = offers[orderId][offerId];
        offer.supplier = supplier;
        offer.quantity = quantity;
        offer.unitPriceEURC = unitPriceEURC;
        offer.totalEURC = total;
        offer.deliveryDays = deliveryDays;
        offer.expiry = expiry;
        offer.termsHash = termsHash;
        offer.supplierId = supplierId;
        offer.accepted = false;
        offer.paysEURC = paysEURC;

        _orderOfferIds[orderId].push(offerId);
        emit SupplierOfferSubmitted(orderId, offerId, supplier, quantity, total);
    }

    function acceptSupplierOffer(uint256 orderId, uint256 offerId, uint256 maxUSDCForFX) external onlyAgent {
        OrderStatus st = orderStatus[orderId];
        if (st != OrderStatus.Funded && st != OrderStatus.Open) revert InvalidStatus();
        if (!_allFunded(orderId)) revert OrderNotFullyFunded();

        SupplierOffer storage offer = offers[orderId][offerId];
        if (offer.supplier == address(0)) revert OfferNotFound();
        if (offer.accepted) revert InvalidStatus();
        if (block.timestamp > offer.expiry) revert OfferExpired();
        if (!whitelistedSuppliers[offer.supplier]) revert SupplierNotWhitelisted();
        if (offer.quantity != totalDemand[orderId]) revert BudgetsInsufficient();
        if (maxUSDCForFX == 0 || maxUSDCForFX > totalFundedUSDC[orderId]) revert BudgetsInsufficient();

        _policyCheck(orderId, offer, maxUSDCForFX);

        offer.accepted = true;
        orderStatus[orderId] = OrderStatus.OfferAccepted;
        acceptedSupplier[orderId] = offer.supplier;
        acceptedOfferId[orderId] = offerId;

        emit SupplierOfferAccepted(orderId, offerId, offer.supplier);
    }

    function executeSettlement(uint256 orderId, uint256 usdcAmount, bytes32 fxQuoteId, uint256 minEURCOut)
        external
        onlyAgent
    {
        if (orderStatus[orderId] != OrderStatus.OfferAccepted) revert InvalidStatus();

        uint256 oid = acceptedOfferId[orderId];
        SupplierOffer storage offer = offers[orderId][oid];
        if (block.timestamp > offer.expiry) revert OfferExpired();
        if (!whitelistedSuppliers[offer.supplier]) revert SupplierNotWhitelisted();
        if (usdcAmount == 0 || usdcAmount > totalFundedUSDC[orderId]) revert BudgetsInsufficient();

        _allocateBuyerCosts(orderId, usdcAmount);

        require(address(stableFX) != address(0), "StableFX not set");
        usdc.approve(address(stableFX), usdcAmount);

        uint256 eurcOut = stableFX.swapUSDCtoEURC(usdcAmount, minEURCOut, fxQuoteId, offer.supplier);
        if (eurcOut < minEURCOut) revert SlippageExceeded();

        orderStatus[orderId] = OrderStatus.Settled;
        settlementUSDC[orderId] = usdcAmount;
        settlementEURC[orderId] = eurcOut;
        settlementTxMemo[orderId] = fxQuoteId;

        emit SettlementExecuted(orderId, offer.supplier, usdcAmount, eurcOut, fxQuoteId);
        _releaseUnusedFunds(orderId);
    }

    function refundExpiredOrder(uint256 orderId) external {
        OrderStatus st = orderStatus[orderId];
        if (st == OrderStatus.Settled) revert InvalidStatus();
        if (block.timestamp <= expiresAt[orderId] && st != OrderStatus.Cancelled) revert InvalidStatus();

        orderStatus[orderId] = OrderStatus.Expired;
        address[] memory buyers = _orderBuyers[orderId];
        for (uint256 i = 0; i < buyers.length; i++) {
            BuyerMandate storage m = mandates[orderId][buyers[i]];
            if (m.funded && m.fundedUSDC > m.usedUSDC) {
                uint256 refund = m.fundedUSDC - m.usedUSDC;
                m.fundedUSDC = m.usedUSDC;
                totalFundedUSDC[orderId] -= refund;
                if (!usdc.transfer(buyers[i], refund)) revert TransferFailed();
                emit OrderRefunded(orderId, buyers[i], refund);
            }
        }
        emit OrderExpired(orderId);
    }

    function cancelOrder(uint256 orderId) external onlyOwner {
        if (orderStatus[orderId] == OrderStatus.Settled) revert InvalidStatus();
        orderStatus[orderId] = OrderStatus.Cancelled;
        emit OrderCancelled(orderId);
    }

    function getBuyers(uint256 orderId) external view returns (address[] memory) {
        return _orderBuyers[orderId];
    }

    function getOfferIds(uint256 orderId) external view returns (uint256[] memory) {
        return _orderOfferIds[orderId];
    }

    function _allFunded(uint256 orderId) internal view returns (bool) {
        address[] memory buyers = _orderBuyers[orderId];
        if (buyers.length == 0) return false;
        for (uint256 i = 0; i < buyers.length; i++) {
            BuyerMandate storage m = mandates[orderId][buyers[i]];
            if (m.active && !m.funded) return false;
        }
        return true;
    }

    function _policyCheck(uint256 orderId, SupplierOffer storage offer, uint256 maxUSDCForFX) internal view {
        address[] memory buyers = _orderBuyers[orderId];
        uint256 deliveryTs = block.timestamp + (offer.deliveryDays * 1 days);
        uint256 demand = totalDemand[orderId];

        for (uint256 i = 0; i < buyers.length; i++) {
            BuyerMandate storage m = mandates[orderId][buyers[i]];
            if (!m.active || !m.funded) revert NotFunded();
            if (deliveryTs > m.deliveryDeadline) revert DeadlineMismatch();
            uint256 share = (maxUSDCForFX * m.quantity) / demand;
            if (share > m.maxUSDC || share > m.fundedUSDC) revert BudgetsInsufficient();
        }
    }

    function _allocateBuyerCosts(uint256 orderId, uint256 usdcAmount) internal {
        address[] memory buyers = _orderBuyers[orderId];
        uint256 demand = totalDemand[orderId];
        uint256 allocated;

        for (uint256 i = 0; i < buyers.length; i++) {
            BuyerMandate storage m = mandates[orderId][buyers[i]];
            uint256 share = (usdcAmount * m.quantity) / demand;
            if (share > m.fundedUSDC || share > m.maxUSDC) revert BudgetsInsufficient();
            m.usedUSDC = share;
            allocated += share;
        }

        if (allocated < usdcAmount && buyers.length > 0) {
            uint256 dust = usdcAmount - allocated;
            BuyerMandate storage last = mandates[orderId][buyers[buyers.length - 1]];
            if (last.usedUSDC + dust > last.fundedUSDC) revert BudgetsInsufficient();
            last.usedUSDC += dust;
        }
    }

    function _releaseUnusedFunds(uint256 orderId) internal {
        address[] memory buyers = _orderBuyers[orderId];
        for (uint256 i = 0; i < buyers.length; i++) {
            BuyerMandate storage m = mandates[orderId][buyers[i]];
            if (m.fundedUSDC > m.usedUSDC) {
                uint256 unused = m.fundedUSDC - m.usedUSDC;
                m.fundedUSDC = m.usedUSDC;
                totalFundedUSDC[orderId] -= unused;
                if (!usdc.transfer(buyers[i], unused)) revert TransferFailed();
                emit UnusedFundsReleased(orderId, buyers[i], unused);
            }
        }
    }
}
