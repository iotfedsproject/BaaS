const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');


const channelName = 'mychannel';
const chaincodeName = 'products';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const unsubscribeProduct = async(req, res, next) => {

    let product_id = req.body.product_id;
    let user_id = req.body.user_id;

    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        await wallet.get(user_id);


        const gateway = new Gateway();

        console.log("Trying to connect to gateway...")
        await gateway.connect(ccp, {
            wallet,
            identity: user_id, // not sure about this one
            // identity: creator_id,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName,);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName, "Marketplace");



        console.log('\n--> Submit Transaction: Unsubscribe unsubscribes user from streaming product');
        let result = await contract.submitTransaction('Unsubscribe', user_id, product_id);
        console.log('*** Result: committed', result, '***');
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);
   
        result = JSON.parse(result);
        console.log(result)

        gateway.disconnect();



        res.status(200).send({ "AccessToken": result});


        
    }

    catch(err) {

        console.log(`Unsubscribing from product ${product_id} failed with error: `+err);
       
        res.status(403).send({error: "Unsubscribing from streaming product failed with error:"+err})
    }

}
module.exports = unsubscribeProduct;
