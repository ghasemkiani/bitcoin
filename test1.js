import bitcore from "bitcore-lib";

import { SysPass } from "../pass/index.js";
const pass = await SysPass.toGetPass();

// Replace with your testnet private key in WIF format
const privateKeyWIF = pass.get("wallet/trustwallet/g/wif");
// console.log({privateKeyWIF});

// 1. Create a PrivateKey object specifying the testnet network
const privateKey = new bitcore.PrivateKey(privateKeyWIF, "mainnet");

// 2. Derive the public key from the private key
const publicKey = privateKey.toPublicKey();

console.log(bitcore.Networks.getNetworkFromWIF);
console.log(bitcore.Networks);
console.log(
  "Mainnet address:",
  new bitcore.Address(publicKey, bitcore.Networks.mainnet).toString(),
);
// console.log("Testnet address:", new bitcore.Address(publicKey, bitcore.Networks.testnet).toString());

console.log(
  "Mainnet address:",
  new bitcore.Address(publicKey, bitcore.Networks.mainnet, null).toString(),
);
console.log(
  "Mainnet address:",
  new bitcore.Address(
    publicKey,
    bitcore.Networks.mainnet,
    bitcore.Address.PayToWitnessPublicKeyHash,
  ).toString(),
);
// console.log("Testnet address:", new bitcore.Address(publicKey, bitcore.Networks.testnet, bitcore.Address.PayToWitnessPublicKeyHash).toString());
