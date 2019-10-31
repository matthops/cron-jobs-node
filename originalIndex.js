const cron = require('node-cron');
const express = require('express');
const send = require('./send');
const massive = require('massive');
const bodyParser = require('body-parser');
const nexmoController = require('./send.js');
const SMSThrottler = require('./throttler');
const Nexmo = require('nexmo');
const plaid = require('plaid');
require('dotenv').config();

const { CONNECTION_STRING, NEXMO_API_KEY, NEXMO_API_SECRET } = process.env;

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET
});

const {
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  REACT_APP_PLAID_PUBLIC_KEY,
  NUMBER_TO,
  NUMBER_FROM
} = process.env;

const client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  REACT_APP_PLAID_PUBLIC_KEY,
  plaid.environments.development
);

const throttler = new SMSThrottler({
  nexmoInstance: nexmo,
  accountOptions: { minTime: 2000 }
});

const from = NUMBER_FROM;
const to = NUMBER_TO;

function completed(err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('completed', result);
  }
}

const getSum = (total, num) => {
  return total + num;
};

const app = express();

app.use(bodyParser.json());

massive(CONNECTION_STRING).then(db => {
  app.set('db', db);
  console.log('db connected');
  let objArr = [];

  db.get_rules().then(results => {
    results.forEach(rule => {
      db.get_item(rule.user_id).then(response => {
        client.getTransactions(
          response[0].access_token,
          '2019-10-12',
          '2019-10-25',
          {
            count: 25,
            offset: 0
          },
          (err, response) => {
            if (err) {
              console.log('error', err);
            }
            let transactions = response.transactions;
            let countArr = [];

            transactions.forEach(transaction => {
              transaction.category.forEach(catArr =>
                catArr.includes(rule.category)
                  ? countArr.push(transaction.amount)
                  : null
              );
            });

            const text = `This week, you spent $${countArr
              .reduce(getSum, 0)
              .toLocaleString()} on ${rule.category}`;
            console.log('texttexttext', text);
            objArr.push({ from, to, text, callback: completed });
            if (objArr.length === results.length) {
              for (let i = 0; i < objArr.length; ++i) {
                throttler.queue(objArr[i]);
              }
            }
          }
        );
      });
    });
  });
});

console.log('HITTING THE SERVER');

app.listen(3128, () => console.log('listening on port 3128'));
