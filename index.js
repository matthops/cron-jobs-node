const cron = require('node-cron');
const express = require('express');
const send = require('./send');
const massive = require('massive');
const bodyParser = require('body-parser');
const nexmoController = require('./send.js');
const SMSThrottler = require('./throttler');
const Nexmo = require('nexmo');
const plaid = require('plaid');
const moment = require('moment');
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
  plaid.environments.sandbox
);

const throttler = new SMSThrottler({
  nexmoInstance: nexmo,
  accountOptions: { minTime: 2000 }
});

const from = NUMBER_FROM;

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

const weekAgoDateString = moment()
  .subtract(7, 'days')
  .format('YYYY-MM-DD');
const todaysDate = moment().format('YYYY-MM-DD');
console.log('TODAY DATE', todaysDate, 'weekagoDate', weekAgoDateString);

const app = express();

app.use(bodyParser.json());

massive(CONNECTION_STRING).then(db => {
  app.set('db', db);
  console.log('db connected');

    db.get_item().then(results => {
      const ACCESS_TOKEN = results[0].access_token 
      if (!results[0]) {
        return res.status(201).send(results);
      }
      client.getBalance(ACCESS_TOKEN, (err, balanceResult) => {
        console.log("ERR", err, "RESULTS", balanceResult)
        // Handle err
        if(err)return err
        // const accounts = balanceResult.accounts;
       
        const availableBalance = balanceResult.accounts[0].balances.available.toLocaleString('en', { maximumSignificantDigits: 2 })
        const currentBalance = balanceResult.accounts[0].balances.current.toLocaleString('en', { maximumSignificantDigits: 2 })
        const accountType = balanceResult.accounts[0].subtype
        const accountName = balanceResult.accounts[0].official_name
        console.log("TEXT", `$${availableBalance}`, `$${currentBalance}`, accountName)
        const textMessage = `${accountName} has $${currentBalance} of which $${availableBalance} is available`


        nexmo.message.sendSms(NUMBER_FROM, 19253033344, textMessage, (err, responseData) => {
          if (err) {
              console.log(err);
          } else {
              if(responseData.messages[0]['status'] === "0") {
                  console.log("Message sent successfully.");
              } else {
                  console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
              }
          }
      })

    //   nexmo.message.sendSms(NUMBER_FROM, 14692307622, textMessage, (err, responseData) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if(responseData.messages[0]['status'] === "0") {
    //             console.log("Message sent successfully.");
    //         } else {
    //             console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
    //         }
    //     }
    // })


      });
    })


  // db.get_rules().then(results => {
  //   results.forEach(user => {
  //     const to = user.user_number;
  //     const categoryArr = user.category['weekly'];
  //     db.get_item(user.user_id).then(results => {
  //       client.getTransactions(
  //         results[0].access_token,
  //         weekAgoDateString,
  //         todaysDate,
  //         {
  //           count: 25,
  //           offset: 0
  //         },
  //         (err, response) => {
  //           if (err) {
  //             console.log('error', err);
  //           }
  //           const transactionsArr = response.transactions;
  //           let smsArr = [];

  //           //foreach category in categoryArr
  //           categoryArr.forEach(category => {
  //             let countArr = [];

  //             // go through each position in each transaction's category array
  //             transactionsArr.forEach(transaction => {
  //               transaction.category.forEach(transactionCatArr =>
  //                 // and see if each position in the transactions category array is equal to the category
  //                 transactionCatArr.includes(category)
  //                   ? countArr.push(transaction.amount)
  //                   : null
  //               );
  //             });
  //             const amount = countArr.reduce(getSum, 0).toLocaleString();
  //             smsArr.push({ amount, category });
  //             // console.log('smsArr', smsArr);
  //             let text = 'You spent ';
  //             if (smsArr.length === categoryArr.length) {
  //               for (let i = 0; i < smsArr.length; ++i) {
  //                 text += `$${smsArr[i].amount} on ${smsArr[i].category}. `;
  //               }
  //               console.log('TEXT', text);
  //               throttler.queue({ from, to, text, callback: completed });
  //             }
  //           });
  //         }
  //       );
  //     });
  //   });
  // });


});

console.log('HITTING THE SERVER');

app.listen(3128, () => console.log('listening on port 3128'));

// [{category: "Food", frequency: "weekly"},{category: "Shops", frequency: "weekly"},{category: "Restaurants", frequency: "weekly"}, {category: "Financial", frequency: "weekly"} ]

// { weekly: ["Food", "Shops", "Restaurants", "Financial"] }
// { "weekly": ["Gas Stations", "Services", "Religious", "Bank Fees"] }
