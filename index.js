const cron = require('node-cron');
const express = require('express');
const fs = require('fs');
const send = require('./send');

app = express();

cron.schedule('* * * * *', function() {
  send.nexmoJob();
  console.log('running a task every minute');
});

app.listen(3128);
