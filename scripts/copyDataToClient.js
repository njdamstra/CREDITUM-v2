const fs = require('fs');
const path = require('path');

const artifactsPath = path.join(__dirname, '../artifacts/contracts');
const clientPath = path.join(__dirname, '../client/src/utils/contractABI');

function copyABI(contractName) {
  const abiPath = path.join(artifactsPath, `${contractName}.sol/${contractName}.json`);
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;

  fs.writeFileSync(path.join(clientPath, `${contractName}.json`), JSON.stringify(abi, null, 2));
  console.log(`ABI for ${contractName} copied to client.`);
}

// List all contract names you want to copy
const contracts = ['UserPortal']; // Add other contracts here
// , 'CLendingPool', 'CAddresses', 'CCollateralManager', 'NftTrader', 'NftValues'

if (!fs.existsSync(clientPath)) {
  fs.mkdirSync(clientPath, { recursive: true });
}

contracts.forEach(copyABI);



const sourcePath = path.join(__dirname, "../scripts/mockScript/localDeployedAddresses.json");
const destinationPath = path.join(__dirname, "../client/src/utils/deployedAddresses.json");

fs.copyFileSync(sourcePath, destinationPath);
console.log("Copied deployedAddresses.json to client.");

const sourcePath3 = path.join(__dirname, "../scripts/mockScript/signers.json");
const destinationPath3 = path.join(__dirname, "../client/src/utils/localSigners.json");

fs.copyFileSync(sourcePath3, destinationPath3);
console.log("Copied signers.json to client.");

const sourcePath4 = path.join(__dirname, "../scripts/mockScript/loadWallets.js");
const destinationPath4 = path.join(__dirname, "../client/src/utils/loadWallets.js");

fs.copyFileSync(sourcePath4, destinationPath4);
console.log("Copied loadWallets.jss to client.");
