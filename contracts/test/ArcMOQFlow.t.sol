// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GroupOrder} from "../src/GroupOrder.sol";
import {WarehouseReceipt} from "../src/WarehouseReceipt.sol";
import {StableFXAdapter} from "../src/StableFXAdapter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

contract ArcMOQFlowTest is Test {
    MockERC20 usdc;
    MockERC20 eurc;
    StableFXAdapter fx;
    GroupOrder groupOrder;
    WarehouseReceipt receipt;

    address agent = makeAddr("agent");
    address supplier = makeAddr("olivaSur");
    address warehouse = makeAddr("warehouse");
    address attestor = makeAddr("attestor");

    address restaurantA = makeAddr("restaurantA");
    address restaurantB = makeAddr("restaurantB");
    address hotelC = makeAddr("hotelC");
    address groceryD = makeAddr("groceryD");
    address cateringE = makeAddr("cateringE");

    uint256 constant TIN_PRICE_EURC = 38_100_000; // €38.10 * 1e6

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        eurc = new MockERC20("Euro Coin", "EURC", 6);
        fx = new StableFXAdapter(address(usdc), address(eurc));
        groupOrder = new GroupOrder(address(usdc), address(eurc), agent, address(fx));
        receipt = new WarehouseReceipt(address(this), attestor, warehouse);

        groupOrder.setWarehouseReceipt(address(receipt));
        groupOrder.setSupplierWhitelist(supplier, true);

        eurc.mint(address(this), 10_000_000e6);
        eurc.approve(address(fx), type(uint256).max);
        fx.seedEURC(5_000_000e6);

        address[5] memory buyers = [restaurantA, restaurantB, hotelC, groceryD, cateringE];
        for (uint256 i = 0; i < 5; i++) {
            groupOrder.setKYB(buyers[i], true);
            receipt.setTransferAllowlist(buyers[i], true);
            usdc.mint(buyers[i], 100_000e6);
        }
    }

    function testFullOliveOilFlow() public {
        uint256 orderId =
            groupOrder.createOrder("Extra Virgin Olive Oil", "Jaen, Spain", "5-liter tins", 1000, 30 days);

        _joinAndFund(orderId, restaurantA, 100, "Restaurant A", 20_000e6);
        _joinAndFund(orderId, restaurantB, 180, "Restaurant B", 30_000e6);
        _joinAndFund(orderId, hotelC, 250, "Hotel C", 40_000e6);
        _joinAndFund(orderId, groceryD, 130, "Grocery D", 25_000e6);
        _joinAndFund(orderId, cateringE, 200, "Catering E", 35_000e6);

        assertEq(groupOrder.totalDemand(orderId), 860);
        assertEq(uint256(groupOrder.orderStatus(orderId)), uint256(GroupOrder.OrderStatus.Funded));

        uint256 totalEURC = 860 * TIN_PRICE_EURC;
        bytes32 terms = keccak256("oliva-sur-860-38.10-eurc-immediate-monthly");

        vm.prank(agent);
        uint256 offerId = groupOrder.submitSupplierOffer(
            orderId,
            supplier,
            860,
            TIN_PRICE_EURC,
            30,
            block.timestamp + 5 minutes,
            keccak256("oliva-sur"),
            true,
            terms
        );

        uint256 usdcNeeded = _usdcForEURC(totalEURC);
        uint256 quotedOut = fx.previewSwap(usdcNeeded);
        assertGe(quotedOut, totalEURC);
        bytes32 qid = keccak256(abi.encodePacked("test-quote", usdcNeeded, block.timestamp, quotedOut));

        vm.prank(agent);
        groupOrder.acceptSupplierOffer(orderId, offerId, usdcNeeded);

        vm.prank(agent);
        groupOrder.executeSettlement(orderId, usdcNeeded, qid, totalEURC);

        assertEq(uint256(groupOrder.orderStatus(orderId)), uint256(GroupOrder.OrderStatus.Settled));
        assertGe(eurc.balanceOf(supplier), totalEURC);

        uint256 tokenId = receipt.createBatch(
            orderId, "EVOO-ES-UAE-001", "Extra Virgin Olive Oil", "Jaen, Spain", "5-liter tins", 860, supplier
        );

        bytes32 attestation = keccak256("bol+packing+invoice+warehouse");
        vm.prank(attestor);
        receipt.verifyBatch(tokenId, attestation, warehouse);

        address[] memory buyers = new address[](5);
        buyers[0] = restaurantA;
        buyers[1] = restaurantB;
        buyers[2] = hotelC;
        buyers[3] = groceryD;
        buyers[4] = cateringE;
        uint256[] memory qtys = new uint256[](5);
        qtys[0] = 100;
        qtys[1] = 180;
        qtys[2] = 250;
        qtys[3] = 130;
        qtys[4] = 200;

        receipt.mintAllocation(tokenId, buyers, qtys);

        assertEq(receipt.balanceOf(restaurantA, tokenId), 100);
        assertEq(receipt.balanceOf(hotelC, tokenId), 250);

        vm.prank(warehouse);
        receipt.markArrived(tokenId);

        vm.prank(restaurantA);
        receipt.requestRedemption(tokenId, 100);

        vm.prank(warehouse);
        receipt.confirmRedemption(tokenId, restaurantA, 100);

        assertEq(receipt.balanceOf(restaurantA, tokenId), 0);
        assertEq(receipt.redeemedQuantityOf(tokenId), 100);
    }

    function testPolicyRejectsNonWhitelistedSupplier() public {
        uint256 orderId = groupOrder.createOrder("EVOO", "Spain", "5L", 1000, 7 days);
        address bad = makeAddr("badSupplier");

        vm.prank(agent);
        vm.expectRevert(GroupOrder.SupplierNotWhitelisted.selector);
        groupOrder.submitSupplierOffer(
            orderId, bad, 860, TIN_PRICE_EURC, 30, block.timestamp + 60, keccak256("bad"), true, bytes32(0)
        );
    }

    function _joinAndFund(uint256 orderId, address buyer, uint256 qty, string memory name, uint256 maxUsdc) internal {
        vm.prank(buyer);
        groupOrder.joinOrder(orderId, qty, maxUsdc, block.timestamp + 120 days, 200, name);

        vm.startPrank(buyer);
        usdc.approve(address(groupOrder), maxUsdc);
        groupOrder.fundMandate(orderId, maxUsdc);
        vm.stopPrank();
    }

    function _usdcForEURC(uint256 targetEURC) internal view returns (uint256) {
        uint256 rate = fx.rateEURCperUSDC();
        uint256 fee = fx.feeBps();
        uint256 gross = (targetEURC * 10_000) / (10_000 - fee) + 1;
        return (gross * 1e6) / rate + 1;
    }
}
