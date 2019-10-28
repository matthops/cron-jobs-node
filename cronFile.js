require('dotenv').config();
const Nexmo = require('nexmo');

const { NEXMO_API_KEY, NEXMO_API_SECRET, NUMBER_FROM, NUMBER_TO } = process.env;

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET
});

const from = NUMBER_FROM;
const to = NUMBER_TO;
const text = 'Another New Test Message';

nexmo.message.sendSms(from, to, text, (err, responseData) => {
  if (err) {
    console.log(err);
  } else {
    if (responseData.messages[0]['status'] === '0') {
      console.log('Message sent successfully.');
    } else {
      console.log(
        `Message failed with error: ${responseData.messages[0]['error-text']}`
      );
    }
  }
});
