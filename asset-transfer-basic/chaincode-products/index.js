/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const products = require('./lib/products');
// const safeAccess = require('./lib/safeAccess');
const marketplace = require('./lib/marketplace');


module.exports.Products = products;
// module.exports.SafeAccess = safeAccess;
module.exports.Marketplace = marketplace;


module.exports.contracts = [products, marketplace];
