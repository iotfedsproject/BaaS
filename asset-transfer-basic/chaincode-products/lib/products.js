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
// const Marketplace = require('./marketplace.js');


class Products extends Contract {

  constructor(){super();};

  async InitLedger(ctx) {

    const products = [
      {
        Product_id: "product1",
        docType: "Product",
        Price: 5,
        Resource_ids : {"device1": "platform1", "device2": "platform1"},
        transactionCounter: 10,
        Product_details: [{}],
        FedMarketplace_id: "fed3",
        GlobalMarketplace: true,
        // NumberOfRatings: 0,
        subjReputation: [],
        Reputation: 0,
        Seller: "evathana"

      },

      {
        Product_id: "product2",
        docType: "Product",
        Price: 5,
        Resource_ids : {"device2": "platform1"},
        transactionCounter: 5,
        Product_details: [{}],
        FedMarketplace_id: "fed2",
        GlobalMarketplace: false,
        // NumberOfRatings: 0,
        subjReputation: [],
        Reputation: 0,
        Seller: "gspanos"

      },
      {
        Product_id: "product3",
        docType: "Product",
        Price: 5,
        Resource_ids : {"device1": "platform1"},
        transactionCounter: 7,
        Product_details: [{}],
        FedMarketplace_id: "fed3",
        GlobalMarketplace: true,
        // NumberOfRatings: 0,
        subjReputation: [],
        Reputation: 0,
        Seller: "spolymeni"

      },



    ];

    const resources = [
      {
          Resource_id: "device1",
          docType: "Resource",
          Platform: "platform1",
          Price: 0,
          objReputation: 0.5,
          subjReputation: 0,
          overallReputation: 0.5,
          transactionCounter: 10,
          relatedFeds: ['fed3']
      },
      {
          Resource_id: "device2",
          docType: "Resource",
          Platform: "platform1",
          Price: 0,
          objReputation: 0.5,
          subjReputation: 0,
          overallReputation: 0.8,
          transactionCounter: 5,
          relatedFeds: ['fed3', 'fed2']
      },

    ];


    for (const product of products) {
      await ctx.stub.putState(product.Product_id, Buffer.from(stringify((product))));
    }
    for (const resource of resources) {
      await ctx.stub.putState(resource.Resource_id, Buffer.from(stringify((resource))));
    }


  }


  // async InitLedger(ctx) {
  //
  // }
 // CreateProduct creates a new product on the ledger.
  async CreateProduct(ctx, product_id, resource_ids, product_details, fed_marketplace, seller_id) {
    const exists = await this.AssetExists(ctx, product_id);
    if (exists) {
        throw new Error(`The product with id ${product_id} already exists`);
    }

    let prodResources = JSON.parse(resource_ids);
    // check if resources exist
    for (const resource of prodResources) {
      const exists = await this.AssetExists(ctx, resource);
      if (!exists) {
        throw new Error(`The resource with id ${resource} does not exist`);
      }
      let assets = await this.GetAllAssets(ctx);

      let fedResource = assets.filter( (asset) => (asset.Resource_id === resource) && (asset.docType === "Resource") && (asset.fed_id.includes(fed_marketplace)));
      if (fedResource.length<1){
        throw new Error(`The resource with id ${resource} does not exist in Federation Marketplace ${fed_marketplace}`);

      }
    }

    let resourcesWithPlatform = {};
    let baselinePrice=0;
    for (const resource of prodResources) {
      let currentResource = await this.GetAsset(ctx, resource);
      currentResource = JSON.parse(currentResource);
      if (!currentResource['relatedFeds'].includes(fed_marketplace)) {
        currentResource['relatedFeds'].push(fed_marketplace);
      }
      baselinePrice+= Number(currentResource.Price);
      resourcesWithPlatform[resource] = currentResource.Platform;
      await ctx.stub.putState(resource, Buffer.from(stringify((currentResource))));
    }

    const newProdRep = await this.GetAverageReputation(ctx, 'Product');

    let globalMarketplaceId = false;
    let fedInvoke = await ctx.stub.invokeChaincode('federationsmanage', ['ReadAsset', fed_marketplace], 'mychannel'); //invoke func from another CC
    let fed = fedInvoke.payload.toString('utf8'); //read payload response and convert to string
    let fedObj = JSON.parse(fed);
    if (fedObj.rules.IoTFedsRules.FedTypeRules.DataAvailability != 'Closed') {
      globalMarketplaceId = true;
    }

    const product = {
        Product_id: product_id,
        docType: "Product",
        Price: baselinePrice,
        Resource_ids: resourcesWithPlatform,
        Product_details: JSON.parse(product_details),
        FedMarketplace_id: fed_marketplace,
        GlobalMarketplace_id: globalMarketplaceId,
        transactionCounter: 0,
        subjReputation: [],
        Reputation: newProdRep,
        // NumberOfRatings: 0,
        Seller: seller_id

    };

    //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(product_id, Buffer.from(stringify((product))));

    await ctx.stub.invokeChaincode('basic', ['UpdateUserActiveProd', seller_id,product_id], 'mychannel'); //invoke func from another CC

    return JSON.stringify(product);
  }


  // CreateResource creates a new resource on the ledger.
   async CreateResource(ctx, resource_id, platform_id, user) {
     const exists = await this.AssetExists(ctx, resource_id);
     if (exists) {
         throw new Error(`The resource with id ${resource_id} already exists`);
     }

     const newResourceRep = await this.GetAverageReputation(ctx, 'Resource');

     const resource = {
         Resource_id: resource_id,
         owner: user,
         docType: "Resource",
         Platform: platform_id,
         Price: 0,
         fed_id:[],
         objReputation: 0,
         subjReputation: 0,
         overallReputation: newResourceRep,
         transactionCounter: 0,
         relatedFeds: [],
         Lr:0,
         Hr:0,
         Fr:0,
         Wr:0,
         aro:1,
         ard:0,
         Brd:0,
         fr:0,
         arf:0,
         Brr:0
     }

     //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
     await ctx.stub.putState(resource_id, Buffer.from(stringify((resource))));
     return JSON.stringify(resource);

  }

  async UpdateResource(ctx, id, price, fedID,user, Lr, Hr, Fr, Wr, aro,ard,Brd,fr,arf,Brr,arr) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The resource ${id} does not exist`);
    }

    let currentResource = await this.GetAsset(ctx, id);
    currentResource = JSON.parse(currentResource);
    if (user!=currentResource.owner){
      throw new Error(`The resource ${id} not belongs to user ${user}`);
    }
    if(currentResource.fed_id.indexOf(fedID) !== -1){
      throw new Error(`The resource ${id} already belongs to federation ${fedID}`);
    }
    let Lr_epoch= new Date(Lr).getTime();
    let Hr_epoch= new Date(Hr).getTime();
    currentResource.Price = Number(price);
    currentResource.Lr = Number(Lr_epoch);
    currentResource.Hr = Number(Hr_epoch);
    currentResource.Fr = Number(Fr);
    currentResource.Wr = Number(Wr);
    currentResource.aro = Number(aro);
    currentResource.ard = Number(ard);
    currentResource.Brd = Number(Brd);
    currentResource.fr = Number(fr);
    currentResource.arf = Number(arf);
    currentResource.Brr = Number(Brr);
    currentResource.arr = Number(arr);
    currentResource.fed_id.push(fedID)

    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentResource))));
  }

  async UpdateResource2(ctx, id) {

    let currentResource = await this.GetAsset(ctx, id);
    currentResource = JSON.parse(currentResource);
    currentResource.fed_id=[];

    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentResource))));
  }

  // productExists returns true when a product with given ID exists in world state.
  async AssetExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }



  //  returns the product stored in the world state with given id.
  async GetAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id); // get the fed from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset with id ${id} does not exist`);
    }

    return assetJSON.toString();
  }
  
  async GetAsset2(ctx, id) {
    const assetJSON = await ctx.stub.getState(id); // get the fed from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      return 0;
    }

    return assetJSON.toString();
  }

  //  returns a product stored in the world state with given id.
  async GetProduct(ctx, id) {
    const currentAsset = await this.GetAsset(ctx, id); // get the asset from the current state
    const currentAssetJson = JSON.parse(currentAsset);
    if (currentAssetJson.docType != "Product") {
      throw new Error(`The product with id ${id} does not exist`);
    }

    return JSON.stringify(currentAssetJson);
  }

  //  returns a resource stored in the world state with given id.
  async GetResource(ctx, id) {
    const currentAsset = await this.GetAsset(ctx, id); // get the asset from the current state
    const currentAssetJson = JSON.parse(currentAsset);
    if (currentAssetJson.docType != "Resource") {
      throw new Error(`The product with id ${id} does not exist`);
    }

    return JSON.stringify(currentAssetJson);
  }


  // GetAllAssets returns all assets found in the world state.
  async GetAllAssets(ctx) {

    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
        const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
        let record;
        try {
            record = JSON.parse(strValue);
        } catch (err) {
            console.log(err);
            record = strValue;
        }
        allResults.push(record);
        result = await iterator.next();
    }
    return allResults;
  }


  // Gets all assets of input docType
  async GetAllAssetsOfType(ctx, type) {

    let allAssets = await this.GetAllAssets(ctx); // get all assets
    let assetsOfType = allAssets.filter( (asset) => asset.docType === type); // filter by type
    return JSON.stringify(assetsOfType);

  }

  // GetFederatedResources returns the resources belonging to the specified federated marketplace
  async GetFederatedResources(ctx, fed_id, Lr, Hr, Fr){

    let assets = await this.GetAllAssets(ctx);
    if (Lr!='' && Hr!='' && Fr!=0){
      let Lr_epoch= new Date(Lr).getTime();
      let Hr_epoch= new Date(Hr).getTime();
      let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)) && (asset.Hr<=Hr_epoch) && (asset.Lr>=Lr_epoch) && (asset.Fr<=Fr));

      return JSON.stringify(fedResources);
    }else if (Lr!='' && Hr!='' && Fr==0){
      let Lr_epoch= new Date(Lr).getTime();
      let Hr_epoch= new Date(Hr).getTime();
      let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)) && (asset.Hr<=Hr_epoch) && (asset.Lr>=Lr_epoch));

      return JSON.stringify(fedResources);
    }else if (Lr!='' && Hr=='' && Fr!=0){
      let Lr_epoch= new Date(Lr).getTime();
      let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)) && (asset.Lr>=Lr_epoch) && (asset.Fr<=Fr));
  
      return JSON.stringify(fedResources);
    }else if (Lr=='' && Hr!='' && Fr!=0){
      let Hr_epoch= new Date(Hr).getTime();
      let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)) && (asset.Hr<=Hr_epoch) && (asset.Fr<=Fr));
  
      return JSON.stringify(fedResources);
    }else if (Lr=='' && Hr=='' && Fr!=0){
      let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)) && (asset.Fr<=Fr));

      return JSON.stringify(fedResources);
    }else if (Lr=='' && Hr=='' && Fr==0){
      let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)));
      if (fedResources.length<1) {
        throw new Error(`Federation ${fed_id} has no resources at all`);
      }
  
      return JSON.stringify(fedResources);
    }else {
      throw new Error(`You made a mistake on parametres!`);
    }

    // let fedResources = assets.filter( (asset) => (asset.docType === "Resource") && (asset.fed_id.includes(fed_id)));
    // if (fedResources.length<1) {
    //   throw new Error(`Federation ${fed_id} has no resources at all`);
    // }

    // return JSON.stringify(fedResources);

  }



  //DeleteProduct is called when a user wants to delete a product
  // TODO: Before deleting, check if product has an ongoing sale
  // TODO: who has the right to delete the product ?
  async DeleteProduct (ctx, product_id, user_id){

    let existingProduct = await this.AssetExists(ctx, product_id);

    if (!existingProduct){

      throw new Error("Can't delete a product that does not exist");
    }

    let currentProduct = await this.GetAsset(ctx, product_id);
    currentProduct = JSON.parse(currentProduct);

    let seller = currentProduct.Seller;

    if (user_id != seller){

      throw new Error("Only the seller of the product can delete it.");

    }

    let currentDate = new Date();
    let notdeleteFlag=false

    let allUsersInvoke = await ctx.stub.invokeChaincode('basic', ['GetAllUsers'], 'mychannel'); //invoke func from another CC
    let allUsers = allUsersInvoke.payload.toString('utf8'); //read payload response and convert to string
    allUsers = JSON.parse(allUsers);

    for (const user of allUsers) {
      let userID = user.ID;
      let existingUser = await this.AssetExists(ctx, userID);
      if (existingUser) {
        let currentToken = await this.GetAsset(ctx, userID);
        currentToken = JSON.parse(currentToken);
        for (const key in currentToken) {
          if (key==product_id){
            let validDate=new Date(currentToken[key].ValidUntil);
            if (currentDate<=validDate){
              notdeleteFlag=true;
            }
          }
        }
      }
    }

    if (!notdeleteFlag){
      await ctx.stub.deleteState(product_id);

      return JSON.stringify(currentProduct);
    }else{
      throw new Error("Can't delete a product that has valid tokens");
    }
  }


  //ChangePrice is called when the price of an existing product must change
  async ChangePrice(ctx, product_id, new_price) {

    let existingProduct = await this.AssetExists(ctx, product_id);

    if (!existingProduct){

      throw new Error("Can't change the price of a product that does not exist.");
    }

    let currentProduct = await this.GetAsset(ctx, product_id);
    currentProduct = JSON.parse(currentProduct);

    if (currentProduct.Price != new_price){

      currentProduct.Price = new_price;
    }

    else {
      throw new Error("New price can't be the same as the old one.")
    }

    await ctx.stub.putState(product_id, Buffer.from(stringify((currentProduct))));

    return JSON.stringify(currentProduct);
  }


  //ChangeRepAfterRate is called when a user rates a product
  async ChangeRepAfterRate(ctx, product_id, user_id, user_rating) {


    let rating = JSON.parse(user_rating);
    let existingProduct = await this.AssetExists(ctx, product_id);

    if (!existingProduct){
      throw new Error("Can't rate a product that does not exist.");
    }

    // let userTokens = await new Marketplace().GetUserTokens(ctx, user_id);
    let userTokens = await this.GetAsset(ctx,user_id);
    userTokens = JSON.parse(userTokens);

    if (!userTokens.hasOwnProperty(product_id)) {
      throw new Error("A user cannot rate a product he has no access to");
    }

    // let productToken = userTokens[product_id];

    if (userTokens[product_id].userHasRated === true) {
      throw new Error("User has already rated");
    }

    let currentProduct = await this.GetAsset(ctx, product_id);
    currentProduct = JSON.parse(currentProduct);
    let qoEWeights = await this.GetQoEWeights(ctx, currentProduct.FedMarketplace_id);

    let currentSubjScore = 0;
    for (const [key, value] of Object.entries(rating)) {
      currentSubjScore += value*qoEWeights[key];
    }
    currentProduct.subjReputation.push(currentSubjScore);
    await ctx.stub.putState(currentProduct.Product_id, Buffer.from(stringify((currentProduct))));
    // maybe call some of these after endpoint execution
    // updates subjective and overall reputation of resources
    await this.UpdateResourceRepByProduct(ctx, Object.keys(currentProduct.Resource_ids), currentSubjScore); // maybe this should be called after endpoint

    userTokens[product_id].userHasRated = true;
    await ctx.stub.putState(user_id, Buffer.from(stringify((userTokens)))); // update user's tokens

    return JSON.stringify(currentProduct);
  }

  async GetQoEWeights(ctx, fed_id) {
    let fedInvoke = await ctx.stub.invokeChaincode('federationsmanage', ['ReadAsset', fed_id], 'mychannel'); //invoke func from another CC
    let fed = fedInvoke.payload.toString('utf8'); //read payload response and convert to string
    let fedObj = JSON.parse(fed);
    return fedObj.rules.IoTFedsRules.QualityAssuranceMetrics.QoEWeights;
  }

  async GetQoSWeights(ctx, fed_id) {
    let fedInvoke = await ctx.stub.invokeChaincode('federationsmanage', ['ReadAsset', fed_id], 'mychannel'); //invoke func from another CC
    let fed = fedInvoke.payload.toString('utf8'); //read payload response and convert to string
    let fedObj = JSON.parse(fed);
    return fedObj.rules.IoTFedsRules.QualityAssuranceMetrics.QoSWeights;
  }

  // Updates sunj reputations of all resources in product, if this is called asynchronously in the future, paramteres need to be changed
  async UpdateResourceRepByProduct(ctx, resourceIDs, currentSubjScore) {

    let lambda = 0.5;
    // let updatedResourceReps = [];
    // let productDataProviders = [];
    for (const resourceID of resourceIDs) {

      let currentResource = await this.GetAsset(ctx, resourceID);
      currentResource = JSON.parse(currentResource);
      // read provider of resource and extract his weight
      let userInvoke = await ctx.stub.invokeChaincode('basic', ['ReadUserByPlatform', currentResource.Platform], 'mychannel'); //invoke func from another CC
      let user = userInvoke.payload.toString('utf8'); //read payload response and convert to string
      let userObj = JSON.parse(user);
      let weight = userObj.Reputation;

      // if (!productDataProviders.includes(userObj.ID)) {
      //   productDataProviders.push(userObj.ID);
      // }

      currentResource.subjReputation = lambda*currentSubjScore + (1-lambda)*currentResource.subjReputation;
      currentResource.overallReputation = weight*currentResource.objReputation + (1-weight)*currentResource.subjReputation;
      // updatedResourceReps.push(currentResource.overallReputation);
      await ctx.stub.putState(resourceID, Buffer.from(stringify((currentResource))));

    }

    // return { updatedResourceReps, productDataProviders };
  }

  async UpdateDataProvidersRep(ctx, dataProviders) {

    for (const provider of dataProviders) {
      // find all devices of provider and put in list
      // let userInvoke = await ctx.stub.invokeChaincode('basic', ['ReadUser', provider], 'mychannel'); //invoke func from another CC
      // let user = userInvoke.payload.toString('utf8'); //read payload response and convert to string
      // let userObj = JSON.parse(user);
      let providerDevicesIDs = Object.values(provider.AssociatedPlatforms).flat();
      // find number of transactions for each device and put in list
      let transactionsPerDevice = [];
      let reputationPerDevice = [];
      for (const deviceID of providerDevicesIDs) {
        let currentResource = await this.GetAsset(ctx, deviceID);
        currentResource = JSON.parse(currentResource);
        transactionsPerDevice.push(currentResource.transactionCounter);
        reputationPerDevice.push(currentResource.overallReputation);
      }
      // find weight for each device, by dividing each transaction number with the sum of all transaction nums
      let sumOfTransactions = transactionsPerDevice.reduce((a, b) => a + b, 0);
      let weights = Array(reputationPerDevice.length);
      for(let i = 0, length = reputationPerDevice.length; i < length; i++){
          weights[i] = reputationPerDevice[i] / sumOfTransactions;
      }

      // find provider reputation with formula
      let sumOfWeights = weights.reduce((a, b) => a + b, 0);
      let sum = 0;
      for(let i=0; i< weights.length; i++) {
          sum += weights[i]*reputationPerDevice[i];
      }
      let providerReputation = sum/sumOfWeights;
      if (providerReputation) {
        let repString = providerReputation.toString();
        // write to user ledger
        await ctx.stub.invokeChaincode('basic', ['UpdateUserReputation', provider.ID, repString], 'mychannel'); //invoke func from another CC
      }

    }
  }

  // Updates obj reputation of a resource
  async UpdateResourceRep(ctx, qosMetrics) {

    let qosPerResource = JSON.parse(qosMetrics);
    // let resourceIDs = JSON.parse(resources);

    // if (resourceIDs.length != qosMetrics.length) {
    //   throw new Error(`Unmatching dimensions of resources and metrics`);
    // }

    for (const resource of qosPerResource) {
      // qosPerResource.forEach(function (resource) {

      let currentResource = await this.GetAsset(ctx, resource.resource_id);
      currentResource = JSON.parse(currentResource);
      // let qos = qosPerResource[resourceID];
      let qos = resource.qos;

      let repsPerFedSum = 0;
      let repsPerFedCounter = 0;
      for (const fedID of currentResource.relatedFeds) {

        let qoSWeights = await this.GetQoSWeights(ctx, fedID);

        let currentObjScore = 0;
        for (const [key, value] of Object.entries(qos)) {
          currentObjScore += value*qoSWeights[key];
        }
        repsPerFedSum += currentObjScore;
        repsPerFedCounter += 1;
      }

      currentResource.objReputation = repsPerFedSum/repsPerFedCounter;
      let userInvoke = await ctx.stub.invokeChaincode('basic', ['ReadUserByPlatform', currentResource.Platform], 'mychannel'); //invoke func from another CC
      let user = userInvoke.payload.toString('utf8'); //read payload response and convert to string
      let userObj = JSON.parse(user);
      let weight = userObj.Reputation;
      currentResource.overallReputation = weight*currentResource.objReputation + (1-weight)*currentResource.subjReputation;

      await ctx.stub.putState(currentResource.Resource_id, Buffer.from(stringify((currentResource))));

    }
  // return JSON.stringify(currentResource);
  }

  async UpdateAllReputations (ctx) {

    // Get all products and loop throught them to update their reps
    let allProducts = await this.GetAllAssetsOfType(ctx, "Product");
    allProducts = JSON.parse(allProducts);
    // let allProducts = allAssets.filter( (asset) => asset.docType === "Product"); // filter by type

    for (let prod of allProducts) {

      //Inner loop for reputation extraction of all resources per product
      let productResourceReps = [];
      for (const resource of Object.keys(prod.Resource_ids)) {
        let currentResource = await this.GetAsset(ctx, resource);
        currentResource = JSON.parse(currentResource);
        productResourceReps.push(currentResource.overallReputation);
      }

      // update overall reputation of a product
      let repSum = 0;
      let resourceValueSum = 0;
      for (const resourceRep of productResourceReps) {
        let resourceValue = 0.5; // TODO: hardcoded for now but could be calculated if resource values are defined
        repSum += resourceValue*resourceRep;
        resourceValueSum += resourceValue;
      }
      prod.Reputation = repSum/resourceValueSum;
      await ctx.stub.putState(prod.Product_id, Buffer.from(stringify((prod))));

    }

    //Pull all data providers (users) and pass them as argument
    let allUserInvoke = await ctx.stub.invokeChaincode('basic', ['GetAllUsers'], 'mychannel'); //invoke func from another CC
    let allUsers = allUserInvoke.payload.toString('utf8'); //read payload response and convert to string
    let allDataProviders = JSON.parse(allUsers);
    //: Call update data provider reputation
    await this.UpdateDataProvidersRep(ctx, allDataProviders);

    //Get all federations and loop through them
    let allFedInvoke = await ctx.stub.invokeChaincode('federationsmanage', ['GetAllAssetsOfType', 'fed'], 'mychannel'); //invoke func from another CC
    let allFeds = allFedInvoke.payload.toString('utf8'); //read payload response and convert to string
    let allFederations = JSON.parse(allFeds);
    for (const fed of allFederations) {
      // Call update federation reputation
      let allFedProducts = allProducts.filter( (product) => product.FedMarketplace_id === fed.ID); // filter by fed

      let transactionsPerProduct = [];
      let reputationPerProduct = [];
      for (const product of allFedProducts) {
        // let currentResource = await this.GetAsset(ctx, deviceID);
        // currentResource = JSON.parse(currentResource);
        transactionsPerProduct.push(product.transactionCounter);
        reputationPerProduct.push(product.Reputation);
      }
      // find weight for each device, by dividing each transaction number with the sum of all transaction nums
      let sumOfTransactions = transactionsPerProduct.reduce((a, b) => a + b, 0);
      let weights = Array(reputationPerProduct.length);
      for(let i = 0, length = reputationPerProduct.length; i < length; i++){
          weights[i] = reputationPerProduct[i] / sumOfTransactions;
      }

      // find fed reputation with formula
      let sumOfWeights = weights.reduce((a, b) => a + b, 0);
      let sum = 0;
      for(let i=0; i< weights.length; i++) {
          sum += weights[i]*reputationPerProduct[i];
      }
      let fedRep = sum/sumOfWeights;

      // let prodSum = 0;
      // let numOfProducts = allFedProducts.length;
      // for (const prod of allFedProducts) {
      //   prodSum += prod.Reputation;
      //   // numOfProducts += 1;
      // }
      //
      // let fedRep = prodSum/numOfProducts;
      if (fedRep) {
        await ctx.stub.invokeChaincode('federationsmanage', ['ChangeFedRep', fed.ID, fedRep.toString()], 'mychannel');
      }

    }

  }

  // PriceCalculation is responsible for calculating the price of a product based on a set of rules
  async PriceCalculation (ctx, product_id){


  }

  // GetAverageReputation calculates average reputation of provided asset type
  async GetAverageReputation(ctx, assetType){

    const allAssets = await this.GetAllAssetsOfType(ctx, assetType);
    const allAssetsObj = JSON.parse(allAssets);
    let averageAssetRep;

    if (allAssetsObj) {
      let assetRepSum = 0;
      let numOfAssets = allAssetsObj.length;

      if (assetType === 'Product') {
        for (const asset of allAssetsObj) {
          assetRepSum += asset.Reputation;
        }
      }
      else {
        for (const asset of allAssetsObj) {
          assetRepSum += asset.overallReputation;
        }
      }

      averageAssetRep = assetRepSum/numOfAssets;
    }
    else {
      averageAssetRep = 0.5;
    }

    return averageAssetRep;

  }

  // increments the transactionCounter of a product and all its resources
  async incrementTransaction(ctx, product_id) {

    let currentProduct = await this.GetAsset(ctx, product_id);
    currentProduct = JSON.parse(currentProduct);

    currentProduct.transactionCounter += 1;

    for (const resource of Object.keys(currentProduct.Resource_ids)) {
      let currentResource = await this.GetAsset(ctx, resource);
      currentResource = JSON.parse(currentResource);
      currentResource.transactionCounter += 1;
      await ctx.stub.putState(resource, Buffer.from(stringify((currentResource))));
    }

    await ctx.stub.putState(product_id, Buffer.from(stringify((currentProduct))));
  }


  // ExistingProducts checks if the input products exust on the ledger
  // async ExistingProducts(ctx, products){

  //   for (i = 0; i < products.length; i++){

  //     let existingProduct = await this.AssetExists(ctx, products[i]);

  //     if (!existingProduct){

  //       throw new Error(`Product ${products[i]} does not exist.`);
  //     }

  //   }

  //   return true;
  // }





}

module.exports = Products;
