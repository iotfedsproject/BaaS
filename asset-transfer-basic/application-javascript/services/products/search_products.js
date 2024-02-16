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

const sortProducts = require('./weighted-sorting.js');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

function groupBy(array, f) {
    let groups = {};
    array.forEach(function (o) {
      var group = JSON.stringify(f(o));
      groups[group] = groups[group] || [];
      groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
      return groups[group];
    })
}

const searchProducts = async(req, res, next) => {

    let products = req.body.products;
    let price_min = req.body.price_min;
    let price_max = req.body.price_max;
    let rep_min = req.body.rep_min;
    let rep_max = req.body.rep_max;
    let user_id = req.body.user_id;



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
        const contract2 = network.getContract(chaincodeName);

        console.log (user_id)

        if ((price_max!='' && price_min!='' && price_max < price_min) || (rep_max!='' && rep_min!='' && rep_max < rep_min)){
    
          throw new Error ("Minimum price or reputation cannot be bigger than the maximum price or reputation");
        }
    
        let productsRetrieved = [];
        let retrieved;
    
        for (let i=0; i<products.length; i++){
          retrieved = await contract2.evaluateTransaction('GetAsset2', products[i]);    
          if (retrieved!=0){
            let resources = JSON.parse(retrieved);
            resources=Object.keys(resources.Resource_ids)
      
            for (var j=0;j<resources.length;j++){
                resources[j] = await contract2.evaluateTransaction('GetResource', resources[j]);
                resources[j]=JSON.parse(resources[j]);
            }
            let byParam = groupBy(resources, function (item) {
                return [item.owner];
            });
            let totalPrice=0;
            for (var k=0;k<byParam.length;k++){
              byParam[k].forEach((item,index)=>{
                totalPrice+=Number(item.Price);
              })
            }      
            let flag=0;
            retrieved=JSON.parse(retrieved);
            if (price_min!=''){
              if (totalPrice>=price_min){
                flag=1;
              }else{
                flag=0;
              }
            }else{
                flag=1;
            }
            if (flag!=0){
                if (price_max!=''){
                    if (totalPrice<=price_max){
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
                    if (retrieved.Reputation>=rep_min){
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
                    if (retrieved.Reputation<=rep_max){
                        flag=1;
                    }else{
                        flag=0;
                    }
                }else{
                    flag=1;
                }
            }
            if (flag==1){
              productsRetrieved.push({"FedMarketplace_id":retrieved.FedMarketplace_id,"GlobalMarketplace_id":retrieved.GlobalMarketplace_id,"Product_details":retrieved.Product_details,"Product_id":retrieved.Product_id,"Reputation":retrieved.Reputation,"Resource_ids":retrieved.Resource_ids,"Seller":retrieved.Seller,"docType":retrieved.docType,"subjReputation":retrieved.subjReputation,"transactionCounter":retrieved.transactionCounter,"totalPrice":totalPrice});
            }
          }

        }
    
        if (!productsRetrieved || productsRetrieved.length === 0){
    
          productsRetrieved = [];
    
          // throw new Error("No products found ...")
        }

        if (!productsRetrieved.length !== 0){

            let sortedProducts = sortProducts(productsRetrieved, productsRetrieved.map(product => product.Reputation));
            console.log(sortedProducts)
            res.status(200).send({"Products": sortedProducts});
        }

        else{

            res.status(200).send({"Products": productsRetrieved});
        }

    // finally {
    //     Disconnect from the gateway when the application is closing
    //     This will close all connections to the network
        gateway.disconnect();
    //}

    }

    catch(err) {

        console.log(`Search for products failed with error: `+err);

            res.status(403).send({error: 'Search for products failed ...'+err})
        
    }

}
module.exports = searchProducts;

