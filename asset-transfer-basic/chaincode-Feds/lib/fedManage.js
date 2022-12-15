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
const Voting = require('./voting');
// const util = require('util'); // for object comparison


// const { Gateway, Wallets} = require('fabric-network');
// const gateway = new Gateway();
// const channelName = 'mychannel';
// const chaincodeNameUser = 'basic';
// // Build a network instance based on the channel where the smart contract is deployed
// const network = gateway.getNetwork(channelName);
//
// // Get the contract from the network.
// const contractUser = network.getContract(chaincodeNameUser);


class FedManage extends Contract {

  constructor(){super();};


  async InitLedger(ctx) {
      const assets = [
        {
          ID: 'archived votings',
          docType: 'archived votings',
          votings:{}
        },
        {
          ID: 'fed1',
          docType: 'fed',
          creator_id: "evathana",
          inf_model: "BIM",
          related_applications: [],
          members_ids: ["evathana", "spolymeni", "gspanos"],
          rules: {
            IoTFedsRules: {
              FedTypeRules: {
                Type: "Providers",
                DataAvailaiability: "Closed",
                ServiceType: "Energy, Health, Environment",
                SupportedOntologies: "Smart Environment, Smart City"
              },
              FedGov: {
                BoardGov: ["evathana", "spolymeni", "gspanos"],
                Proposals: ["InviteMember", "JoinRequest", "RequestRemove", "ChangeRule", "DeleteFed"],
                VoteRules: {
                  Tokens: 50,
                  Type: {
                    ApprovalPercentage: 75,
                    Base: "Board"
                  }
                }
              },
              QualityAssuranceMetrics: {
                  QoSPercentage: 60,
                  ReputationPercentage: 40,
                  Quality: {
                    MinValueFed: 6
                  },
                  Underperformance: "RequestRemove"
              },
              FedMarketplace: {
                ChargePolicy: "Free",
                FedProduct: "Packaging",
                ProfitPolicy: "PerSource",
                Coin: "IoTFeds"
              }
            }
          }
        },
        {
          ID: 'fed2',
          docType: 'fed',
          creator_id: "spolymeni",
          inf_model: "BIM",
          related_applications: [],
          members_ids: ["spolymeni"],
          rules:{
            IoTFedsRules: {
              FedTypeRules: {
                Type: "Providers",
                DataAvailaiability: "Closed",
                ServiceType: "Energy, Health, Environment",
                SupportedOntologies: "Smart Environment, Smart City"
              },
              FedGov: {
                BoardGov: ["spolymeni"],
                Proposals: ["InviteMember", "JoinRequest", "RequestRemove", "ChangeRule", "DeleteFed"],
                VoteRules: {
                  Tokens: 50,
                  Type: {
                    ApprovalPercentage: 75,
                    Base: "Board"
                  }
                }
              },
              QualityAssuranceMetrics: {
                  QoSPercentage: 60,
                  ReputationPercentage: 40,
                  Quality: {
                    MinValueFed: 6
                  },
                  Underperformance: "RequestRemove"
              },
              FedMarketplace: {
                ChargePolicy: "Free",
                FedProduct: "Packaging",
                ProfitPolicy: "PerSource",
                Coin: "IoTFeds"
              }
            }
          }
        },
        {
          ID: 'fed3',
          docType: 'fed',
          creator_id: "gspanos",
          inf_model: "BIM",
          related_applications: [],
          members_ids: ["gspanos"],
          rules:{
            IoTFedsRules: {
              FedTypeRules: {
                Type: "Providers",
                DataAvailaiability: "Closed",
                ServiceType: "Energy, Health, Environment",
                SupportedOntologies: "Smart Environment, Smart City"
              },
              FedGov: {
                BoardGov: ["gspanos"],
                Proposals: ["InviteMember", "JoinRequest", "RequestRemove", "ChangeRule", "DeleteFed"],
                VoteRules: {
                  Tokens: 50,
                  Type: {
                    ApprovalPercentage: 75,
                    Base: "Board"
                  }
                }
              },
              QualityAssuranceMetrics: {
                  QoSPercentage: 60,
                  ReputationPercentage: 40,
                  Quality: {
                    MinValueFed: 6
                  },
                  Underperformance: "RequestRemove"
              },
              FedMarketplace: {
                ChargePolicy: "Free",
                FedProduct: "Packaging",
                ProfitPolicy: "PerSource",
                Coin: "IoTFeds"
              }
            }
          }
        }
      ];

      for (const asset of assets) {
        // fed.docType = 'fed';
        // example of how to write to world state deterministically
        // use convetion of alphabetic order
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
        await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
      }
    }


  // CreateFed creates a new federation to the world state with given details.
  // TODO: Decide if related applications argument is needed as input or is declared as empty
  async CreateFed(ctx, fed_id, creator_id, inf_model, related_applications, rules) {
      const exists = await this.AssetExists(ctx, fed_id);
      if (exists) {
          throw new Error(`The federation with id ${fed_id} already exists`);
      }

      const fed = {
          ID: fed_id,
          docType: 'fed',
          creator_id: creator_id,
          members_ids: [creator_id],
          inf_model: inf_model,
          related_applications: related_applications,
          rules: JSON.parse(rules) //https://www.javascripttutorial.net/object/3-ways-to-copy-objects-in-javascript/
      };

      //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      await ctx.stub.putState(fed_id, Buffer.from(stringify(sortKeysRecursive(fed))));
      return JSON.stringify(fed);

  }


  //  returns the federation stored in the world state with given id.
  async ReadAsset(ctx, id) {
      const assetJSON = await ctx.stub.getState(id); // get the fed from chaincode state
      if (!assetJSON || assetJSON.length === 0) {
        throw new Error(`The asset with id ${id} does not exist`);
      }

      return assetJSON.toString();
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


  // DeleteFed deletes a given federation from the world state.
  // TODO: Check for any other conditions before deleting a federation
  async DeleteFed(ctx, fed_id, request_user_id) {
    const exists = await this.AssetExists(ctx, fed_id);
    if (!exists) {
      throw new Error(`The federation with id: ${id} does not exist`);
    }
    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);

    // if (currentFed.creator_id !== request_user_id){
    //   throw new Error('Only the creator of the federation can delete it.');
    // }

    // if (currentFed.members_ids.length){
    //   throw new Error('This federation still contains members and cannot be deleted.');
    // }

    await ctx.stub.deleteState(fed_id);
    return currentFed;
  }


// User can leave fedearation on his own, as long as he is allowed to
async LeaveFed(ctx, user_id, fed_id) {

  let canLeave = this.CheckLeaveFed(ctx, user_id, fed_id);
  if (canLeave) {

    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);

    if (!currentFed.members_ids.includes(user_id)) {
      throw new Error(`The user ${user_id} is not registered in federation ${fed_id}`);
    }


    currentFed['members_ids'] = currentFed['members_ids'].filter(e => e !== user_id); // drop user
    await ctx.stub.putState(fed_id, Buffer.from(stringify(sortKeysRecursive(currentFed))));
    return currentFed;

  }
}

// Checks if another voting is currently active for a federation
async FedHasActiveVoting(ctx, fedId) {

  let openVotings = await this.GetAllAssetsOfType(ctx, 'voting');
  openVotings = JSON.parse(openVotings);
  let votingForFed = openVotings.filter( (voting) => voting.federation === fedId); // filter by fed

  if (!votingForFed.length) {
    return false;
  }
  else {
    return true;
  }

}


  // addFedMemberRequest creates a request to add a member to a federation, by creating a voting procedure
  async AddFedMemberRequest(ctx, requestor_id, fed_id, member_id){

    const exists = await this.AssetExists(ctx, fed_id);
    if (!exists) {
      throw new Error(`The federation with id: ${fed_id} does not exist`);
    }

    // source: https://bitbucket.org/beyondi-bbd/workspace/snippets/7n5MoM
    let userExistsInvoke = await ctx.stub.invokeChaincode('basic', ['UserExists', member_id], 'mychannel'); //invoke func from another CC
    let userExists = userExistsInvoke.payload.toString('utf8'); //read payload response and convert to string
    userExists = (userExists === 'true'); // convert to boolean

    if (!userExists) {
      throw new Error('User does not exist');
    }

    let hasVoting = await this.FedHasActiveVoting(ctx, fed_id);
    if (hasVoting) {
      throw new Error('There is already an ongoing voting for this federation');
    }

    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);

    if (!(currentFed.members_ids.includes(requestor_id) || (requestor_id === member_id))) {
       throw new Error('Candidate must choose fed to join, or be invited by a fed member');
    }

    if (currentFed.members_ids.includes(member_id)) {
       throw new Error('This member is already a member of this federation.');
    }

    let members;

    if (currentFed.rules.IoTFedsRules.FedGov.VoteRules.Type.Base == 'Board'){

      members = currentFed.rules.IoTFedsRules.FedGov.BoardGov;

    }

    else {

      members = currentFed.members_ids;
    }

    let v_id = Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);
    let requestorName = await this.GetUsernameByID(ctx, requestor_id);
    let memberName = await this.GetUsernameByID(ctx, member_id);

    let description = {
      votingType: "addition",
      requestorID: requestorName,
      memberID: memberName,
      fedID: fed_id
    };


    // TODO: Maybe replace ids with names in the description argument to make it more intuitive
    let voting = new Voting().CreateVoting(ctx, v_id, fed_id, members, description);

    return voting;

  }


  // RemoveFedMemberRequest creates a request to remove a member from a federation, by creating a voting procedure
  async RemoveFedMemberRequest(ctx, requestor_id, member_id, fed_id) {


    const exists = await this.AssetExists(ctx, fed_id);
    if (!exists) {
      throw new Error(`The federation with id: ${fed_id} does not exist`);
    }

    let hasVoting = await this.FedHasActiveVoting(ctx, fed_id);
    if (hasVoting) {
      throw new Error('There is already an ongoing voting for this federation');
    }

    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);

    if (!(currentFed.members_ids.includes(requestor_id))) {
       throw new Error('Only other fed members can propose the removal of a fed member');
    }

    if (!currentFed.members_ids.includes(member_id)){
       throw new Error('This user is not a member of this federation.');
    }

    if (requestor_id === member_id){
       throw new Error('A memeber cannot propose his own removal');
    }

    let members;


    if (currentFed.rules.IoTFedsRules.FedGov.VoteRules.Type.Base == 'Board'){

      members = currentFed.rules.IoTFedsRules.FedGov.BoardGov;

    }

    else {

      members = currentFed.members_ids
    }

    let memberToRemove = members.indexOf(member_id);
    members.splice(memberToRemove,1);
    let v_id = Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);

    let canLeave = this.CheckLeaveFed(ctx, member_id, fed_id);
    if (!canLeave) {
      throw new Error('This member is restricted from leaving this federation at the moment');
    }

    let requestorName = await this.GetUsernameByID(ctx, requestor_id);
    let memberName = await this.GetUsernameByID(ctx, member_id);

    let description = {
      votingType: "removal",
      requestorID: requestorName,
      memberID: memberName,
      fedID: fed_id
    };

    let voting = new Voting().CreateVoting(ctx, v_id, fed_id, members, description);

    return voting;
  }



  async UpdateFedRulesRequest(ctx, requestor_id, fed_id, proposed_rules){

    const exists = await this.AssetExists(ctx, fed_id);
    if (!exists) {
      throw new Error(`The federation with id: ${fed_id} does not exist`);
    }

    let hasVoting = await this.FedHasActiveVoting(ctx, fed_id);
    if (hasVoting) {
      throw new Error('There is already an ongoing voting for this federation');
    }

    // let proposedRules = JSON.parse(proposed_rules);
    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);

    if (!(currentFed.members_ids.includes(requestor_id))) {
       throw new Error('Only a member of the federation can propose to change its rules');
    }

    let currentRules = currentFed.rules;
    let proposedRules = JSON.parse(proposed_rules)
    // if (util.isDeepStrictEqual(proposed_rules, currentRules)) {

    function stringsHaveIdenticalChars(s1, s2) {
        if (s1.length != s2.length) {
              return false;
        }

        let i = s1.length + 1;
        while (i--) {
            if (s2.indexOf(s1[i]) >= 0) {
                s2.splice(s2.indexOf(s1[i]), 1);
            }
        }

        if (s2.length > 0) {
            return false;
        }
        else {
            return true
        }
    }


    if (stringsHaveIdenticalChars(JSON.stringify(proposedRules).split(''), JSON.stringify(currentRules).split(''))) {
      throw new Error('Proposed rules are same as existing ones');
    }

    let members;

    if (currentFed.rules.IoTFedsRules.FedGov.VoteRules.Type.Base == 'Board'){

      members = currentFed.rules.IoTFedsRules.FedGov.BoardGov;

    }

    else {

      members = currentFed.members_ids;
    }


    function findDifferentRule(obj1, obj2) {
      let fieldsArrayObj1 = [];
      let fieldsArrayObj2 = [];
      for (const key of Object.keys(obj1["IoTFedsRules"])) {
          fieldsArrayObj1.push(obj1["IoTFedsRules"][key]);
          fieldsArrayObj2.push(obj2["IoTFedsRules"][key]);
      }
      for (let i=0; i<fieldsArrayObj2.length; i++) {
          for (const key of Object.keys(fieldsArrayObj2[i])) {
              // console.log(JSON.stringify(fieldsArrayObj2[i][key]) === JSON.stringify(fieldsArrayObj1[i][key]));
            if (JSON.stringify(fieldsArrayObj2[i][key]) != JSON.stringify(fieldsArrayObj1[i][key])) {
                let finalObj = {"changedField": key, "proposed": fieldsArrayObj2[i][key], "current": fieldsArrayObj1[i][key]};
                return finalObj;
            }
          }
      }
    }


    let finObj = findDifferentRule(currentRules, proposedRules);

    if (finObj.changedField === 'VoteRules') {
      let propTokens = finObj.proposed.Tokens;
      let currTokens = finObj.current.Tokens;
      // console.log(propTokens, currTokens);
      let propPerc = finObj.proposed.Type.ApprovalPercentage;
      let currPerc = finObj.current.Type.ApprovalPercentage;
      let propBase = finObj.proposed.Type.Base;
      let currBase = finObj.current.Type.Base;
      if (propTokens != currTokens) {
          finObj.changedField = 'VoteRules, Tokens'
          finObj.proposed = propTokens;
          finObj.current = currTokens;
      }
      else if (propPerc != currPerc) {
          finObj.changedField = 'VoteRules, approval percentage'
          finObj.proposed = propPerc;
          finObj.current = currPerc;
      }
      else {
          finObj.changedField = 'VoteRules, Base'
          finObj.proposed = propBase;
          finObj.current = currBase;
      }
    }

  if (finObj.changedField === 'Quality') {
      let propValue = finObj.proposed.MinValueFed;
      let currValue = finObj.current.MinValueFed;
      finObj.changedField = 'Quality, MinValueFed'
      finObj.proposed = propValue;
      finObj.current = currValue;
  }


    let v_id = Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);
    let requestorName = await this.GetUsernameByID(ctx, requestor_id);

    let description = {
      votingType: "rule change",
      requestorID: requestorName,
      proposedRules: finObj,
      fedID: fed_id
    };

    let voting = new Voting().CreateVoting(ctx, v_id, fed_id, members, description);

    return voting;

  }


  async GetVotingDescription(ctx, voting_id, voter_id) {

    const exists = await this.AssetExists(ctx, voting_id);
    if (!exists) {
      throw new Error(`The voting with id: ${voting_id} does not exist`);
    }

    let currentVoting = await this.ReadAsset(ctx, voting_id);
    currentVoting = JSON.parse(currentVoting);
    let currentVotingMembers = Object.keys(currentVoting["votes"]);

    if (!currentVotingMembers.includes(voter_id)) {
      throw new Error(`There is no voter with id: ${voter_id}, eligible to vote in this voting`);
    }

    let votingDescription = JSON.stringify(currentVoting["descr"]);
    return votingDescription;
  }

  async GetUsernameByID(ctx, user_id) {
    let userInvoke = await ctx.stub.invokeChaincode('basic', ['ReadUser', user_id], 'mychannel'); //invoke func from another CC
    let user = userInvoke.payload.toString('utf8'); //read payload response and convert to string
    let userObj = JSON.parse(user);
    return userObj.Organization;
  }



  // checkLeaveFed returns true when a user is eligible to leave a federation
  async CheckLeaveFed(ctx, user_id, fed_id) {

    // TODO: To be filled with rule checks, probably user manage contracts will need to be invoked too

    return true;
  }


  // AssetExists returns true when a federation with given ID exists in world state.
  async AssetExists(ctx, asset_id) {
    const assetJSON = await ctx.stub.getState(asset_id);
    return assetJSON && assetJSON.length > 0;
  }


}

module.exports = FedManage;
