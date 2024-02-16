const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'products';
const chaincodeName2 = 'token_erc20';
const chaincodeName3 = 'basic';
const chaincodeName4 = 'federationsmanage';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const createProduct = async(req, res, next) => {

    let product_id = req.body.product_id;
    let resource_ids = JSON.stringify(req.body.resource_ids);
    let product_details = JSON.stringify(req.body.product_details);
    let seller_id = req.body.seller_id;
    let fedMarketplace_id = req.body.fedMarketplace_id;

    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        // setup the wallet to hold the credentials of the application user
        // const wallet = await buildWallet(Wallets, walletPath);
        // const wallet = await Wallets.newFileSystemWallet(path.join(walletPath, 'wallet'));
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // await wallet.get(user_id);


        // Create a new gateway instance for interacting with the fabric network.
        // In a real application this would be done as the backend server session is setup for
        // a user that has been verified.
        const gateway = new Gateway();

        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            identity: seller_id, // not sure about this one
            // identity: user_id_id,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        const contract4 = network.getContract(chaincodeName4);
        await contract4.evaluateTransaction('FedMemberExists', seller_id,fedMarketplace_id);
        
        //PRODUCT WITH PRICE
        // console.log('\n--> Submit Transaction: CreateProduct, creates new product with ID, price, resource ids and product details');
        // let result = await contract.submitTransaction('CreateProduct', product_id, price, resource_ids, product_details, fedMarketplace_id, seller_id);
        
        //PRODUCT WITHOUT PRICE
        console.log('\n--> Submit Transaction: CreateProduct, creates new product with ID, resource ids and product details');
        let result = await contract.submitTransaction('CreateProduct', product_id, resource_ids, product_details, fedMarketplace_id, seller_id);
        console.log('*** Result: committed', result, '***');

        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        
        //PRODUCT WITH PRICE
        //let fees=Math.trunc(price*0.02);

        //PRODUCT WITHOUT PRICE
        let fees=5;
        let clientID= await getRecipientID('iotFedsAdmin');
        const contract2 = network.getContract(chaincodeName2);
            
        console.log('\n--> Submit Transaction: Transfer, Transfer tokens to seller');
        let result2 = await contract2.submitTransaction('Transfer', clientID, fees);
        console.log('*** Result: committed', result2, '***');

        const contract3 = network.getContract(chaincodeName3);
        let result4=-(parseInt(fees));
        await contract3.submitTransaction('UpdateUserBalance', seller_id, result4);

        res.status(200).send(JSON.parse(result));

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('Product creation failed with error: '+error);

        res.status(403).send({error:'Product creation failed: '+error})


    }

}

async function getRecipientID(seller){
    const ccp = buildCCPOrg1();

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    await wallet.get(seller);

    const gateway = new Gateway();

    console.log("Trying to connect to gateway...")
    await gateway.connect(ccp, {
        wallet,
         identity: seller,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });
    console.log("Connected!!!")

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName2);
        
    console.log('\n--> Submit Transaction: ClientAccountID');
    let clientID = await contract.evaluateTransaction('ClientAccountID');
    console.log('*** Result: committed', clientID, '***');

    gateway.disconnect();
    return clientID;
};

module.exports = createProduct;
