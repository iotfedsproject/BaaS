//const { application } = require('express');

const path = require('path');
const FabricCAServices = require('fabric-ca-client');

const { Gateway, Wallets} = require('fabric-network');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');
var cron = require('node-cron');
// var axios = require('axios').default;

// FOR TESTING
// const prodChaincodeName = 'products';
// const chaincodeName = 'basic';  
const channelName = 'mychannel';
const fedChaincodeName = 'federationsmanage';
const tokenChaincodeName='token_erc20';
const mspOrg1 = 'iotfedsMSP';
const iotFedsAdmin = 'iotFedsAdmin';
const walletPath = path.join(__dirname, 'wallet');

async function  initialization() {

    const ccp = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    await enrollAdmin(caClient, wallet, mspOrg1);

    await registerAndEnrollUser(caClient, wallet, mspOrg1, iotFedsAdmin, 'ioTFeds.department1');

    const gateway = new Gateway();

    // Build a network instance based on the channel where the smart contract is deployed


    try {

        await gateway.connect(ccp, {
          wallet,
          identity: iotFedsAdmin,
          discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        const network = await gateway.getNetwork(channelName);

        // FOR TESTING
        // const contract = network.getContract(chaincodeName);
        // const prodcontract = network.getContract(prodChaincodeName);

        // Get the contracts
        const fedcontract = network.getContract(fedChaincodeName);
        const tokencontract = network.getContract(tokenChaincodeName);
        const votecontract = network.getContract(fedChaincodeName, "Voting");

        // FOR TESTING (init users / federations / products)
        // Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
        // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of users on the ledger');
        // await contract.submitTransaction('InitLedger');
        // console.log('*** Result: committed');

        // Register initialized users on the wallet
        // console.log('\n--> Submit Transaction: GetAllUsers, function gets all users from ledger');
        // let initUsers = await contract.submitTransaction('GetAllUsers');
        // initUsers = JSON.parse(initUsers);

        // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of products on the ledger');
        // await prodcontract .submitTransaction('InitLedger');
        // console.log('*** Result: committed');

        console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of federations on the ledger');
        await fedcontract.submitTransaction('InitLedger');
        console.log('*** Result: committed');
        
        console.log('\n--> Submit Transaction: Initialize, function creates token-erc20 on the ledger');
        await tokencontract.submitTransaction('Initialize','FedCoin','FC','2');
        console.log('*** Result: committed');


        console.log('\n--> Submit Transaction: Mint, mint tokens');
        let result = await tokencontract.submitTransaction('Mint', '100000');
        console.log('*** Result: committed', result, '***');

        // FOR TESTING 
        // for (let user of initUsers) {
        //     await registerAndEnrollUser(caClient, wallet, mspOrg1, user.ID, 'user');
        //     // console.log(`User ${user.ID} enrolled`);
        //   }

          cron.schedule('0 1 * * *', async function () { //every day for production
          // cron.schedule('*/3 * * * *', async function () { //every 5min for debug
            console.log('Checking for expired votings');
            let terminatedVotings = await votecontract.submitTransaction('CheckAllVotingsExpiration');
            let expiredVotings = JSON.parse(terminatedVotings);
            for (const votingResult of expiredVotings) {

              let IDvoting = votingResult[0].ID;
              let url = `https://symbiote-core.iotfeds.intracom-telecom.com/administration/generic/result?votingId=${IDvoting}&status=${votingResult[1]}`;

              var myHeaders = new Headers();
              myHeaders.append("Content-Type", "application/json");

              var raw = "";

              var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
              };

              fetch(url, requestOptions)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log('error', error));

            }
            console.log(`${prettyJSONString(terminatedVotings.toString())}`);
          }, {
           scheduled: true,
           timezone: "Europe/Athens"
          });

    }
    catch(err){
        console.log(err)
    }
    finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
      }

}

initialization();
