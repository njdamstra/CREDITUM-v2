const fs = require('fs');
const path = require('path');

const artifactsPath = path.join(__dirname, '../artifacts/contracts');
const frontendPath = path.join(__dirname, '../frontend/src/contractABI');

function copyABI(contractName) {
  const abiPath = path.join(artifactsPath, `${contractName}.sol/${contractName}.json`);
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;

  fs.writeFileSync(path.join(frontendPath, `${contractName}.json`), JSON.stringify(abi, null, 2));
  console.log(`ABI for ${contractName} copied to frontend.`);
}

// List all contract names you want to copy
const contracts = ['UserPortal']; // Add other contracts here

if (!fs.existsSync(frontendPath)) {
  fs.mkdirSync(frontendPath, { recursive: true });
}

contracts.forEach(copyABI);



const sourcePath = path.join(__dirname, "../scripts/mockScript/localDeployedAddresses.json");
const destinationPath = path.join(__dirname, "../frontend/src/deployedAddresses.json");

fs.copyFileSync(sourcePath, destinationPath);
console.log("Copied deployedAddresses.json to frontend.");
