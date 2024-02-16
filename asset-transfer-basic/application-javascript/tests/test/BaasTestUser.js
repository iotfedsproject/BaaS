/*
   Copyright 2022 Mohammad Faisal Khatri

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const request = require('supertest');
const expect = require('chai').expect;
const userRegister = require('../testdata/userRegister.json');

const booking = require('../testdata/booking.json');
const userauthdata = require('../testdata/userauthdata.json');
const updatedbooking = require('../testdata/updatedbooking.json');

// describe('Restful Booker API Tests', () => {
//     const baseurl = 'https://restful-booker.herokuapp.com';
//     var bookingId;
//     var token;
//
//     before(function(done) {
//         request(baseurl)
//             .post('/auth')
//             .send(userauthdata)
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(200);
//                 expect(res.body.token).not.to.be.null;
//                 token = res.body.token;
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
//
//
//     it('should successfully create a booking', (done) => {
//         request(baseurl)
//             .post('/booking')
//             .send(booking)
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(200);
//                 expect(res.body.bookingid).not.to.be.null;
//                 expect(res.body.booking.firstname).to.be.equal(booking.firstname);
//                 expect(res.body.booking.lastname).to.be.equal(booking.lastname);
//                 expect(res.body.booking.totalprice).to.be.equal(booking.totalprice);
//                 expect(res.body.booking.depositpaid).to.be.equal(booking.depositpaid);
//                 expect(res.body.booking.bookingdates.checkin).to.be.equal(booking.bookingdates.checkin);
//                 expect(res.body.booking.bookingdates.checkout).to.be.equal(booking.bookingdates.checkout);
//                 expect(res.body.booking.additionalneeds).to.be.equal(booking.additionalneeds);
//                 bookingId = res.body.bookingid;
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
// //
//     it('should fetch the booking of the provided booking id', (done) => {
//         request(baseurl)
//             .get('/booking/' + bookingId)
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(200);
//                 expect(res.body.firstname).to.be.equal(booking.firstname);
//                 expect(res.body.lastname).to.be.equal(booking.lastname);
//                 expect(res.body.totalprice).to.be.equal(booking.totalprice);
//                 expect(res.body.depositpaid).to.be.equal(booking.depositpaid);
//                 expect(res.body.bookingdates.checkin).to.be.equal(booking.bookingdates.checkin);
//                 expect(res.body.bookingdates.checkout).to.be.equal(booking.bookingdates.checkout);
//                 expect(res.body.additionalneeds).to.be.equal(booking.additionalneeds);
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
//
//     it('should update the booking of the provided booking id using Put request', (done) => {
//         request(baseurl)
//             .put('/booking/' + bookingId)
//             .send(updatedbooking)
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .set('Cookie', 'token=' + token)
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(200);
//                 expect(res.body.firstname).to.be.equal(updatedbooking.firstname);
//                 expect(res.body.lastname).to.be.equal(updatedbooking.lastname);
//                 expect(res.body.totalprice).to.be.equal(updatedbooking.totalprice);
//                 expect(res.body.depositpaid).to.be.equal(updatedbooking.depositpaid);
//                 expect(res.body.bookingdates.checkin).to.be.equal(updatedbooking.bookingdates.checkin);
//                 expect(res.body.bookingdates.checkout).to.be.equal(updatedbooking.bookingdates.checkout);
//                 expect(res.body.additionalneeds).to.be.equal(updatedbooking.additionalneeds);
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
//
//     it('should update the firstname and lastname of booking of the provided booking id', (done) => {
//         var firstname = 'Michael';
//         var lastname = 'Trenor';
//         request(baseurl)
//             .patch('/booking/' + bookingId)
//             .send({ firstname: firstname, lastname: lastname })
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .set('Cookie', 'token=' + token)
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(200);
//                 expect(res.body.firstname).to.be.equal(firstname);
//                 expect(res.body.lastname).to.be.equal(lastname);
//                 expect(res.body.totalprice).to.be.equal(updatedbooking.totalprice);
//                 expect(res.body.depositpaid).to.be.equal(updatedbooking.depositpaid);
//                 expect(res.body.bookingdates.checkin).to.be.equal(updatedbooking.bookingdates.checkin);
//                 expect(res.body.bookingdates.checkout).to.be.equal(updatedbooking.bookingdates.checkout);
//                 expect(res.body.additionalneeds).to.be.equal(updatedbooking.additionalneeds);
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
//
//     it('should Delete the booking of the provided booking id', (done) => {
//         request(baseurl)
//             .delete('/booking/' + bookingId)
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .set('Cookie', 'token=' + token)
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(201);
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
//     it('should show 404 status code for deleted booking id', (done) => {
//         request(baseurl)
//             .get('/booking/' + bookingId)
//             .set('Accept', 'application/json')
//             .set('Content-Type', 'application/json')
//             .end(function(err, res) {
//                 expect(res.statusCode).to.be.equal(404);
//                 if (err) {
//                     throw err;
//                 }
//                 done();
//             });
//     });
// });

describe('Restful BaaS API tests', () => {
    const baseurl = 'http://localhost:8800/baas';
    // var bookingId;
    // var token;

    before(function() {
      this.timeout(10000); // Set a timeout of 5 seconds for all tests
}   );

    it('should successfully register a user', (done) => {
        request(baseurl)
            .post('/user/register_user')
            .send(userRegister)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should fetch the user with the provided id', (done) => {
        request(baseurl)
            .get('/user/get_user_info')
            .query({user_id: userRegister.id})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                expect(res.body.ID).to.be.equal(userRegister.id);
                expect(res.body.Role).to.be.equal(userRegister.role);
                expect(res.body.Mail).to.be.equal(userRegister.mail);
                expect(res.body.Organization).to.be.equal(userRegister.organization);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should fetch all users', (done) => {
        request(baseurl)
            .get('/user/get_all_user_info')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should Delete the user with the provided id', (done) => {
        request(baseurl)
            .delete('/user/delete_user')
            .send({user_id: userRegister.id})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            // .set('Cookie', 'token=' + token)
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                expect(res.body.ID).to.be.equal(userRegister.id);
                expect(res.body.Role).to.be.equal(userRegister.role);
                expect(res.body.Mail).to.be.equal(userRegister.mail);
                expect(res.body.Organization).to.be.equal(userRegister.organization);
                if (err) {
                    throw err;
                }
                done();
            });
    });
    it('should show 403 status code for deleted user', (done) => {
        request(baseurl)
            .get('/user/get_user_info')
            .query({user_id: userRegister.id})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(403);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should successfully register a user', (done) => {
        request(baseurl)
            .post('/user/register_user')
            .send(userRegister)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should update the balance of the provided user id by adding the transactionFee', (done) => {
        var idTransaction = userRegister.id;
        var transactionFee = 300;
        request(baseurl)
            .patch('/user/update_user_balance')
            .send({ id: idTransaction, transaction_fee: transactionFee })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            // .set('Cookie', 'token=' + token)
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should successfully register a platform to a user', (done) => {
        request(baseurl)
            .post('/user/register_platform')
            .send({platform_id: "vicinity", assoc_user_id:"gpapadop"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('should successfully register a device to a users platform', (done) => {
        request(baseurl)
            .post('/user/register_device')
            .send({platform_id:"vicinity", device_id: "device23"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                if (err) {
                    throw err;
                }
                done();
            });
    });


    it('should Delete the user with the provided id', (done) => {
        request(baseurl)
            .delete('/user/delete_user')
            .send({user_id: userRegister.id})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            // .set('Cookie', 'token=' + token)
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                expect(res.body.ID).to.be.equal(userRegister.id);
                expect(res.body.Role).to.be.equal(userRegister.role);
                expect(res.body.Mail).to.be.equal(userRegister.mail);
                expect(res.body.Organization).to.be.equal(userRegister.organization);
                if (err) {
                    throw err;
                }
                done();
            });
    });
  });
