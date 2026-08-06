import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ARC_USDC = "0x3600000000000000000000000000000000000000";
const ARC_EURC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const StableFXAdapter = await ethers.getContractFactory("StableFXAdapter");
  const fxAdapter = await StableFXAdapter.deploy(ARC_USDC, ARC_EURC);
  await fxAdapter.waitForDeployment();
  const fxAdapterAddress = await fxAdapter.getAddress();
  console.log("StableFXAdapter:", fxAdapterAddress);

  const GroupOrder = await ethers.getContractFactory("GroupOrder");
  const groupOrder = await GroupOrder.deploy(ARC_USDC, fxAdapterAddress);
  await groupOrder.waitForDeployment();
  const groupOrderAddress = await groupOrder.getAddress();
  console.log("GroupOrder:", groupOrderAddress);

  await fxAdapter.setGroupOrder(groupOrderAddress);
  console.log("Linked GroupOrder to StableFXAdapter");

  const WarehouseReceipt = await ethers.getContractFactory("WarehouseReceipt");
  const receipt = await WarehouseReceipt.deploy("https://arcmoq.demo/receipt/{id}.json");
  await receipt.waitForDeployment();
  const receiptAddress = await receipt.getAddress();
  console.log("WarehouseReceipt:", receiptAddress);

  const deployment = {
    network: "arcTestnet",
    chainId: 5042002,
    deployer: deployer.address,
    contracts: {
      StableFXAdapter: fxAdapterAddress,
      GroupOrder: groupOrderAddress,
      WarehouseReceipt: receiptAddress,
      USDC: ARC_USDC,
      EURC: ARC_EURC,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "../../backend/src/config");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deployments.json"), JSON.stringify(deployment, null, 2));
  fs.writeFileSync(path.join(__dirname, "../deployments.arc-testnet.json"), JSON.stringify(deployment, null, 2));

  console.log("\nDeployment saved to backend/src/config/deployments.json");
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
