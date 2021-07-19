//	@ghasemkiani/bitcoin/account

const bitcore = require("bitcore-lib");
// const explorers = require("bitcore-explorers");
const {blockexplorer} = require("blockchain.info");

const {cutil} = require("@ghasemkiani/base/cutil");
const {Obj: Base} = require("@ghasemkiani/base/obj");
// const {Client} = require("@ghasemkiani/sochain/client");
const {Client} = require("@ghasemkiani/blockchain-info/client");
const {HDWallet} = require("@ghasemkiani/hdwallet");

class Account extends Base {
	get address() {
		if(this.key) {
			this._address = new bitcore.PrivateKey(this.key).toAddress().toString();
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
cutil.extend(Account.prototype, {
	_address: null,
	key: null,
	balance: 0,
	txs: null,
});

module.exports = {Account};
