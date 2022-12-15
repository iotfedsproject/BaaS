const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { resolveSoa } = require("dns");
const app = express();
var request = require('request');

const domain = require('../config');


app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// let IDvoting, IDvoter; // need thses globally
let token;

app.get(`/`, (req, res) => {
  // const token = req.query.token;
  // IDvoting = req.query.IDvoting;
  // IDvoter = req.query.IDvoter;
  token = req.query.token;
  // res.render("index");

  // let creds = token.split("/");
  // console.log(creds);
  // IDvoting = creds[0];
  // IDvoter = creds[1];

  let getVotingOptions = {
    'method': 'GET',
    'url': `http://localhost:${domain.SERVER_PORT}/baas/federation/get_voting_description`,
    'headers': {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "token": token
    })
  };

  request(getVotingOptions, function (error, response) {
    // console.log(response.body);
    if (response.body.includes('token')) {
      res.render('invalid_token');
      console.log('Invalid token');
    }

    else {
      const descr = JSON.parse(response.body);
      console.log(descr);
      res.render('content', {
          descr: descr
      });
    }

  });
});


app.post("/castBallot", (req, res) => {

  let voteOptions = {
  'method': 'POST',
  'url': `http://localhost:${domain.SERVER_PORT}/baas/voting/vote`,
  'headers': {
    'Content-Type': 'application/json'
  },
  // TODO: These should be automated (especially vote from front end)
  body: JSON.stringify({
    "token": token,
    "vote": req.body.vote
  })

  };
  request(voteOptions, function (error, response) {
    console.log(response.body);
    if (response.body.includes('failed')) {
      console.log("Failed");
      res.render("failure");
    }
    else {
      console.log(response.body);
      res.render("success");
    }
  });
});



app.listen(domain.CLIENT_PORT, () => {
    console.log(`Example app listening at http://localhost:${domain.CLIENT_PORT}`)
  })
