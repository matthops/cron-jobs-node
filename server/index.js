const cron = require('node-cron');
const express = require('express');
const fs = require('fs');
const send = require('../send');
const massive = require('massive');
const bodyParser = require('body-parser');

const { CONNECTION_STRING } = process.env;

const app = express();

app.use(bodyParser.json());

massive(CONNECTION_STRING)
  .then(db => {
    app.set('db', db);
    db.get_rules().then(results => {
      console.log(results);

      client.getTransactions(
        results[0].access_token,
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

          res.status(201).send(response);
        }
      );
    });

    console.log('db connected');
  })
  .catch(error => {
    console.log(error);
  });

console.log('HITTING THE SERVER');

app.listen(3128);
