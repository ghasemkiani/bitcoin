import bitcore from "bitcore-lib";
// import explorers from "bitcore-explorers";
import {blockexplorer} from "blockchain.info";

import {cutil} from "@ghasemkiani/base";
import {Obj} from "@ghasemkiani/base";
// import {Client} from "@ghasemkiani/sochain";
// import {Client} from "@ghasemkiani/blockchain-info";
import {Client} from "@ghasemkiani/blockstream-api";
import {HDWallet} from "@ghasemkiani/hdwallet"

const {PrivateKey, PublicKey, Address, Networks} = bitcore;

class Account extends Obj {
	static {
		cutil.extend(this.prototype, {
			_pub: null,
			_key: null,
			_address: null,
			balance: 0,
			txs: null,
			_network: null,
			_segwit: null,
		});
	}
	get network() {
		if (cutil.na(this._network)) {
			this._network = "mainnet";
		}
		return this._network;
	}
	set network(network) {
		this._network = network;
	}
	get bitcoreNetwork() {
		return /test/.test(this.network) ? Networks.testnet : Networks.mainnet;
	}
	set bitcoreNetwork(bitcoreNetwork) {
		if (cutil.a(bitcoreNetwork)) {
			// only one testnet is supported
			this.network = cutil.isString(bitcoreNetwork) ? bitcoreNetwork : /test/.test(bitcoreNetwork.name) ? "testnet" : "mainnet";
		}
	}
	get segwit() {
		if (cutil.na(this._segwit)) {
			this._segwit = cutil.a(this._address) ? /^(bc|tb|bcrt)/.test(this._address) : true;
		}
		return this._segwit;
	}
	set segwit(segwit) {
		this._segwit = segwit;
	}
	get key() {
		return this._key;
	}
	set key(key) {
		if (!cutil.na(key)) {
			this._key = new PrivateKey(key, this.bitcoreNetwork).toString();
		} else {
			this._key = key;
		}
	}
	get wif() {
		return cutil.na(this.key) ? null : new PrivateKey(this.key, this.bitcoreNetwork).toWIF().toString();
	}
	set wif(wif) {
		if (cutil.na(wif)) {
			// this.key = null;
		} else {
			try {
				this.key = new PrivateKey(wif, Networks.mainnet).toString();
				this.network = "mainnet";
			} catch (e) {
				this.key = new PrivateKey(wif, Networks.testnet).toString();
				this.network = "testnet";
			}
		}
	}
	get pub() {
		if (!this._pub && this.key) {
			this._pub = new PrivateKey(this.key, this.bitcoreNetwork).toPublicKey().toString();
		}
		return this._pub;
	}
	set pub(pub) {
		this._pub = pub;
	}
	get address() {
		if (cutil.na(this._address)) {
			if (this.pub) {
				this._address = new Address(new PublicKey(this.pub), this.bitcoreNetwork, this.segwit ? Address.PayToWitnessPublicKeyHash : null).toString();
			}
		}
		return this._address;
	}
	set address(address) {
		this._address = address;
	}
	async toGetBalance1() {
		let offset = 0;
		let limit = 0;
		let options = {limit, offset};
		let address = this.address;
		let result = await blockexplorer.getAddress(address, options)
		this.balance = cutil.asNumber(result.final_balance) * 1e-8;
		return this.balance;
	}
	async toGetBalance() {
		let client = new Client();
		let address = this.address;
		let balance = await client.toGetAddressBalance(address);
		this.balance = balance;
		return this.balance;
	}
	async toUpdate() {
		await this.toGetBalance();
	}
	async toGetTxs() {
		let address = this.address;
		this.txs = [];
		let limit = 50;
		let offset = 0;
		loop:
		while(true) {
			let {final_balance, n_tx, txs} = await blockexplorer.getAddress(address, {limit, offset});
			let n = txs.length;
			this.balance = cutil.asNumber(final_balance) * 1e-8;
			this.txs = this.txs.concat(txs);
			offset += n;
			if(offset >= n_tx) {
				break loop;
			}
		}
	}
}

export {Account};
