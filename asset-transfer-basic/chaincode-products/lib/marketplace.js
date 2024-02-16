/*
* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
var crypto = require('crypto');
const Products = require('./products.js');


// Custom Error for when user has already bought a product
function throwBoughtProductError(){

  throw{

    name: 'BoughtProductError',
    message: 'You already own this product. Please use your remaining time/number of access.'
  };
}


class Marketplace extends Contract {

  constructor(){super();};

  // BuyProduct lets users buy a product if they have the necessary balance of coins, creates the access token for the specific product and returns the transaction receipt.
  // Parameter streaming: If true, then the access is based on time contraints.
  // if false, then access is based on access times.
  async BuyProduct (ctx, product_id, buyer, seller, access, streaming, marketplace, lower_threshold, upper_threshold, frequency){

    // let currentUserInvoke = await ctx.stub.invokeChaincode('basic', ['ReadUser', buyer], 'mychannel'); //invoke func from another CC
    // let currentUser = currentUserInvoke.payload.toString('utf8'); //read payload response and convert to string
    // currentUser = JSON.parse(currentUser);

    // let currentProduct = await new Products().GetAsset(ctx, product_id);
    // currentProduct = JSON.parse(currentProduct);

    // let seller = currentProduct.Seller;



    if (seller == buyer){

      throw new Error ("You can't buy your own product");

    }

    // let balance = currentUser.Balance;

    // if (currentUser.Balance < currentProduct.Price){

    //   throw new Error("You don't have enough FedCoins to buy this product.");
    // }

    let token = await this.CreateAccessToken(ctx, buyer, product_id, access, streaming, marketplace, lower_threshold, upper_threshold, frequency);


    // TODO: Increment transactionCOunter in product and its Resources
    let productIncrement = await new Products().incrementTransaction(ctx, product_id);

    // TODO: Implement the transfer of FedCoins from one account to the other
    // Could be done directly here or from the SC responsible for the tokenization
    // .....
    // '''''


    let tx_id = ctx.stub.getTxID();
    let timestamp = new Date().toUTCString();  // check date.parse for manipulating the date object


    let transaction = {

      TransactionID: tx_id,
      Buyer: buyer,
      Seller: seller,
      ProductID: product_id,
      DateBought: timestamp// might need to change or split it to date and time


    };

    let transaction_string = JSON.stringify(transaction);

    var hash = crypto.createHash('sha512');
    let data_hash = hash.update(transaction_string, 'utf-8');
    let tx_hash= data_hash.digest('hex');

    // TODO: Maybe only save a hash of the transaction, or an id, or the date
    await ctx.stub.putState(tx_id,Buffer.from(stringify((tx_hash))));
    await ctx.stub.putState(buyer, Buffer.from(stringify((token))));

    return [transaction_string, JSON.stringify(token)];

  }

  // CreateAccessToken is responsible for creating the token upon buying a product
  async CreateAccessToken(ctx, buyer, product_id, access, streaming, marketplace, lower_threshold, upper_threshold, frequency){

      let token;

      let dataFrom = new Date(lower_threshold);
      let dataUpTo = new Date(upper_threshold);


        // If user has already bought some product(s) once in the past, then it just adds another token to the user,
        try{
          let currentToken = await new Products().GetAsset(ctx, buyer);


          currentToken = JSON.parse(currentToken);

          if (currentToken.hasOwnProperty(product_id)){

            throwBoughtProductError();
          }

          // check if access is based on time constraints or not (number of accesses)
          if (JSON.parse(streaming) == true){

            let date = new Date();

            date.setDate(date.getDate() + JSON.parse(access));
            let copyDate = new Date(date);

            currentToken[product_id] = {

              AccessPeriod: date.toUTCString(),
              userHasRated: false,
              toBeExchanged: false,
              inUse: false,
              Marketplace: marketplace,
              Frequency: frequency,
              DataAvailableFrom: new Date(), //in streaming the lower bound is equal to the time of transaction
              DataAvailableUntil: date, //in streaming the upper bound is equal to the access period
              ValidUntil: copyDate // valid time for token.. 30 days default

            };
          }

          else {

            let validDate = new Date();

            // past thresholds
            if (dataUpTo < validDate){

              currentToken[product_id] = {

                AccessTimes: parseInt(access),
                userHasRated: false,
                toBeExchanged: false,
                inUse: false,
                Marketplace: marketplace,
                Frequency: frequency,
                DataAvailableFrom: dataFrom,
                DataAvailableUntil: dataUpTo,
                ValidUntil: new Date(validDate.setDate(validDate.getDate() + 30)) // valid time for token.. 30 days default
              };

            }

            // future thresholds
            else {

              let copyDataUpTo = new Date(dataUpTo);


              currentToken[product_id] = {

                AccessTimes: parseInt(access),
                userHasRated: false,
                toBeExchanged: false,
                inUse: false,
                Marketplace: marketplace,
                Frequency: frequency,
                DataAvailableFrom: dataFrom,
                DataAvailableUntil: dataUpTo,
                ValidUntil: new Date(copyDataUpTo.setDate(copyDataUpTo.getDate() + 30)) // valid time for token.. 30 days default
              };

            }
          }
          token = currentToken;
        }

        // This catch means that the user was not found, meaning user hasn't bought something yet, so it creates a new struct for the user and the token
        catch(error){

          if (error.name == 'BoughtProductError'){

            throw new Error (error.message);
          }

          else{

            let userToken = {};


            // check if access is based on time constraints or not (number of accesses)
            if (JSON.parse(streaming) == true){

              let date = new Date();
              date.setDate(date.getDate() + JSON.parse(access));
              let copyDate = new Date(date);

              userToken[product_id] = {

                AccessPeriod: date.toUTCString(),
                userHasRated: false,
                toBeExchanged: false,
                inUse: false,
                Marketplace: marketplace,
                Frequency: frequency,
                DataAvailableFrom: new Date(),//in streaming the lower bound is equal to the time of transaction
                DataAvailableUntil: date, //in streaming the upper bound is equal to the access period
                ValidUntil: copyDate // valid time for token.. 30 days default
              };


            }

            else {

              let validDate = new Date();

              // past thresholds

              if (dataUpTo < validDate){

                userToken[product_id] = {

                  AccessTimes: parseInt(access),
                  userHasRated: false,
                  toBeExchanged: false,
                  inUse: false,
                  Marketplace: marketplace,
                  Frequency: frequency,
                  DataAvailableFrom: dataFrom,
                  DataAvailableUntil: dataUpTo,
                  ValidUntil: new Date(validDate.setDate(validDate.getDate() + 30)) // valid time for token.. 30 days default
                };
              }

              // future thresholds
              else {

                let copyDataUpTo = new Date(dataUpTo);

                userToken[product_id] = {

                  AccessTimes: parseInt(access),
                  userHasRated: false,
                  toBeExchanged: false,
                  inUse: false,
                  Marketplace: marketplace,
                  Frequency: frequency,
                  DataAvailableFrom: dataFrom,
                  DataAvailableUntil: dataUpTo,
                  ValidUntil: new Date(copyDataUpTo.setDate(copyDataUpTo.getDate() + 30)) // valid time for token.. 30 days default
                };

              }

            }

              token = userToken;
          }

        }

        return token;
    }



   // CheckAccess checks whether a user has still access to the product. If yes, then returns a boolean and the list of resources
   async CheckAccess (ctx, product_id, user_id, data_from, data_until, observations) {

    let existingUser = await new Products().AssetExists(ctx,user_id);

    let currentToken;

    data_from = new Date(data_from);
    data_until = new Date(data_until);

    if (!existingUser) {

      throw new Error (`No information found for user ${user_id} and product ${product_id}.`);
    }

    else{

      currentToken = await new Products().GetAsset(ctx,user_id);
      currentToken = JSON.parse(currentToken);

      if (!(currentToken.hasOwnProperty(product_id))){

        throw new Error ("You can't have access to product you haven't bought or no longer own.");
      }

      // Check if token exists and the date is bigger than the expiration date
      if (!currentToken[product_id].hasOwnProperty('ValidUntil') || new Date() > Date.parse(currentToken[product_id]['ValidUntil'])){

        throw new Error ("You no longer have access to this product.");

      }

      // check if token is to be exchanged
      if (currentToken[product_id]['toBeExchanged']){

        throw new Error ("You have set this product for exchange. You can't use it anymore.");
      }

      // check if the requested data are within the time thresholds set
      if ( (data_from > Date.parse(currentToken[product_id]['DataAvailableUntil']) || data_from < Date.parse(currentToken[product_id]['DataAvailableFrom']))
      || (data_until > Date.parse(currentToken[product_id]['DataAvailableUntil']) || data_until < Date.parse(currentToken[product_id]['DataAvailableFrom']))){

        throw new Error ("Requested data are out of the data bounds you have the product for...")
      }

      // Access times based check
      if (currentToken[product_id].hasOwnProperty('AccessTimes') && !(currentToken[product_id]['AccessTimes'].length == 0)){

        // check if the requested data are within the time thresholds set
        if ( (data_from > Date.parse(currentToken[product_id]['DataAvailableUntil']) || data_from < Date.parse(currentToken[product_id]['DataAvailableFrom']))
        || (data_until > Date.parse(currentToken[product_id]['DataAvailableUntil']) || data_until < Date.parse(currentToken[product_id]['DataAvailableFrom']))){

          throw new Error ("Requested data are out of the data bounds you have the product for...")
        }

        // check if there are available observations.
        if (currentToken[product_id]['AccessTimes'] <= 0){

          // delete currentToken[product_id];
          // await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));
          throw new Error ("You no longer have access to this product.");
        }

        // check if the requested observations are more than the remaining observations
        if (parseInt(observations) > currentToken[product_id]['AccessTimes']){

          throw new Error("Requested observations are more than what you have left.")
        }

      }

      //Streaming based check
      else if (currentToken[product_id].hasOwnProperty('AccessPeriod') && !(currentToken[product_id]['AccessPeriod'].length == 0)){

        let dateAccessed = new Date();

        if (dateAccessed > Date.parse(currentToken[product_id]['ValidUntil']) || dateAccessed < data_from){

          throw new Error("You are not allowed to access this product now.")

        }

      }

      else {

        throw new Error ("Something went wrong ...");

      }
    }

    let tx_id = ctx.stub.getTxID();

    let transaction = {
      TransactionID: tx_id,
      User: user_id,
      ProductID: product_id,
      DateAccessed: new Date().toUTCString()
    }

    let transaction_string = JSON.stringify(transaction);

    var hash = crypto.createHash('sha512');
    let data_hash = hash.update(transaction_string, 'utf-8');
    let tx_hash= data_hash.digest('hex');

    await ctx.stub.putState(tx_id,Buffer.from(stringify((tx_hash))));

    // if it's the first time the product is used, change inUse to true
    if (!currentToken[product_id]['inUse']){

      currentToken[product_id]['inUse'] = true;
      await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));

    }

    let objectToReturn = {
      Transaction: transaction,
      AccessToken: currentToken[product_id]
    }

    return JSON.stringify(objectToReturn);

  }

  // DecreaseAccessTimes decreases the number of available observations/access times, in case of NON-streaming products
  async DecreaseAccessTimes(ctx, product_id, user_id, times_used){

    times_used = parseInt(times_used);

    let currentToken = await new Products().GetAsset(ctx,user_id);
    currentToken = JSON.parse(currentToken);
    let deletedToken;

      if (!(currentToken.hasOwnProperty(product_id))){

        throw new Error ("Can't use a product you don't own.");
      }

      if (currentToken[product_id].hasOwnProperty('AccessTimes') && !(currentToken[product_id]['AccessTimes'].length == 0)){


        // check if remaining observations/times are enough
        if (currentToken[product_id]['AccessTimes'] > 0){

          if (currentToken[product_id]['AccessTimes'] >= times_used){
            currentToken[product_id]['AccessTimes'] -= times_used;
            // currentToken[product_id]['AccessTimes'] = currentToken[product_id]['AccessTimes'].toString();

            if (currentToken[product_id]['AccessTimes'] == 0){

              deletedToken = currentToken[product_id];

              delete currentToken[product_id];
              await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));

              return deletedToken;
            }
            else {

              await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));

            }
          }
          else{

            throw new Error("The requested observations are more than what you have available...")
          }

        }
        // it won't (probably) ever get in here
        else {
          throw new Error ("You no longer have access to this product.");
        }
      }
      else{

        throw new Error("Malformed access token or no longer valid token.")
      }

      return currentToken[product_id];
  }



  //DeleteToken is called when a token is no longer valid and deletes it
  async DeleteToken (ctx, product_id, user_id) {

    let currentToken = await new Products().GetAsset(ctx,user_id);
    currentToken = JSON.parse(currentToken);

    if (!(currentToken.hasOwnProperty(product_id))){

      throw new Error ("Token already deleted");
    }

    // Check if token exists and the date is bigger than the expiration date
    if (!currentToken[product_id].hasOwnProperty('ValidUntil')){

      throw new Error ("You no longer have access to this product.");

    }

    let validityDate  = currentToken[product_id]['ValidUntil'];


    if (new Date(validityDate) <= new Date()){

      delete currentToken[product_id];
      await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));

    }

  }


  // Unsubscribe is called only for streaming products, when user decides to stop streaming data
  async Unsubscribe(ctx, user_id, product_id){

    let currentToken = await new Products().GetAsset(ctx,user_id);
    currentToken = JSON.parse(currentToken);

    if (!(currentToken.hasOwnProperty(product_id))){

      throw new Error ("Can't unsubscribe from a product you don't own.");
    }

    else{

      //  check if this is a streaming product
      if ((currentToken[product_id].hasOwnProperty('AccessPeriod') && !(currentToken[product_id]['AccessPeriod'].length == 0)) && currentToken[product_id]['inUse']){

        currentToken[product_id]['inUse'] = false;
        await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));

      }
      else {

        throw new Error("This product is not in use right now.")
      }

    }

    return currentToken[product_id];

  }


  // GetUserTokens is used to retrive all the product tokens belonging to a user
  async GetUserTokens(ctx, user_id) {

    let existingUser = await new Products().AssetExists(ctx,user_id);

    if (!existingUser){

      throw new Error(`No tokens exist for user ${user_id}.`);
    }

    let currentToken = await new Products().GetAsset(ctx,user_id);
    currentToken = JSON.parse(currentToken);

    // delete currentToken["docType"];

    return JSON.stringify(currentToken);
  }

  // getAllExchangableTokens is used to retrive all the tokens up for exchange
  async GetAllExchangableTokens(ctx) {

    let allUsersInvoke = await ctx.stub.invokeChaincode('basic', ['GetAllUsers'], 'mychannel'); //invoke func from another CC
    let allUsers = allUsersInvoke.payload.toString('utf8'); //read payload response and convert to string
    allUsers = JSON.parse(allUsers);

    let allExchangableTokens = [];

    for (const user of allUsers) {
      let userID = user.ID;
      let existingUser = await new Products().AssetExists(ctx, userID);
      if (existingUser) {
        let userExchangableTokens = [];
        let userExchangableTokensObj = {};
        let currentToken = await new Products().GetAsset(ctx, userID);
        currentToken = JSON.parse(currentToken);
        // for (const token of currentToken) {
        for (const key in currentToken) {
          if (currentToken[key].toBeExchanged) {
            currentToken[key]['productID'] = key;
            userExchangableTokens.push(currentToken[key]);
          }
        }

        userExchangableTokensObj[userID] = userExchangableTokens;
        allExchangableTokens.push(userExchangableTokensObj);
      }
    }

    return JSON.stringify({'allExchangableTokens': allExchangableTokens});
  }

  //OLD SearchProducts function
  // async SearchProducts(ctx, products, price_min, price_max, rep_min, rep_max){

  //   products = JSON.parse(products)

  //   if (price_max < price_min || rep_max < rep_min){

  //     throw new Error ("Minimum price or reputation cannot be bigger than the maximum price or reputation");
  //   }

  //   let productsRetrieved = [];
  //   let retrieved;

  //   for (let i=0; i<products.length; i++){

  //     retrieved = await new Products().GetAsset(ctx, products[i]);

  //     productsRetrieved.push(JSON.parse(retrieved));

  //   }

  //   let filteredProducts = productsRetrieved.filter((product)=>(product.Price >= price_min && product.Price <= price_max) && (product.Reputation >= rep_min && product.Reputation <= rep_max));
  //   if (!filteredProducts || filteredProducts.length === 0){

  //     filteredProducts = [];

  //     // throw new Error("No products found ...")
  //   }

  //   return JSON.stringify(filteredProducts);

  // }

  async SearchResources(ctx, resources, price_min, price_max, rep_min, rep_max){

    resources = JSON.parse(resources)

    let resourcesRetrieved = [];
    let retrieved;

    if ((price_max!='' && price_min!='' && price_max < price_min) || (rep_max!='' && rep_min!='' && rep_max < rep_min)){

      throw new Error ("Minimum price or reputation cannot be bigger than the maximum price or reputation");
    }

    for (let i=0; i<resources.length; i++){

      retrieved = await new Products().GetAsset2(ctx, resources[i]);
      retrieved=JSON.parse(retrieved)
      let flag=0;
      if (retrieved!=0){
        if (price_min!=''){
          if (retrieved.Price>=price_min){
            flag=1;
          }else{
            flag=0;
          }
        }else{
            flag=1;
        }
        if (flag!=0){
            if (price_max!=''){
                if (retrieved.Price<=price_max){
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
                if (retrieved.overallReputation>=rep_min){
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
                if (retrieved.overallReputation<=rep_max){
                    flag=1;
                }else{
                    flag=0;
                }
            }else{
                flag=1;
            }
        }
        if (flag==1){
            resourcesRetrieved.push(retrieved);
        }
      }

    }

    //let filteredResources = resourcesRetrieved.filter((resource)=>(resource.Price >= price_min && resource.Price <= price_max) && (resource.overallReputation >= rep_min && resource.overallReputation <= rep_max));
    if (!resourcesRetrieved || resourcesRetrieved.length === 0){

      resourcesRetrieved = [];
      // throw new Error("No resources found ...")
    }
    return JSON.stringify(resourcesRetrieved);

  }


// GetFederatedProducts returns the products belonging to the specified federated marketplace
  async GetFederatedProducts(ctx, fed_id){

    let assets = await new Products().GetAllAssets(ctx);

    let fedProducts = assets.filter( (asset) => (asset.docType === "Product") && (asset.FedMarketplace_id == fed_id));

    return JSON.stringify(fedProducts);

  }


  // GetGlobalProducts returns the products belonging to the global marketplace
  async GetGlobalProducts(ctx){

    let assets = await new Products().GetAllAssets(ctx);

    let globalProducts = assets.filter((asset) => (asset.docType === "Product") && (JSON.parse(asset.GlobalMarketplace_id) == true));

    return JSON.stringify(globalProducts);

  }

  // PutTokenForExchange for exchange called when user doesn't need a token anymore and wants to put it out for exchange
  async PutTokenForExchange(ctx, product_id, user_id) {

    let currentToken = await new Products().GetAsset(ctx,user_id);
    currentToken = JSON.parse(currentToken);

    //  checks if the streaming product is still in use
    if (currentToken[product_id].hasOwnProperty('AccessPeriod') && currentToken[product_id]['inUse']){

      throw new Error("Please unsubscribe from the streaming product.")
    }

    if (!currentToken[product_id]["toBeExchanged"]) {
      currentToken[product_id]["toBeExchanged"] = true;
      await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));
      return currentToken[product_id];
    }
    else {
      throw new Error ("Token is already exchangable ...");
    }

  }


  // RemoveTokenFromExchange revokes a token from exchange list
  async RemoveTokenFromExchange(ctx, product_id, user_id) {

    let currentToken = await new Products().GetAsset(ctx,user_id);
    currentToken = JSON.parse(currentToken);

    if (currentToken[product_id]["toBeExchanged"]) {
      currentToken[product_id]["toBeExchanged"] = false;
      await ctx.stub.putState(user_id,Buffer.from(stringify((currentToken))));
    }
    else {
      throw new Error ("Token is already not available for exchange ...");
    }

  }

  // ExchangeTokens implements the exchange of tokens between two users
  async ExchangeTokens(ctx, user_id1, user_id2, product_id1, product_id2) {

    let currentTokenUser1 = await new Products().GetAsset(ctx,user_id1);
    currentTokenUser1 = JSON.parse(currentTokenUser1);
    let currentTokenUser2 = await new Products().GetAsset(ctx,user_id2);
    currentTokenUser2 = JSON.parse(currentTokenUser2);

    // only user1 is required to have put his token for exchange
    if (product_id1 === product_id2) {
      throw new Error (`Cannot exchange tokens related to the same product`);
    }

    let currentProduct = await new Products().GetAsset(ctx, product_id2);
    currentProduct = JSON.parse(currentProduct);

    let seller = currentProduct.Seller;
    if (seller === user_id1) {
      throw new Error (`User ${user_id1} owns ${product_id2}`);
    }

    // TODO: Uncomment this when "Marketplace_id" property is added to access Token
    if (currentTokenUser1[product_id1]["Marketplace_id"] != currentTokenUser2[product_id2]["Marketplace_id"]) {
      throw new Error (`Token exchanges are only allowed within the same marketplaces`);
    }


    // only user1 is required to have put his token for exchange
    if (!currentTokenUser1[product_id1]["toBeExchanged"]) {
      throw new Error (`User ${user_id1} has not put ${product_id1} up for exchange`);
    }
    else if (currentTokenUser2[product_id2]["toBeExchanged"]) {
      throw new Error (`${product_id2} is already placed for
         exchange`);
    }
    else {
      if (currentTokenUser1[product_id1]["userHasRated"]) {
        currentTokenUser1[product_id1]["userHasRated"] = false;
      }
      if (currentTokenUser2[product_id2]["userHasRated"]) {
        currentTokenUser2[product_id2]["userHasRated"] = false;
      }
      currentTokenUser1[product_id1]["toBeExchanged"] = false; //make token not exchangable before switching
      // switch tokens
      currentTokenUser1[product_id2] = currentTokenUser2[product_id2];
      delete currentTokenUser2[product_id2];
      currentTokenUser2[product_id1] = currentTokenUser1[product_id1];
      delete currentTokenUser1[product_id1];
      await ctx.stub.putState(user_id1,Buffer.from(stringify((currentTokenUser1))));
      await ctx.stub.putState(user_id2,Buffer.from(stringify((currentTokenUser2))));
    }

  }


  async VerifyReceipt (ctx, receipt, tx_id, hash){

    // let hash = crypto.createHash('sha512');
    // let data_hash = hash.update(receipt, 'utf-8');
    // let tx_hash= data_hash.digest('hex');

    let onChainTx = await ctx.stub.getState(tx_id);

    if (!onChainTx) {

      throw new Error("Receipt not found...");
    }
    onChainTx = onChainTx.toString();
    onChainTx = JSON.parse(onChainTx);

    

    if ((hash === onChainTx)){

      return (true);
    }
    else {return false;}


  }

}

module.exports = Marketplace;
