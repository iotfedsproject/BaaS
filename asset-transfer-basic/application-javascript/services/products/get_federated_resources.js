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


const getFederatedResources = async(req, res, next) => {

    // let fed_id = req.query.fed_id;
    // let user_id = req.query.user_id;

    const {fed_id, user_id, Hr, Lr, Fr, price_max, price_min, rep_max, rep_min}= req.body;
    

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
        const contract = network.getContract(chaincodeName);
        console.log (user_id)


        console.log('\n--> Submit Transaction: GetFederatedResources, gets all the resources in the federated marketplace');
        // let result = await contract.submitTransaction('CheckAccess', product_id, tx_id);
        let result = await contract.evaluateTransaction('GetFederatedResources', fed_id, Lr, Hr, Fr);
        console.log('*** Result: committed', result, '***');
        //console.log(result.toString())
        result = JSON.parse(result);
        //console.log(result)
        let resourcesRetrieved = [];
        if (result.length>0){  

            if ((price_max!='' && price_min!='' && price_max < price_min) || (rep_max!='' && rep_min!='' && rep_max < rep_min)){
        
            throw new Error ("Minimum price or reputation cannot be bigger than the maximum price or reputation");
            }
        
            for (let i=0; i<result.length; i++){
        
            let flag=0;
                if (price_min!=''){
                if (result[i].Price>=price_min){
                    flag=1;
                }else{
                    flag=0;
                }
                }else{
                    flag=1;
                }
                if (flag!=0){
                    if (price_max!=''){
                        if (result[i].Price<=price_max){
                            flag=1;
                        }else{
                            flag=0;
                        }
                    }else{
                        flag=1;
                    }
                }
                if (flag!=0){
                    if (rep_min!=''){
                        if (result[i].overallReputation>=rep_min){
                            flag=1;
                        }else{
                            flag=0;
                        }
                    }else{
                        flag=1;
                    }
                }
                if (flag!=0){
                    if (rep_max!=''){
                        if (result[i].overallReputation<=rep_max){
                            flag=1;
                        }else{
                            flag=0;
                        }
                    }else{
                        flag=1;
                    }
                }
                if (flag==1){
                    resourcesRetrieved.push(result[i]);
                }
        
            }
        }
        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        //let filteredResources = resourcesRetrieved.filter((resource)=>(resource.Price >= price_min && resource.Price <= price_max) && (resource.overallReputation >= rep_min && resource.overallReputation <= rep_max));
        if (!resourcesRetrieved || resourcesRetrieved.length === 0){
    
          resourcesRetrieved = [];
          // throw new Error("No resources found ...")
        }

        res.status(200).send({"Resources": resourcesRetrieved});

    //finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(err) {

        console.log(`Get federated resources failed with error: `+err);

        res.status(403).send({error: 'Get federated resources failed ...'+err})
        // .responses[0].response.message
    }

}
module.exports = getFederatedResources;
