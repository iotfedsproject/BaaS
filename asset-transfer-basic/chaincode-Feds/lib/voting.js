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
const FedManage = require('./fedManage.js');

// const {sendmail} = require('../nodemailer/nodemailer/app');
// const { setTimeout: setTimeoutPromise } = require('node:timers/promises');
// const cron = require("node-cron");


class Voting extends Contract {

// CreateVoting creates a new voting to the world state with given details.
  async CreateVoting(ctx, v_id, fed_id, members, description) {

    let voters = {};

    for (let i=0; i<members.length; i++){
      let voter = members[i];

      voters[voter] = "pending";

    };

    let startDate = new Date().getTime();
    // let endDate = startDate + 1000*60 // debug duration one minute
    let endDate = startDate + 1000*60*60*24 // deployment duration one day

    const voting =
      {

        ID: v_id,
        docType: 'voting',
        federation: fed_id,
        descr: description,
        status: true,
        startDate: startDate,
        endDate: endDate,
        votes:voters //get voters from federation
    };

    //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(v_id, Buffer.from(stringify(sortKeysRecursive(voting))));

    return JSON.stringify(voting);
  }


  // Vote registers the vote of a user in the voting object
  async Vote(ctx, v_id, voter, vote) {

    const exists = await this.AssetExists(ctx, v_id);
    if (!exists) {
      throw new Error(`The voting with id: ${v_id} does not exist`);
    }
    let currentVoting = await this.ReadAsset(ctx, v_id);
    currentVoting = JSON.parse(currentVoting);

    if (!currentVoting.votes.hasOwnProperty(voter)) {

      throw new Error(`Voter ${voter} is not elgible to vote in voting ${v_id}`);
    }

    let currentVote = currentVoting["votes"][voter];

    if (currentVote != "pending"){

      throw new Error(`Voter ${voter} has already voted and cannot vote again.`)
    }

    currentVoting["votes"][voter] = vote;

    if (!(Object.values(currentVoting['votes']).indexOf('pending') > -1)) {
      
      currentVoting = await this.TerminateVoting(ctx, currentVoting);
      // TODO: call to ICOM's endpoint
    }
    else {
      await ctx.stub.putState(v_id, Buffer.from(stringify(sortKeysRecursive(currentVoting))));
    }

    return JSON.stringify(currentVoting);
  }

  // GetVotingResult, extracts the result of a proposal once it is terminated
  async GetVotingResult(ctx, currentVoting) {

    const fedId = currentVoting['federation'];
    let currentFed = await this.ReadAsset(ctx, fedId);
    currentFed = JSON.parse(currentFed);

    const acceptancePercentage = currentFed.rules.IoTFedsRules.FedGov.VoteRules.Type.ApprovalPercentage;

    const votesArray = Object.values(currentVoting['votes']);
    const positives = votesArray.filter((v) => (v === 'yes')).length;
    const perc = (positives/votesArray.length)*100

    let votingResult = '';
    if (perc > acceptancePercentage) {
      votingResult = 'accepted';
      // TODO: modify the respected federation with the accepted proposal
      if (currentVoting.descr.votingType === 'addition') {
        await this.AcceptFedMember(ctx, currentVoting.federation, currentVoting.descr.memberID);
      }
      else if (currentVoting.descr.votingType === 'removal') {
        await this.LeaveFed(ctx, currentVoting.descr.memberID, currentVoting.federation);
      }
      else {
        await this.AcceptRuleChange(ctx, currentVoting.federation, currentVoting.descr.proposedRules);
      }
    }

    else {
      votingResult = 'rejected';
    }

    return votingResult;
  }

  // ArchiveVoting deletes a given voting from the world state, when its status is marked as completed.
  async ArchiveVoting(ctx, currentVoting, votingResult) {
    const exists = await this.AssetExists(ctx, currentVoting.ID);
    if (!exists) {
      throw new Error(`The voting with id: ${currentVoting.ID} does not exist`);
    }

    // TODO: This is always called, debug or drop it
    if (currentVoting.status){
      throw new Error('This voting is still ongoing.');
    }

    let archivedVotings = await this.ReadAsset(ctx, 'archived votings');
    archivedVotings = JSON.parse(archivedVotings);

    const archivedVoting =
      {

        docType: 'archived voting',
        federation: currentVoting['federation'],
        descr: currentVoting['descr'],
        votingResult: votingResult

    };

    archivedVotings['votings'][currentVoting.ID] = archivedVoting;

    //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState('archived votings', Buffer.from(stringify(sortKeysRecursive(archivedVotings))));
    await ctx.stub.deleteState(currentVoting.ID);
    return JSON.stringify(archivedVotings);
  }


  async TerminateVoting(ctx, voting) {

    voting['status'] = false; // deactivate voting
    let votingResult = await this.GetVotingResult(ctx, voting);
    let archivedVotings = await this.ArchiveVoting(ctx, voting, votingResult);
    // TODO: call to ICOM's endpoint

    return voting;
  }

  // AcceptFedMember adds a new member to a federation, if the voting result was positive
  async AcceptFedMember(ctx, fed_id, member_id){

    const exists = await this.AssetExists(ctx, fed_id);
    if (!exists) {
      throw new Error(`The federation with id: ${fed_id} does not exist`);
    }

    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);
    currentFed.members_ids.push(member_id);

    return ctx.stub.putState(fed_id, Buffer.from(stringify(sortKeysRecursive(currentFed))));

  };


  // AcceptFedMember adds a new member to a federation, if the voting result was positive
  async AcceptRuleChange(ctx, fed_id, new_rules) {

    const exists = await this.AssetExists(ctx, fed_id);
    if (!exists) {
      throw new Error(`The federation with id: ${fed_id} does not exist`);
    }

    let currentFed = await this.ReadAsset(ctx, fed_id);
    currentFed = JSON.parse(currentFed);
    currentFed['rules'] = new_rules;

    return ctx.stub.putState(fed_id, Buffer.from(stringify(sortKeysRecursive(currentFed))));

  }


  // TODO: These last 4 functions are defined in FedManage as well, we might be able to avoid this if Voting inherits from it


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

  // checkLeaveFed returns true when a user is eligible to leave a federation
  async CheckLeaveFed(ctx, user_id, fed_id) {

    // TODO: To be filled with rule checks, probably user manage contracts will need to be invoked too

    return true;
  }

  async CheckAllVotingsExpiration(ctx) {
    // Get all votings and find expired ones
    let dateNow = new Date().getTime();
    let openVotings = await this.GetAllAssetsOfType(ctx, 'voting');
    openVotings = JSON.parse(openVotings);
    let expiredVotings = openVotings.filter( (voting) => voting.endDate <= dateNow); // filter the expired ones

    // Terminate and archive the expired ones
    let terminatedVotings = [];
    for (const voting of expiredVotings) {
      let terminatedVoting = await this.TerminateVoting(ctx, voting);
      terminatedVotings.push(terminatedVoting);
    }

    return JSON.stringify(terminatedVotings);

  }


  // TODO: Functions below this point are also defined in fedManage.js

  // ReadAsset returns the voting stored in the world state with given id.
  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id); // get the user from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset with id ${id} does not exist`);
    }

    return assetJSON.toString();
}


  // AssetExists returns true when a voting with given ID exists in world state.
  async AssetExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
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
}

module.exports = Voting;
