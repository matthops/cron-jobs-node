const cron = require('node-cron');
const express = require('express');
const send = require('./send');
const massive = require('massive');
const bodyParser = require('body-parser');
const nexmoController = require('./send.js');
require('dotenv').config();

const { CONNECTION_STRING } = process.env;

const plaid = require('plaid');

const {
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  REACT_APP_PLAID_PUBLIC_KEY
} = process.env;

const client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  REACT_APP_PLAID_PUBLIC_KEY,
  plaid.environments.development
);

const app = express();

app.use(bodyParser.json());

massive(CONNECTION_STRING).then(db => {
  app.set('db', db);
  console.log('db connected');

  db.get_rules().then(results => {
    let categoryArr = [];
    console.log('HIT db.get_rules');

    results.forEach(e => {
      console.log(e.user_id, e.category, e.frequency);

      db.get_item(e.user_id).then(response => {
        client.getTransactions(
          response[0].access_token,
          '2019-10-12',
          '2019-10-25',
          {
            count: 25,
            offset: 0
          },
          (err, response) => {
            // Handle err
            if (err) {
              console.log('error', err);
            }
            let transactions = response.transactions;
            console.log('category', e.category);
            const getSum = (total, num) => {
              return total + num;
            };
            // const amountsArr = [];
            // response.forEach(x => amountsArr.push(x.amount));
            // const amountSpent = amountsArr.reduce(getSum, 0);

            const getCount = () => {
              let countArr = [];
              console.log('inside get count');
              transactions.forEach(y => {
                y.category.forEach(z =>
                  z.includes(e.category) ? countArr.push(y.amount) : null
                );
              });
              console.log('COUNTCOUNT', countArr);

              const amountSum = countArr.reduce(getSum, 0);
              return amountSum;
              // };
            };
            const amount = getCount();
            console.log(`This week, you spent $${amount} on ${e.category}`);

            nexmoController.nexmoJob(
              `This week, you spent $${amount} on ${e.category}`
            );
            // );
          }
        );
      });
    });
  });
});

console.log('HITTING THE SERVER');

app.listen(3128, () => console.log('listening on port 3128'));
