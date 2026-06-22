import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  const MediBridgeLedger = await ethers.getContractFactory("MediBridgeLedger");
  const contract = await MediBridgeLedger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MediBridgeLedger deployed to:", address);

  // Write ABI + address to a file the frontend can import
  const outDir = join(__dirname, "..", "lib", "blockchain");
  mkdirSync(outDir, { recursive: true });

  // Get ABI from Hardhat artifacts
  const artifactPath = join(
    __dirname,
    "..",
    "artifacts_contract",
    "contracts",
    "MediBridgeLedger.sol",
    "MediBridgeLedger.json"
  );
  const artifact = JSON.parse(require("fs").readFileSync(artifactPath, "utf8"));

  const output = {
    address,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    abi: artifact.abi,
  };

  const outPath = join(outDir, "ledger.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log("Contract info written to:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
