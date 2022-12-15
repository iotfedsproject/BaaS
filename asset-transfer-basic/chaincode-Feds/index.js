/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fedManage = require('./lib/fedManage');
const voting = require('./lib/voting');

module.exports.FedManage = fedManage;
module.exports.Voting = voting;

module.exports.contracts = [fedManage, voting];
