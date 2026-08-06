import { expect } from "chai";
import { ethers } from "hardhat";

const USDC = "0x3600000000000000000000000000000000000000";
const EURC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

describe("ArcMOQ Contracts", function () {
  it("deploys and links contracts", async function () {
    const [admin, buyer, supplier] = await ethers.getSigners();

    const StableFXAdapter = await ethers.getContractFactory("StableFXAdapter");
    const fx = await StableFXAdapter.deploy(USDC, EURC);
    await fx.waitForDeployment();

    const GroupOrder = await ethers.getContractFactory("GroupOrder");
    const order = await GroupOrder.deploy(USDC, await fx.getAddress());
    await order.waitForDeployment();
    await fx.setGroupOrder(await order.getAddress());

    const WarehouseReceipt = await ethers.getContractFactory("WarehouseReceipt");
    const receipt = await WarehouseReceipt.deploy("https://arcmoq.demo/{id}.json");
    await receipt.waitForDeployment();

    await order.setKybApproved(buyer.address, true);
    await order.setSupplierWhitelist(supplier.address, true);

    await order.createOrder("EVOO", "Jaen, Spain", "5L tins", 860);
    await order.connect(buyer).joinOrder(1, 100, ethers.parseUnits("5000", 6), Math.floor(Date.now() / 1000) + 86400 * 30, 200);

    const demand = await order.getTotalDemand(1);
    expect(demand).to.equal(100n);
  });

  it("quotes FX adapter", async function () {
    const StableFXAdapter = await ethers.getContractFactory("StableFXAdapter");
    const fx = await StableFXAdapter.deploy(USDC, EURC);
    await fx.waitForDeployment();

    const [eurcOut] = await fx.quote(ethers.parseUnits("1000", 6));
    expect(eurcOut).to.be.gt(0);
  });
});
