import bitcore from "bitcore-lib";

import { cutil } from "@ghasemkiani/base";
import { Obj } from "@ghasemkiani/base";
import { d } from "@ghasemkiani/decimal";
import { Client } from "@ghasemkiani/blockstream-api";
import { HDWallet } from "@ghasemkiani/hdwallet";

const { PrivateKey, PublicKey, Address, Networks, Script } = bitcore;

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
      decimals: 8,
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
      this.network = cutil.isString(bitcoreNetwork)
        ? bitcoreNetwork
        : /test/.test(bitcoreNetwork.name)
          ? "testnet"
          : "mainnet";
    }
  }
  get segwit() {
    if (cutil.na(this._segwit)) {
      this._segwit = cutil.a(this._address)
        ? /^(bc|tb|bcrt)/.test(this._address)
        : true;
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
    return cutil.na(this.key)
      ? null
      : new PrivateKey(this.key, this.bitcoreNetwork).toWIF().toString();
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
      this._pub = new PrivateKey(this.key, this.bitcoreNetwork)
        .toPublicKey()
        .toString();
    }
    return this._pub;
  }
  set pub(pub) {
    this._pub = pub;
  }
  get address() {
    if (cutil.na(this._address)) {
      if (this.pub) {
        this._address = new Address(
          new PublicKey(this.pub),
          this.bitcoreNetwork,
          this.segwit ? Address.PayToWitnessPublicKeyHash : null,
        ).toString();
      }
    }
    return this._address;
  }
  set address(address) {
    this._address = address;
  }
  get client() {
    let { network } = this;
    if (cutil.na(this._client)) {
      this._client = new Client({ network });
    }
    return this._client;
  }
  set client(client) {
    this._client = client;
  }
  async toGetBalance() {
    let { client } = this;
    let address = this.address;
    let balance = await client.toGetAddressBalance(address);
    this.balance = balance;
    return this.balance;
  }
  async toUpdate() {
    await this.toGetBalance();
  }
  async toGetUtxos() {
    let account = this;
    let {address} = account;
    let {client} = account;
    let utxos = await client.toGetUtxos(address);
    return utxos;
  }
  wrapNumber(n) {
    return d(n).mul(10 ** this.decimals).asFixed();
  }
  unwrapNumber(s) {
    return d(s).div(10 ** this.decimals).toNumber();
  }
  async toWrapNumber(n) {
    return this.wrapNumber(n);
  }
  async toUnwrapNumber(s) {
    return this.unwrapNumber(s);
  }
  async toTransfer({
    tos, // [{ address, amount, amount_ }, ...]
    agg = "all", // "all"/"smaller"/"bigger"
    change = null,
  }) {
    let account = this;
    let {segwit} = account;
    let {address} = account;
    let {client} = account;
    let { data: utxosData } = await account.toGetUtxos();
    if (utxosData.length === 0) {
        throw new Error("No UTXOs found for this address.");
    }
    let script = segwit ? Script.buildWitnessV0Out(address).toHex() : Script.buildPublicKeyHashOut(address).toHex();
    let utxos = utxosData.map(u => ({
        txId: u.txid,
        outputIndex: u.vout,
        address: addressStr,
        script,
        satoshis: u.value,
    }));
    let total_$ = d(0);
    for (let to of tos) {
      if (cutil.na(item.amount_)) {
        item.amount_ = account.wrapNumber(item.amount);
      }
      total_$ = total_$.plus(item.amount_);
    }
    let total_ = total_$.asFixed();
    if (agg !== "all") {
      let uu = [];
      let tot_$ = d(0);
      // sort utxos according to agg and select the needed ones
    }
  }
}

export { Account };
