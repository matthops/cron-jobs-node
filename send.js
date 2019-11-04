require('dotenv').config();
const Nexmo = require('nexmo');

module.exports = {
  nexmoJob: text => {
    const { NEXMO_API_KEY, NEXMO_API_SECRET } = process.env;

    const nexmo = new Nexmo({
      apiKey: NEXMO_API_KEY,
      apiSecret: NEXMO_API_SECRET
    });

    const from = '18704068020';
    const to = '19253033344';
    // const text = 'Another New Test Message';

    nexmo.message.sendSms(from, to, text, (err, responseData) => {
      if (err) {
        console.log(err);
      } else {
        if (responseData.messages[0]['status'] === '0') {
          console.log('Message sent successfully.');
        } else {
          console.log(
            `Message failed with error: ${
              responseData.messages[0]['error-text']
            }`
          );
        }
      }
    });
  }
};

// 1	2	{ "weekly": ["Food", "Shops", "Restaurants", "Financial"] }	19253033344
// 5	2	{ "weekly": ["Gas Stations", "Services", "Religious", "Bank Fees"] }	19253033344
