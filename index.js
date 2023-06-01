require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mySecret = process.env['MONGO_URI']
const mongoose = require("mongoose")

mongoose.connect(mySecret, {
useNewUrlParser: true,
useUnifiedTopology: true,
});
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
});

const Url = mongoose.model('Url', urlSchema);

let nextShortUrlId = 1;

const urlRegex = /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.json({ error: 'Invalid request body. Missing URL.' });
  }

  if (!urlRegex.test(url)) {
    return res.json({ error: 'invalid url' });
  }

  const urlObj = new Url({
    original_url: url,
    short_url: nextShortUrlId.toString()
  });

  urlObj.save()
    .then((savedUrl) => {
      nextShortUrlId++;
      res.json(savedUrl);
      console.log(savedUrl)
    })
    .catch((error) => {
      res.json({ error: 'Internal server error' });
    });
});

app.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;

  Url.findOne({ short_url: shortUrl })
    .then((url) => {
      if (url) {
        res.redirect(url.original_url);
      } else {
        res.json({ error: 'invalid url' });
      }
    })
    .catch((error) => {
      res.json({ error: 'Internal server error' });
    });
});
