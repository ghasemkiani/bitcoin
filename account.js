//	@ghasemkiani/bitcoin/account

import bitcore from "bitcore-lib";
// import explorers from "bitcore-explorers";
import {blockexplorer} from "blockchain.info";

import {cutil} from "@ghasemkiani/base";
import {Obj} from "@ghasemkiani/base";
// import {Client} from "@ghasemkiani/sochain";
// import {Client} from "@ghasemkiani/blockchain-info";
import {Client} from "@ghasemkiani/blockstream-api";
import {HDWallet} from "@ghasemkiani/hdwallet"

const {PrivateKey, PublicKey, Address} = bitcore;

class Account extends Obj {
	get key() {
		return this._key;
	}
	set key(key) {
		if (!cutil.isNilOrEmptyString(key)) {
			this._key = new PrivateKey(key).toString();
		} else {
			this._key = key;
		}
	}
	get wif() {
		return cutil.isNilOrEmptyString(this.key) ? null : new PrivateKey(this.key).toWIF().toString();
	}
	set wif(wif) {
		if (cutil.isNilOrEmptyString(wif)) {
			this.key = null;
		} else {
			this.key = PrivateKey.fromWIF(wif).toString();
		}
	}
	get pub() {
		if (!this._pub && this.key) {
			this._pub = new PrivateKey(this.key).toPublicKey().toString();
		}
		return this._pub;
	}
	set pub(pub) {
		this._pub = pub;
	}
	get address() {
		if (cutil.isNilOrEmptyString(this._address)) {
			if (this.pub) {
				this._address = new PublicKey(this.pub).toAddress().toString();
			}
		}
		return this._address;
	}
	set address(address) {
		this._address = address;
	}
	get addressSw() {
		if (cutil.isNilOrEmptyString(this._addressSw)) {
			if (this.pub) {
				this._addressSw = Address.fromPublicKey(new PublicKey(this.pub), null /* default network */, Address.PayToWitnessPublicKeyHash).toString();
			}
		}
		return this._addressSw;
	}
	set addressSw(addressSw) {
		this._addressSw = addressSw;
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
cutil.extend(Account.prototype, {
	_pub: null,
	_key: null,
	_address: null,
	_addressSw: null,
	balance: 0,
	txs: null,
});

export {Account};
