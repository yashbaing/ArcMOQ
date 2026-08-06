// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GroupOrder} from "../src/GroupOrder.sol";
import {WarehouseReceipt} from "../src/WarehouseReceipt.sol";
import {StableFXAdapter} from "../src/StableFXAdapter.sol";

/// @notice Deploy ArcMOQ contracts to Arc Testnet.
contract DeployArcMOQ is Script {
    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    address constant ARC_EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address agent = vm.envOr("AGENT_ADDRESS", deployer);
        address attestor = vm.envOr("ATTESTOR_ADDRESS", deployer);
        address warehouse = vm.envOr("WAREHOUSE_ADDRESS", deployer);
        address supplier = vm.envOr("SUPPLIER_ADDRESS", deployer);

        console2.log("Deployer:", deployer);
        console2.log("Agent:", agent);

        vm.startBroadcast(pk);

        StableFXAdapter fx = new StableFXAdapter(ARC_USDC, ARC_EURC);
        GroupOrder groupOrder = new GroupOrder(ARC_USDC, ARC_EURC, agent, address(fx));
        WarehouseReceipt receipt = new WarehouseReceipt(deployer, attestor, warehouse);

        groupOrder.setWarehouseReceipt(address(receipt));
        groupOrder.setSupplierWhitelist(supplier, true);
        groupOrder.setKYB(deployer, true);

        receipt.grantRole(receipt.MINTER_ROLE(), agent);
        receipt.grantRole(receipt.ATTESTOR_ROLE(), agent);
        receipt.setTransferAllowlist(deployer, true);
        receipt.setTransferAllowlist(supplier, true);

        uint256 orderId = groupOrder.createOrder(
            "Extra Virgin Olive Oil", "Jaen, Spain", "5-liter tins", 1000, 90 days
        );

        vm.stopBroadcast();

        console2.log("=== ArcMOQ Deployment (Arc Testnet) ===");
        console2.log("StableFXAdapter:", address(fx));
        console2.log("GroupOrder:", address(groupOrder));
        console2.log("WarehouseReceipt:", address(receipt));
        console2.log("Demo Order ID:", orderId);
        console2.log("USDC:", ARC_USDC);
        console2.log("EURC:", ARC_EURC);
        console2.log("Explorer: https://testnet.arcscan.app");
    }
}
