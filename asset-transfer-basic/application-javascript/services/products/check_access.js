const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');
const insertLog = require('../../MongoDB/controllers/insertLog.js');
const deleteToken = require('./check_delete_token.js')

const channelName = 'mychannel';
const chaincodeName = 'products';
const mspOrg1 = 'iotfedsMSP';

const walletPath = path.join(__dirname,'../..','wallet');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const checkAccess = async(req, res, next) => {

    let product_id = req.body.product_id;
    let user_id = req.body.user_id;
    let data_from = req.body.data_from;
    let data_until = req.body.data_until;
    let req_observations = req.body.req_observations;

    

    try {

        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

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
        console.log (user_id)


        console.log('\n--> Submit Transaction:CheckAccess, checks access rights for specific product and user');
        // let result = await contract.submitTransaction('CheckAccess', product_id, tx_id);
        let result = await contract.submitTransaction('CheckAccess', product_id, user_id, data_from, data_until, req_observations);
        console.log('*** Result: committed', result, '***');

        console.log(`*** Result: ${prettyJSONString(result.toString())}`);
   
        result = JSON.parse(result);
        console.log(result)
        console.log(result.Transaction)

        gateway.disconnect();

        await insertLog((result.Transaction));

        res.status(200).send({ "AccessToken": result.AccessToken});


        
    }

    catch(err) {

        console.log(`Check access for product ${product_id} failed with error: `+err);
        console.log(err.toString())

        // in case token hasn't been deleted, delete it now
        if (err.toString().search("You no longer have access to this product.") != -1){

            console.log(`Deleting invalid token for product ${product_id} of user ${user_id}...`);
            
            try {
                deleteToken(user_id, product_id);
                console.log('*** DeleteToken successfully run');
            } catch (error) {
                console.error('Error running DeleteToken:', error);
            }
        }
       

        res.status(403).send({error: "Check access failed with error:"+err})
    }

}
module.exports = checkAccess;