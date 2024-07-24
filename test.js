import bitcore from "bitcore-lib";

import {Account} from "./account.js";
import {SysPass} from "../pass/index.js";

const pass = await SysPass.toGetPass();

let account = new Account({
	wif: pass.get("wallet/trustwallet/g/wif"),
	segwit: true,
	// network: "testnet",
});

console.log({
	network: account.network,
	segwit: account.segwit,
	pub: account.pub,
	address: account.address,
	// key: account.key,
	// wif: account.wif,
});
