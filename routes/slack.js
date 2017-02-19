var express = require('express');
var router = express.Router();
var Slack = require('slack-node'); 

webhookUri = "__uri___";

slack = new Slack();
slack.setWebhook(webhookUri);

slack.webhook({
	channel: "#coderit",
	username: "codeRITMusicBot",
	text: "WORKING BOIII"
}, function(err, response){
	console.log(response);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('slack', { title: 'Groupify' });
});

module.exports = router;
