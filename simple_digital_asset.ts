/* eslint-disable no-console */
/* eslint-disable max-len */

import "dotenv";
import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

const INITIAL_BALANCE = 100_000_000;

// Setup the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Create Alice and Bob accounts
const alice = Account.generate();

console.log("=== Addresses ===\n");
console.log(`Alice's address is: ${alice.accountAddress}`);

// Fund and create the accounts
await aptos.faucet.fundAccount({
  accountAddress: alice.accountAddress,
  amount: INITIAL_BALANCE,
});

const collectionName = "Example Collection";
const collectionDescription = "Example description.";
const collectionURI = "aptos.dev";

// Create the collection
const createCollectionTransaction = await aptos.createCollectionTransaction({
  creator: alice,
  description: collectionDescription,
  name: collectionName,
  uri: collectionURI,
  tokensBurnableByCreator: true
});

console.log("\n=== Create the collection ===\n");
let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });

let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

const alicesCollection = await aptos.getCollectionData({
  creatorAddress: alice.accountAddress,
  collectionName,
  minimumLedgerVersion: BigInt(pendingTxn.version),
});
console.log(`Alice's collection: ${JSON.stringify(alicesCollection, null, 4)}`);

const tokenName = "Example Asset";
const tokenDescription = "Example asset description.";
const tokenURI = "aptos.dev/asset";

const mint_nft = async () => {

  console.log("\n=== Alice Mints 10 digital asset ===\n");

  for (let i = 0; i < 10; i++) {
    let mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
      creator: alice,
      collection: collectionName,
      description: tokenDescription,
      name: tokenName + i.toString(),
      uri: tokenURI + '/' + i.toString(),
    });

    committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
    pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
      ownerAddress: alice.accountAddress,
      minimumLedgerVersion: BigInt(pendingTxn.version),
    });
    console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);

    console.log(`Alice's digital asset: ${JSON.stringify(alicesDigitalAsset[0], null, 4)}`);
  }
}

const burn_nft = async () => {
  const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);

  console.log("Time to burn all the NFTs Alice is holding")

  for (let i = 0; i < alicesDigitalAsset.length; i++) {
    let txn = await aptos.burnDigitalAssetTransaction({
      creator: alice,
      digitalAssetAddress: alicesDigitalAsset[i].token_data_id,
    })
    committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: txn });
    pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(pendingTxn);
  }
  const alicesDigitalAssetAfterBurn = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${alicesDigitalAssetAfterBurn.length}`);
}

await mint_nft();
await burn_nft();
