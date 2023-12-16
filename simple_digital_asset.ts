/* eslint-disable no-console */
/* eslint-disable max-len */

import "dotenv";
import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { stat } from "fs";

const INITIAL_BALANCE = 100_000_000;

// Setup the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Create Alice and Bob accounts
const alice = Account.generate();
const bob = Account.generate();

console.log("=== Addresses ===\n");
console.log(`Alice's address is: ${alice.accountAddress}`);
console.log(`Bob's address is: ${bob.accountAddress}`);

// Fund and create the accounts
await aptos.faucet.fundAccount({
  accountAddress: alice.accountAddress,
  amount: INITIAL_BALANCE,
});
await aptos.faucet.fundAccount({
  accountAddress: bob.accountAddress,
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

  console.log("\n=== Alice Mints 100 digital asset ===\n");

  for (let i = 0; i <= 10; i++) {
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

  // console.log("\n=== Transfer the digital asset to Bob ===\n");

  //   const transferTransaction = await aptos.transferDigitalAssetTransaction({
  //     sender: alice,
  //     digitalAssetAddress: alicesDigitalAsset[0].token_data_id,
  //     recipient: bob.accountAddress,
  //   });
  //   committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: transferTransaction });
  //   pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  //   const alicesDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
  //     ownerAddress: alice.accountAddress,
  //     minimumLedgerVersion: BigInt(pendingTxn.version),
  //   });
  //   console.log(`Alices's digital assets balance: ${alicesDigitalAssetsAfter.length}`);

  //   const bobDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
  //     ownerAddress: bob.accountAddress,
  //     minimumLedgerVersion: BigInt(pendingTxn.version),
  //   });
  //   console.log(`Bob's digital assets balance: ${bobDigitalAssetsAfter.length}`);
};

const burn_nft = async () => {
  console.log("Hello World")
  const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);

  console.log("Time to burn all the NFTs Alice is holding")

  for (let i = 0; i < alicesDigitalAsset.length; i++) {
    let status = await aptos.burnDigitalAssetTransaction({
      creator: alice,
      digitalAssetAddress: alicesDigitalAsset[i].token_data_id,
    })
    console.log(status)
  }
  console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);
}

await mint_nft();
await burn_nft();
