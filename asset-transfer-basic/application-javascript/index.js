//const { application } = require('express');
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs')
const bodyparser = require("body-parser");
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const domain = require('./config');
// const mongodb = require('./MongoDB/db')

var cron = require('node-cron');

const { Gateway, Wallets} = require('fabric-network');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const fedChaincodeName = 'federationsmanage';
const mspOrg1 = 'iotfedsMSP';
const iotFedsAdmin = 'iotFedsAdmin';
const walletPath = path.join(__dirname, 'wallet');

const registerUserToBc = require('./services/user/register_user');
const getUserInfo = require('./services/user/get_user_info');
const getAllUserInfo = require('./services/user/get_all_user_info');
const updateUserBalance = require('./services/user/update_user_balance');
const registerPlatform = require('./services/user/register_platform');
const removePlatform = require('./services/user/remove_platform');
const registerDevice = require('./services/user/register_device');
const removeDevice = require('./services/user/remove_device');
const removePlatformResources = require('./services/user/remove_platform_resources');
const deleteUser = require('./services/user/delete_user');

const registerFedToBc = require('./services/federation/register_fed');
const getFedInfo = require('./services/federation/get_fed_info');
const getAllFedInfo = require('./services/federation/get_all_fed_info');
const deleteFed = require('./services/federation/delete_fed');
const leaveFed = require('./services/federation/leave_fed');
const addFedMemberRequest = require('./services/federation/add_fed_member_request');
const removeFedMemberRequest = require('./services/federation/remove_fed_member_request');
const updateFedRulesRequest = require('./services/federation/update_fed_rules_request');
const getVotingDescription = require('./services/federation/get_voting_description');

const registerVote = require('./services/voting/vote');

//  dummy service
const createVoting =require('./services/voting/createVoting');



// const {keyverification} = require('./services/verifykey/keyverification');


//configure cors for allowing specific origins
const corsOptions = {
  origin: ['http://localhost:3000']
  }


app.use(bodyparser.json());

async function initApp() {

  const ccp = buildCCPOrg1();
  const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

  // setup the wallet to hold the credentials of the application user
  const wallet = await buildWallet(Wallets, walletPath);
  //register an admin for each org (should be done once, only in the beginning of the app for each org (i guess))
  // regadmin1();
  await enrollAdmin(caClient, wallet, mspOrg1);


  // this will help us in debugging, only registerAndEnrollUser should be in deployment
  function checkFileExist(urlToFile) {
    let xhr = new XMLHttpRequest();
    xhr.open('HEAD', urlToFile, false);
    xhr.send();

    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
  }

// Calling function
// set the path to check
  // let userExists = checkFileExist(walletPath + '/' + iotFedsAdmin + '.id');
  // if (!userExists) {
    await registerAndEnrollUser(caClient, wallet, mspOrg1, iotFedsAdmin, 'ioTFeds.department1');
  // }

  const gateway = new Gateway();

  try {

    await gateway.connect(ccp, {
      wallet,
      identity: iotFedsAdmin,
      discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    // Get the federations contract
    const fedcontract = network.getContract(fedChaincodeName);
    const votecontract = network.getContract(fedChaincodeName, "Voting");

    // Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of users on the ledger');
    await contract.submitTransaction('InitLedger');
    console.log('*** Result: committed');

    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of federations on the ledger');
    await fedcontract.submitTransaction('InitLedger');
    console.log('*** Result: committed');

    // Register initialized users on the wallet
    console.log('\n--> Submit Transaction: GetAllUsers, function gets all users from ledger');
    let initUsers = await contract.submitTransaction('GetAllUsers');
    initUsers = JSON.parse(initUsers);
    
    for (let user of initUsers) {
      await registerAndEnrollUser(caClient, wallet, mspOrg1, user.ID, 'user');
      // console.log(`User ${user.ID} enrolled`);
    }

    // // for dev, runs every minute
    // cron.schedule('* * * * *', async function () {
    //   console.log('Checking for expired votings');
    //   let terminatedVotings = await votecontract.submitTransaction('CheckAllVotingsExpiration');
    //   console.log(`${prettyJSONString(terminatedVotings.toString())}`);
    // });

    // for deployment, runs everyday at 00:01
    cron.schedule('0 1 * * *', async function () {
      console.log('Checking for expired votings');
      let terminatedVotings = await votecontract.submitTransaction('CheckAllVotingsExpiration');
      console.log(`${prettyJSONString(terminatedVotings.toString())}`);
    }, {
     scheduled: true,
     timezone: "Europe/Athens"
    });

  }
  catch (error) {
  	console.error(`******** FAILED to run the application: ${error}`);
  }



  finally {
    // Disconnect from the gateway when the application is closing
    // This will close all connections to the network
    gateway.disconnect();
  }
}

initApp();


// app.use(cors(corsOptions));

//use API key verification as middleware
// app.use(keyverification);

//endpoint for registartion of a user
app.post('/baas/user/register_user', registerUserToBc);

app.get('/baas/user/get_user_info', getUserInfo);

app.get('/baas/user/get_all_user_info', getAllUserInfo);
//
app.patch('/baas/user/update_user_balance', updateUserBalance);
//
app.post('/baas/user/register_platform', registerPlatform);
//
app.delete('/baas/user/remove_platform', removePlatform);
//
app.post('/baas/user/register_device', registerDevice);
//
app.delete('/baas/user/remove_device', removeDevice);
//
app.delete('/baas/user/remove_platform_resources', removePlatformResources);
//
app.delete('/baas/user/delete_user', deleteUser);


// Federation related endpoints

app.post('/baas/federation/register_fed', registerFedToBc);

app.get('/baas/federation/get_fed_info', getFedInfo);

app.get('/baas/federation/get_all_fed_info', getAllFedInfo);

app.patch('/baas/federation/leave_fed', leaveFed);

app.delete('/baas/federation/delete_fed', deleteFed);

app.post ('/baas/federation/new_member_request', addFedMemberRequest);

app.post('/baas/federation/remove_member_request', removeFedMemberRequest);

app.post('/baas/federation/update_fed_rules_request', updateFedRulesRequest);

app.get('/baas/federation/get_voting_description', getVotingDescription);


// voting endpoints

app.post('/baas/voting/vote', registerVote);


// dummy endpoint
app.post('/baas/federation/createvoting', createVoting);





app.listen(domain.SERVER_PORT, () => {
    console.log(`Example app listening at http://localhost:${domain.SERVER_PORT}`)
  })

// mongodb.connect(domain.MONGODB_URL);
