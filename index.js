const cron = require('node-cron');
const express = require('express');
const fs = require('fs');
const send = require('./send');
const massive = require('massive');
const bodyParser = require('body-parser');

const { CONNECTION_STRING } = process.env;

const app = express();

app.use(bodyParser.json());

massive(CONNECTION_STRING).then(db => {
  app.set('db', db);
  console.log('db connected');
});

(req, res) => {
  const db = req.app.get('db');
  console.log('HIT THE SERVER');

  db.get_rules().then(results => {
    //   return res.status(201).send(results);
    console.log(results);
  });
};

app.listen(3128);
