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

class UserManage extends Contract {

  async InitLedger(ctx) {
    const users = [
      {
        ID: 'evathana',
        Role: 'Research associate',
        Mail: 'evathana@iti.gr',
        Organization: 'Dimos Thermis',
        Reputation: 0.5,
        Balance: 0,
        AssociatedPlatforms: {"platform1": ["device1", "device2"]},
      },
      {
        ID: 'spolymeni',
        Role: 'Research associate',
        Mail: 'spolymeni@iti.gr',
        Organization: 'Dimos Kalamarias',
        Reputation: 0.5,
        Balance: 0,
        AssociatedPlatforms: {},
      },
      {
        ID: 'gspanos',
        Role: 'Postdoctoral Researcher',
        Mail: 'gspanos@iti.gr',
        Organization: 'CERTH',
        Reputation: 0.5,
        Balance: 0,
        AssociatedPlatforms: {},
      },
    ];

    for (const user of users) {
      user.docType = 'user';
      // example of how to write to world state deterministically
      // use convetion of alphabetic order
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
      await ctx.stub.putState(user.ID, Buffer.from(stringify(sortKeysRecursive(user))));
    }
  }

  // CreateUser issues a new user to the world state with given details.
  async CreateUser(ctx, id, role, mail, organization, balance=0, associatedPlatforms={}) {
    const exists = await this.UserExists(ctx, id);
    let existORG = await this.UserOrgExists(ctx, organization);
    existORG=JSON.parse(existORG);
    if (existORG==0){
      throw new Error(`An user with Organization ${organization} already exists`);
    }
    
    if (exists) {
      throw new Error(`The user ${id} already exists`);
    }

    const newUserRep = await this.GetAverageUserReputation(ctx);

    const user = {
      ID: id,
      Fed_owner: false,
      Feds: [],
      docType: 'user',
      Role: role,
      Mail: mail,
      Organization: organization,
      Reputation: newUserRep,
      Balance: balance,
      AssociatedPlatforms: associatedPlatforms,
      ActiveProducts: []
    };
    //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(user))));
    return JSON.stringify(user);
  }

  // ReadUser returns the user stored in the world state with given id.
  async ReadUser(ctx, id) {
    const userJSON = await ctx.stub.getState(id); // get the user from chaincode state
    if (!userJSON || userJSON.length === 0) {
      throw new Error(`The user ${id} does not exist`);
    }
    return userJSON.toString();
  }


  // TODO:  Either keep this and replace the three patch endpoints with one /updateUser patch endpoint
  // TODO: or update it to serve balance updates and create two functions for platform and device registration
  // UpdateUser updates an existing user in the world state with provided parameters.
  // async UpdateUser(ctx, id, role, organization, balance, associatedPlatforms) {
  //     const exists = await this.UserExists(ctx, id);
  //     if (!exists) {
  //         throw new Error(`The user ${id} does not exist`);
  //     }
  //
  //     // overwriting original user with new user
  //     const updatedUser = {
  //         ID: id,
  //         Role: role,
  //         Organization: organization,
  //         Balance: balance,
  //         AssociatedPlatforms: associatedPlatforms,
  //     };
  //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
  //     return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedUser))));
  // }


  // UpdateUserBalance updates an existing user's balance in the world state.
  async UpdateUserBalance(ctx, id, fee) {
    const exists = await this.UserExists(ctx, id);
    if (!exists) {
      throw new Error(`The user ${id} does not exist`);
    }

    let currentUser = await this.ReadUser(ctx, id);
    currentUser = JSON.parse(currentUser);
    currentUser.Balance += Number(fee);

    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
  }

    // UpdateUserBalance updates an existing user's balance in the world state.
    async UpdateUserFed(ctx, id) {
      let currentUser = await this.ReadUser(ctx, id);
      currentUser = JSON.parse(currentUser);
      currentUser.Fed_owner = true;
  
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
    }

    async UpdateUserFed2(ctx, id) {
      let currentUser = await this.ReadUser(ctx, id);
      currentUser = JSON.parse(currentUser);
      currentUser.Fed_owner = false;
  
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
    }

        // UpdateUserBalance updates an existing user's balance in the world state.
        async UpdateUserFedMember(ctx, id,federation) {
          let currentUser = await this.ReadUser(ctx, id);
          currentUser = JSON.parse(currentUser);
          currentUser.Feds.push(federation);
      
          // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
          return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
        }
  
        async UpdateUserActiveProd(ctx, id,product_id) {
          let currentUser = await this.ReadUser(ctx, id);
          currentUser = JSON.parse(currentUser);
          currentUser.ActiveProducts.push(product_id);
      
          // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
          return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
        }

  // UpdateUserReputation updates an existing user's reputation in the world state.
  async UpdateUserReputation(ctx, id, newRep) {
    const exists = await this.UserExists(ctx, id);
    if (!exists) {
      throw new Error(`The user ${id} does not exist`);
    }

    let currentUser = await this.ReadUser(ctx, id);
    currentUser = JSON.parse(currentUser);
    currentUser.Reputation = parseFloat(newRep);

    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
  }



  // // ReadUserByPlatform returns the user stored in the world state with given platform id.
  async ReadUserByPlatform(ctx, idPlatform) {
    const allUsers = await this.GetAllUsers(ctx);
    const allUsersObj = JSON.parse(allUsers);
    let userWithPlatform = "";
    allUsersObj.every(user => { // source: https://masteringjs.io/tutorials/fundamentals/foreach-break
      if (user.AssociatedPlatforms.hasOwnProperty(idPlatform)) {
        userWithPlatform = JSON.stringify(user);
        return false;
      }
      return true;
    });

    return userWithPlatform;
  }

  // // ReadUserByPlatform returns the user stored in the world state with given platform id.
  async ReadUserByName(ctx, orgName) {
    const allUsers = await this.GetAllUsers(ctx);
    const allUsersObj = JSON.parse(allUsers);
    let userWithName = "";
    allUsersObj.every(user => { // source: https://masteringjs.io/tutorials/fundamentals/foreach-break
      if (user.Organization === orgName) {
        userWithName= JSON.stringify(user);
        return false;
      }
      return true;
    });

    return userWithName;
  }


  // RegisterPlatform registers a new platform and associated devices to all users related with it
  async RegisterPlatform(ctx, idPlatform, id) {

    let platformUser = await this.ReadUser(ctx, id);
    platformUser = JSON.parse(platformUser);
    const exists = await this.UserExists(ctx, id);
    if (!exists) {
      throw new Error(`The user ${platformUser} does not exist`);
    }

    if (!platformUser.AssociatedPlatforms) {
      platformUser.AssociatedPlatforms = {};
    }

    if (platformUser.AssociatedPlatforms.hasOwnProperty(idPlatform)) {
      throw new Error(`The platform ${idPlatform} is already registered`);
    }

    platformUser.AssociatedPlatforms[idPlatform] = [];
    let result = ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(platformUser))));
    // }
    return result;
  }

  // RemovePlatform removes a platform and associated devices from a user
  async RemovePlatform(ctx, idPlatform, id) {

    let platformUser = await this.ReadUser(ctx, id);
    platformUser = JSON.parse(platformUser);
    const exists = await this.UserExists(ctx, id);
    if (!exists) {
      throw new Error(`The user ${platformUser} does not exist`);
    }

    if (platformUser.AssociatedPlatforms[idPlatform].length > 0){
      throw new Error(`The platform ${idPlatform} is not empty`);
    }

    if (!platformUser.AssociatedPlatforms) {
      platformUser.AssociatedPlatforms = {};
    }

    if (!(platformUser.AssociatedPlatforms.hasOwnProperty(idPlatform))) {
      throw new Error(`The platform ${idPlatform} is not registered`);
    }

    delete platformUser.AssociatedPlatforms[idPlatform];
    let result = ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(platformUser))));
    // }
    return result;
  }


  // RegisterDevice updates an existing user's resource list on associated platforms
  async RegisterDevice(ctx, idDevice, idPlatform, user_id) {

    let currentUser = await this.ReadUser(ctx, user_id);
    currentUser = JSON.parse(currentUser);
    if (!currentUser.AssociatedPlatforms.hasOwnProperty(idPlatform)) {
      throw new Error(`The platform ${idPlatform} is not registered in user ${user_id}`);
    }

    let id = currentUser.ID;
    let included = currentUser.AssociatedPlatforms[idPlatform].includes(idDevice);

    if (included) {
      throw new Error(`The device ${idDevice} is already registered`);
    }

    currentUser.AssociatedPlatforms[idPlatform].push(idDevice);
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
  }


    // RemoveDevice removes device fron an existing user's resource list on associated platforms
    async RemoveDevice(ctx, idDevice, idPlatform) {

      let currentUser = await this.ReadUserByPlatform(ctx, idPlatform);
      if (!currentUser) {
        throw new Error(`The platform ${idPlatform} is not registered in any user`);
      }

      currentUser = JSON.parse(currentUser);
      let id = currentUser.ID;
      let included = currentUser.AssociatedPlatforms[idPlatform].includes(idDevice);

      if (!included) {
        throw new Error(`The device ${idDevice} is not registered`);
      }

      let resource = await ctx.stub.invokeChaincode('products', ['GetResource', idDevice], 'mychannel');
      resource = resource.payload.toString('utf8');
      resource=JSON.parse(resource);
      let tbp= Date.now();
      if (resource.fed_id.length>0 && tbp<resource.Hr){
        throw new Error(`User ${id} has resources on Federation marketplace.`);
      }

      const index = currentUser.AssociatedPlatforms[idPlatform].indexOf(idDevice);
      currentUser.AssociatedPlatforms[idPlatform].splice(index, 1);

      await ctx.stub.invokeChaincode('products', ['UpdateResource2', idDevice], 'mychannel');
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
    }

    async RemoveFedFromUser(ctx, id, fed_id) {

      let currentUser = await this.ReadUser(ctx, id);
      currentUser = JSON.parse(currentUser);
      const index = currentUser.Feds.indexOf(fed_id);
      currentUser.Feds.splice(index, 1);
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
    }

    // RemoveDevice removes device fron an existing user's resource list on associated platforms
    async RemovePlatformResources(ctx, idPlatform) {

      let currentUser = await this.ReadUserByPlatform(ctx, idPlatform);
      if (!currentUser) {
        throw new Error(`The platform ${idPlatform} is not registered in any user`);
      }

      currentUser = JSON.parse(currentUser);
      let id = currentUser.ID;

      if (currentUser.AssociatedPlatforms[idPlatform].length === 0) {
        throw new Error(`Resources not found in platform with id ${idPlatform}`);
      }

      currentUser.AssociatedPlatforms[idPlatform] = [];
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(currentUser))));
    }

    async isEmpty(obj) { 
      for (var x in obj) { return false; }
      return true;
   }

  // DeleteUser deletes an given user from the world state.
  async DeleteUser(ctx, id) {
    const exists = await this.UserExists(ctx, id);
    if (!exists) {
      throw new Error(`The user ${id} does not exist`);
    }

    let existingTokens = await ctx.stub.invokeChaincode('products', ['AssetExists', id], 'mychannel'); //invoke func from another CC
    existingTokens = existingTokens.payload.toString('utf8');
    existingTokens = JSON.parse(existingTokens);

    if (existingTokens==true) {
      throw new Error(`Tokens exist for user ${id}.`);
    }
    
    let currentUser = await this.ReadUser(ctx, id);
    currentUser=JSON.parse(currentUser);
    if (currentUser.Fed_owner==true){
      throw new Error(`User ${id} is a Federation owner.`);
    }

    let assocPlatEmpty=await this.isEmpty(currentUser.AssociatedPlatforms);
    if (assocPlatEmpty){
      if (currentUser.Feds.length>0){
        for (var i=0;i<currentUser.Feds.length;i++){
          await ctx.stub.invokeChaincode('federationsmanage', ['LeaveFed', id,currentUser.Feds[i]], 'mychannel');
        }
      }
      if (currentUser.ActiveProducts.length>0){
        for (var i=0;i<currentUser.ActiveProducts.length;i++){
          await ctx.stub.invokeChaincode('products', ['DeleteProduct', currentUser.ActiveProducts[i],id], 'mychannel');
        }
      }
      await ctx.stub.deleteState(id);
      return 0;
    }else{
      return currentUser;
    }
  }

    // DeleteUser deletes an given user from the world state.
    async DeleteUser2(ctx, id) {
      await ctx.stub.deleteState(id);
      return 0;
    }

  // UserExists returns true when user with given ID exists in world state.
  async UserExists(ctx, id) {
    const userJSON = await ctx.stub.getState(id);
    return userJSON && userJSON.length > 0;
  }
  async UserOrgExists(ctx, org) {
    let allUsers = await this.GetAllUsers(ctx);
    allUsers=JSON.parse(allUsers);
    for (var i=0;i<allUsers.length;i++){
      if (allUsers[i].Organization==org){
        return 0;
      }
    }
    return 1;
  }

  // // TransferAsset updates the owner field of asset with given id in the world state.
  // async TransferAsset(ctx, id, newOwner) {
  //     const assetString = await this.ReadAsset(ctx, id);
  //     const asset = JSON.parse(assetString);
  //     const oldOwner = asset.Owner;
  //     asset.Owner = newOwner;
  //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
  //     await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
  //     return oldOwner;
  // }

  // GetAllAsstes returns all assets found in the world state.
  async GetAllUsers(ctx) {
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
      return JSON.stringify(allResults);
  }


  // GetMails returns the email of all the voters
  async GetMails(ctx, votes){

    let votesJSON = JSON.parse(votes);
    let voters = Object.keys(votesJSON);

    const mails = [];

    for (const v of voters) {
      let user = await this.ReadUser(ctx, v);
      user = JSON.parse(user);
      mails.push(user['Mail']);
    }

    return mails;

  }

  // GetAverageUserReputation calculates average user reputation
  async GetAverageUserReputation(ctx){

    const allUsers = await this.GetAllUsers(ctx);
    const allUsersObj = JSON.parse(allUsers);
    let averageUserRep;

    if (allUsersObj) {
      let userRepSum = 0;
      let numOfUsers = allUsersObj.length;

      for (const user of allUsersObj) {
        userRepSum += user.Reputation;
      }

      averageUserRep = userRepSum/numOfUsers;

    }

    else {
      averageUserRep = 0.5;
    }

    return averageUserRep;
  }

}

module.exports = UserManage;
