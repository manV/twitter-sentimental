"use strict";

var express = require('express');
var app = express();
var sentiment = require('sentiment');
var request = require('request');

var consumer_key = '';
var consumer_secret = '';
var access_token = '';

app.get('/:keyword', function(req, res) {
  if (!req.params.keyword) {
    res.status(400).send('invalid keyword');
  }
  request.get('https://api.twitter.com/1.1/search/tweets.json', {
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    qs: {
      'q': req.params.keyword,
      'count': 50,
      'lang': 'en'
    }
  }, function(err, result, body) {
    if (err) {
      res.status(500).send(err);
    } else if (result.statusCode !== 200) {
      res.status(result.statusCode).send(result);
    } else {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.status(500).send('error parsing json');
      }

      var analyzed = body.statuses.map(function(status) {
        return {
          status: status.text,
          sentimentScore: sentiment(status.text).score
        };
      }).reduce(function(previousValue, currentValue, index, array) {
        var senti = '';
        if (currentValue.sentimentScore === 0) {
          senti = 'neutral';
        } else if (currentValue.sentimentScore > 0) {
          senti = 'positive';
        } else {
          senti = 'negative';
        }
        var string = previousValue + '<p>' + currentValue.status + '-' + '<b>' + senti + '</b></p><hr>';
        return string;
      }, '');
      res.send(analyzed);
    }
  });
});

app.listen(3000);
console.log('express server running at localhost:3000');

(function getBearerToken() {
  console.log('please wait while we obtain access token from twitter');
  request.post('https://api.twitter.com/oauth2/token', {
    headers: {
      'Authorization': 'Basic ' + new Buffer(consumer_key + ':' + consumer_secret).toString('base64')
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function(err, result, body) {
    if (err) {
      throw err;
    } else if (result.statusCode !== 200) {
      throw new Error('response from twitter authentication is not OK');
    } else {
      try {
        access_token = JSON.parse(body).access_token;
      } catch (e) {
        throw e;
      }
      console.log('access token is set, you can make requests. go to http://localhost:3000/narendramodi for example.\n replace narendramodi with anything');
    }
  });
})();