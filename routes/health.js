var express = require('express');
var router = express.Router();

/* GET health check */
router.get('/', function(req, res, next) {
    res.status(200).send('OK');
});

module.exports = router;