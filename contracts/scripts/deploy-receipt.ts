import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying WarehouseReceipt with:", deployer.address);

  const WarehouseReceipt = await ethers.getContractFactory("WarehouseReceipt");
  const receipt = await WarehouseReceipt.deploy("https://arcmoq.demo/receipt/{id}.json");
  await receipt.waitForDeployment();
  const receiptAddress = await receipt.getAddress();
  console.log("WarehouseReceipt:", receiptAddress);

  const deployPath = path.join(__dirname, "../deployments.arc-testnet.json");
  const backendPath = path.join(__dirname, "../../backend/src/config/deployments.json");

  let deployment: Record<string, unknown> = {};
  if (fs.existsSync(deployPath)) {
    deployment = JSON.parse(fs.readFileSync(deployPath, "utf8"));
  } else {
    deployment = {
      network: "arcTestnet",
      chainId: 5042002,
      deployer: deployer.address,
      contracts: {
        StableFXAdapter: "0xA0D7127e6512166318d6FBdd21BB872Af2B6D9D9",
        GroupOrder: "0x9954B8aa5FBAF1E8e939aE063d5016d60FF1E50a",
        USDC: "0x3600000000000000000000000000000000000000",
        EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      },
    };
  }

  (deployment as { contracts: Record<string, string> }).contracts.WarehouseReceipt = receiptAddress;
  (deployment as { deployer: string }).deployer = deployer.address;
  (deployment as { deployedAt: string }).deployedAt = new Date().toISOString();

  fs.writeFileSync(deployPath, JSON.stringify(deployment, null, 2));
  fs.writeFileSync(backendPath, JSON.stringify(deployment, null, 2));
  console.log("Updated deployments");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
