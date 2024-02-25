var express = require('express');
var router = express.Router();
var os = require('os');
const { format } = require('date-fns');

/* GET home page. */
router.get('/', function(req, res, next) {
  const currentTimeLocal = format(new Date(), 'dd-MM-yyyy HH:mm:ss');

  res.send({
    hostname: os.hostname(),
    version: process.env.npm_package_version,
    timestampLocal: currentTimeLocal,
  });
});

module.exports = router;
