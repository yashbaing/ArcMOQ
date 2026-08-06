// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GroupOrder} from "../src/GroupOrder.sol";
import {WarehouseReceipt} from "../src/WarehouseReceipt.sol";
import {StableFXAdapter} from "../src/StableFXAdapter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @notice Local anvil deploy for offline demos when Arc faucet keys are unavailable.
contract DeployLocal is Script {
    function run() external {
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        MockERC20 eurc = new MockERC20("Euro Coin", "EURC", 6);
        StableFXAdapter fx = new StableFXAdapter(address(usdc), address(eurc));
        GroupOrder groupOrder = new GroupOrder(address(usdc), address(eurc), deployer, address(fx));
        WarehouseReceipt receipt = new WarehouseReceipt(deployer, deployer, deployer);

        groupOrder.setWarehouseReceipt(address(receipt));
        groupOrder.setSupplierWhitelist(deployer, true);
        groupOrder.setKYB(deployer, true);
        receipt.setTransferAllowlist(deployer, true);
        receipt.grantRole(receipt.MINTER_ROLE(), deployer);
        receipt.grantRole(receipt.ATTESTOR_ROLE(), deployer);

        usdc.mint(deployer, 1_000_000e6);
        eurc.mint(deployer, 1_000_000e6);
        eurc.approve(address(fx), 500_000e6);
        fx.seedEURC(500_000e6);

        uint256 orderId = groupOrder.createOrder(
            "Extra Virgin Olive Oil", "Jaen, Spain", "5-liter tins", 1000, 90 days
        );

        vm.stopBroadcast();

        console2.log("USDC", address(usdc));
        console2.log("EURC", address(eurc));
        console2.log("StableFXAdapter", address(fx));
        console2.log("GroupOrder", address(groupOrder));
        console2.log("WarehouseReceipt", address(receipt));
        console2.log("OrderId", orderId);
    }
}
