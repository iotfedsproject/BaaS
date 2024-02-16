const { Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
// const insertlog = require('../../MongoDB/controllers/insertlog');

const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const chaincodeName2 = 'products';
const mspOrg1 = 'iotfedsMSP';


const secret = process.env.HASH_SECRET;
console.log(secret)
console.log(typeof secret);


const walletPath = path.join(__dirname,'../..','wallet');


// const {ccps, msps, caClients, cas} = require('../../helpers/initalization');
function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const deleteUser = async(req, res, next) => {

    //should be given by request or taken from a token (e.g. jwt)
    const id = req.body.user_id;

    try {

			const ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			const caClient = buildCAClient(FabricCAServices, ccp, 'ca.iotfeds.iti.gr');

			// setup the wallet to hold the credentials of the application user
			// const wallet = await buildWallet(Wallets, walletPath);
			// const wallet = await Wallets.newFileSystemWallet(path.join(walletPath, 'wallet'));
			const wallet = await Wallets.newFileSystemWallet(walletPath);


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
            identity: 'iotFedsAdmin',
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        console.log("Connected!!!")

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        const contract2 = network.getContract(chaincodeName2);
        // existingTokens = await contract2.submitTransaction('AssetExists', id);
        // if (existingTokens){
        //     console.log(`*** existingTokens: ${prettyJSONString(existingTokens.toString())}`);
        //   throw new Error(`Tokens exist for user ${id}.`);
        // }

		console.log('\n--> Submit Transaction: DeleteUser, deletes user with ID');
		let result = await contract.submitTransaction('DeleteUser', id);

				//console.log(`*** Result: committed: ${JSON.stringify(result)}`);
        if (result==0){
            res.status(200).send({message: "OK!"});
        }else{
            result=JSON.parse(result)
            let assocPlatf=Object.values(result.AssociatedPlatforms);
           
            let resources=[]
            for (var k=0;k<assocPlatf.length;k++){
                assocPlatf[k].forEach((index)=>{
                    resources.push(index)
                })
            }     
            console.log("Resources: ",resources)
            let deleteFlag=1;
            let tbp= Date.now();
            for (var i=0;i<resources.length;i++){
                console.log('\n--> Evaluate Transaction: GetResource, get resource info');
                resources[i] = await contract2.evaluateTransaction('GetResource', resources[i]);
                resources[i]=JSON.parse(resources[i]);
                console.log("fdfs: ",resources[i].fed_id.length)

                if (resources[i].fed_id.length>0 && tbp<resources[i].Hr){
                    deleteFlag=0;
                }
            }
            console.log("deleteFlag: ",deleteFlag)

            if (deleteFlag==0){
                throw new Error(`User ${id} has resources on Federation marketplace.`);
            }else{
                for (var i=0;i<resources.length;i++){
                    await contract2.evaluateTransaction('UpdateResource2', resources[i]);
                }
                if (result.ActiveProducts.length>0){
                    for (var i=0;i<result.ActiveProducts.length;i++){
                      await contract2.submitTransaction('DeleteProduct', result.ActiveProducts[i],id);
                    }
                }
                console.log('\n--> Submit Transaction: DeleteUser2, deletes user with ID');
                await contract.submitTransaction('DeleteUser2', id);
                res.status(200).send({message: "OK!"});
            }
        }
 
                // result.forEach(async (index)=>{
                // console.log("ID: ",index)
                //     });
				// if (`${result}` !== '') {
				// 	console.log(`*** Result: ${prettyJSONString(result.toString())}`);
				// }
        // var fs = require('fs');
        // var filePath = `./wallet/${id}.id`; 
        // fs.unlinkSync(filePath);

        //res.status(200).send(JSON.parse(result));
				//res.status(200).send(resources);

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(error) {

        console.log('User deletion failed with error: '+error);

        res.status(400).send({error: 'Deletion failed: '+error})


    }

}
module.exports = deleteUser;
