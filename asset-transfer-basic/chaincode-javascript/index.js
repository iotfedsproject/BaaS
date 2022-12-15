/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const userManage = require('./lib/userManage');

module.exports.UserManage = userManage;
module.exports.contracts = [userManage];
