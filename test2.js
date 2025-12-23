const bitcore = require('bitcore-lib');
const axios = require('axios');

// CONFIGURATION
const WIF_PRIVATE_KEY = 'your_private_key_here'; // Wallet Import Format
const RECIPIENT_ADDRESS = 'bc1q...';             // Target address
const AMOUNT_SATS = 10000;                        // Amount in Satoshis
const FEE_SATS = 1000;                            // Manual fee (or use an estimator)
const NETWORK = bitcore.Networks.livenet;         // Use .testnet for testing!

async function sendSegwitTransaction() {
    try {
        // 1. Derive Private Key and Bech32 (Native SegWit) Address
        const privateKey = new bitcore.PrivateKey(WIF_PRIVATE_KEY);
        const publicKey = privateKey.toPublicKey();
        
        // Create Bech32 address (starts with bc1)
        const address = bitcore.Address.fromPublicKey(publicKey, NETWORK, bitcore.Address.PayToWitnessPublicKeyHash);
        const addressStr = address.toString();
        console.log(`Sending from: ${addressStr}`);

        // 2. Gather UTXOs from Blockstream API
        const utxoUrl = `https://blockstream.info/api/address/${addressStr}/utxo`;
        const { data: utxosData } = await axios.get(utxoUrl);

        if (utxosData.length === 0) {
            throw new Error("No UTXOs found for this address.");
        }

        // Map API response to bitcore UTXO format
        const utxos = utxosData.map(u => ({
            txId: u.txid,
            outputIndex: u.vout,
            address: addressStr,
            script: bitcore.Script.buildWitnessV0Out(address).toHex(), // P2WPKH script
            satoshis: u.value
        }));

        // 3. Create and Build the Transaction
        const tx = new bitcore.Transaction()
            .from(utxos)
            .to(RECIPIENT_ADDRESS, AMOUNT_SATS)
            .change(addressStr)  // Remaining funds sent back to yourself
            .fee(FEE_SATS)
            .sign(privateKey);

        const rawTx = tx.serialize();
        console.log("Transaction Serialized Successfully.");

        // 4. Broadcast to Blockstream
        const broadcastUrl = 'https://blockstream.info/api/tx';
        const response = await axios.post(broadcastUrl, rawTx);
        
        console.log(`Transaction Sent! TXID: ${response.data}`);
        return response.data;

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

sendSegwitTransaction();
