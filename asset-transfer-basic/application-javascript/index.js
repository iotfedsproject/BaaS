//const { application } = require('express');
const express = require('express');
const app = express();
const cors = require('cors');
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
const mongoUtils = require('./MongoDB/mongoUtils');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const fedChaincodeName = 'federationsmanage';
const prodChaincodeName = 'products';
const tokenChaincodeName='token_erc20';
const mspOrg1 = 'iotfedsMSP';
const iotFedsAdmin = 'iotFedsAdmin';
const walletPath = path.join(__dirname, 'wallet');

const testPaypal = require('./services/user/test_paypal');
const withdrawPaypal = require('./services/user/withdraw_to_paypal');
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

const joinFedRequest = require('./services/federation/join_fed_request');
const addFedMemberRequest = require('./services/federation/add_fed_member_request');
const removeFedMemberRequest = require('./services/federation/remove_fed_member_request');
const updateFedRulesRequest = require('./services/federation/update_fed_rules_request');
const getVotingDescription = require('./services/federation/get_voting_description');
const registerVote = require('./services/voting/vote');

const createProduct = require('./services/products/create_Product');
const addResourceToFed = require('./services/products/add_resource_fed');
const rateProduct = require('./services/products/rate_product');
const mintBurnTokens = require('./services/products/mint_burn_tokens');
const balanceTokens = require('./services/products/user_token_balance');
const transferTokens = require('./services/products/transfer_tokens');
const UpdateAllReputations = require('./services/products/update_all_reputations');
const updateResourceQos = require('./services/products/update_resource_qos');
const getProductInfo = require('./services/products/get_product_info');
const checkAccess = require('./services/products/check_access');
const decreaseAccess = require('./services/products/decrease_access');
const getAllProductInfo = require('./services/products/get_all_product_info');
const deleteProduct = require('./services/products/delete_product');
const getAllResourceInfo = require('./services/products/get_all_resource_info');
const getAllExchangableTokens = require('./services/products/get_all_exchangable_tokens');
const getResourceInfo = require('./services/products/get_resource_info');
const changePrice = require('./services/products/change_price');
const buyProduct = require('./services/products/buy_product');
const getReceipt = require('./services/products/get_receipt');
const getUserTokens = require('./services/products/get_user_tokens');
const putTokenForExchange = require('./services/products/put_token_for_exchange');
const removeTokenFromExchange = require('./services/products/remove_token_from_exchange');
const exchangeTokens = require('./services/products/exchange_tokens');

const searchProducts = require('./services/products/search_products');
const getFederatedProducts = require('./services/products/get_federated_products');
const getFederatedResources = require('./services/products/get_federated_resources');
const calcProductPrice = require('./services/products/calc_product_price');
const getGlobalProducts = require('./services/products/get_global_products');

const searchResources = require('./services/products/search_resources');

const retrieveReceiptsSeller = require('./services/logging/Receipts/get_receipts_seller.js');
const retrieveReceiptsBuyer = require('./services/logging/Receipts/get_receipts_buyer.js');
const retrieveReceiptsAdmin = require('./services/logging/Receipts/get_receipts_admin.js');
const retrieveAccessLogs = require('./services/logging/AccessLogs/get_access_logs.js');
const verifyReceipt = require('./services/logging/Receipts/verify_receipt');
const verifyAccessLog = require('./services/logging/AccessLogs/verify_access_log')

//  dummy service
const createVoting =require('./services/voting/createVoting');

const unsubscribeProduct =require('./services/products/unsubscribe_product');


// const {keyverification} = require('./services/verifykey/keyverification');


//configure cors for allowing specific origins
// const corsOptions = {
//   origin: ['http://myapi.com']
//   }


app.use(bodyparser.json());

// async function initApp() {

//   const ccp = buildCCPOrg1();
//   const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

//   // setup the wallet to hold the credentials of the application user
//   const wallet = await buildWallet(Wallets, walletPath);
  //register an admin for each org (should be done once, only in the beginning of the app for each org (i guess))
  // regadmin1();
  // await enrollAdmin(caClient, wallet, mspOrg1);


  // this will help us in debugging, only registerAndEnrollUser should be in deployment
  // function checkFileExist(urlToFile) {
  //   let xhr = new XMLHttpRequest();
  //   xhr.open('HEAD', urlToFile, false);
  //   xhr.send();

  //   if (xhr.status == "404") {
  //       return false;
  //   } else {
  //       return true;
  //   }
  // }

// Calling function
// set the path to check
  // let userExists = checkFileExist(walletPath + '/' + iotFedsAdmin + '.id');
  // if (!userExists) {
    // await registerAndEnrollUser(caClient, wallet, mspOrg1, iotFedsAdmin, 'ioTFeds.department1');
  // }

  // const gateway = new Gateway();

  // try {

  //   await gateway.connect(ccp, {
  //     wallet,
  //     identity: iotFedsAdmin,
  //     discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
  //   });

    // Build a network instance based on the channel where the smart contract is deployed
    // const network = await gateway.getNetwork(channelName);

    // // Get the contract from the network.
    // const contract = network.getContract(chaincodeName);

    // // Get the contracts
    // const fedcontract = network.getContract(fedChaincodeName);
    // const votecontract = network.getContract(fedChaincodeName, "Voting");
    // const prodcontract = network.getContract(prodChaincodeName);
    // const marketcontract = network.getContract(prodChaincodeName, "Marketplace");
    // const tokencontract = network.getContract(tokenChaincodeName);

    // // Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
    // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of users on the ledger');
    // await contract.submitTransaction('InitLedger');
    // console.log('*** Result: committed');

    // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of federations on the ledger');
    // await fedcontract.submitTransaction('InitLedger');
    // console.log('*** Result: committed');

    // // Register initialized users on the wallet
    // console.log('\n--> Submit Transaction: GetAllUsers, function gets all users from ledger');
    // let initUsers = await contract.submitTransaction('GetAllUsers');
    // initUsers = JSON.parse(initUsers);

    // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of products on the ledger');
    // await prodcontract .submitTransaction('InitLedger');
    // console.log('*** Result: committed');

    // console.log('\n--> Submit Transaction: Initialize, function creates token-erc20 on the ledger');
    // await tokencontract.submitTransaction('Initialize','FedCoin','FC','2');
    // console.log('*** Result: committed');

    // for (let user of initUsers) {
    //   await registerAndEnrollUser(caClient, wallet, mspOrg1, user.ID, 'user');
    //   // console.log(`User ${user.ID} enrolled`);
    // }

    // console.log('\n--> Submit Transaction: Mint, mint tokens');
    // let result = await tokencontract.submitTransaction('Mint', '100000');
    // console.log('*** Result: committed', result, '***');

    // // for dev, runs every minute
    // cron.schedule('* * * * *', async function () {
    //   console.log('Checking for expired votings');
    //   let terminatedVotings = await votecontract.submitTransaction('CheckAllVotingsExpiration');
    //   console.log(`${prettyJSONString(terminatedVotings.toString())}`);
    // });

//     // for deployment, runs everyday at 00:01
//     cron.schedule('0 1 * * *', async function () {
//       console.log('Checking for expired votings');
//       let terminatedVotings = await votecontract.submitTransaction('CheckAllVotingsExpiration');
//       console.log(`${prettyJSONString(terminatedVotings.toString())}`);
//     }, {
//      scheduled: true,
//      timezone: "Europe/Athens"
//     });

//   }
//   catch (error) {
//   	console.error(`******** FAILED to run the application: ${error}`);
//   }



//   finally {
//     // Disconnect from the gateway when the application is closing
//     // This will close all connections to the network
//     gateway.disconnect();
//   }
// }

// initApp();


// app.use(cors(corsOptions));

//use API key verification as middleware
// app.use(keyverification);

app.post('/baas/user/test_paypal', testPaypal);

app.post('/baas/user/withdraw_to_paypal', withdrawPaypal);
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

app.post ('/baas/federation/join_request', joinFedRequest);

app.post ('/baas/federation/new_member_request', addFedMemberRequest);

app.post('/baas/federation/remove_member_request', removeFedMemberRequest);

app.post('/baas/federation/update_fed_rules_request', updateFedRulesRequest);

app.get('/baas/federation/get_voting_description', getVotingDescription);


// voting endpoints

app.post('/baas/voting/vote', registerVote);


// Product related endpoints

app.post('/baas/products/create_product', createProduct);

app.patch('/baas/products/add_resource_fed', addResourceToFed);

app.get('/baas/products/get_product_info', getProductInfo);

app.get('/baas/products/get_all_product_info',getAllProductInfo)

app.get('/baas/products/get_resource_info', getResourceInfo);

app.get('/baas/products/get_all_resource_info',getAllResourceInfo)

app.delete('/baas/products/delete_product', deleteProduct)

app.patch('/baas/products/change_price', changePrice)

app.patch('/baas/products/rate_product', rateProduct)
app.patch('/baas/products/mint_burn_tokens', mintBurnTokens)
app.get('/baas/products/user_token_balance', balanceTokens)
app.patch('/baas/products/transfer_tokens', transferTokens)

app.patch('/baas/products/update_all_reputations', UpdateAllReputations)

app.patch('/baas/products/update_resource_qos', updateResourceQos)

app.post('/baas/products/buy_product', buyProduct);

app.post('/baas/products/check_access', checkAccess);

app.post('/baas/products/decrease_access', decreaseAccess)

app.get('/baas/products/get_receipt', getReceipt);

app.get('/baas/products/get_user_tokens', getUserTokens)

app.post('/baas/products/search_products', searchProducts)

app.get('/baas/products/get_federated_products', getFederatedProducts)

app.get('/baas/products/get_federated_resources', getFederatedResources)

app.post('/baas/products/calc_product_price', calcProductPrice)

app.get('/baas/products/get_global_products', getGlobalProducts)

app.get('/baas/products/get_all_exchangable_tokens', getAllExchangableTokens)

app.post('/baas/products/search_resources', searchResources);

app.patch('/baas/products/put_token_for_exchange', putTokenForExchange);

app.patch('/baas/products/remove_token_from_exchange', removeTokenFromExchange);

app.patch('/baas/products/exchange_tokens', exchangeTokens);

// logging and auditing related endpoints

app.post('/baas/auditing/get_receipts_seller', retrieveReceiptsSeller)

app.post('/baas/auditing/get_receipts_buyer', retrieveReceiptsBuyer)

app.post('/baas/auditing/get_receipts_admin', retrieveReceiptsAdmin)

app.post('/baas/auditing/get_logs', retrieveAccessLogs)

app.post('/baas/auditing/verify_receipt', verifyReceipt)

app.post('/baas/auditing/verify_access_log', verifyAccessLog)

// dummy endpoint
app.post('/baas/federation/createvoting', createVoting);

app.post('/baas/products/unsubscribe_product', unsubscribeProduct);

app.listen(domain.SERVER_PORT, () => {
    console.log(`Example app listening at http://localhost:${domain.SERVER_PORT}`)
  });

  mongoUtils.connect(domain.MONGODB_URL);
