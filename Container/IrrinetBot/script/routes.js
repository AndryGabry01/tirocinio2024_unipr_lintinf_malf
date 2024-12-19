const express = require('express');
const   router = express.Router();
    const { update_irf_humidity} = require("./logic")

router.post('/irrinet/update/humidity', (req, res) => {
    update_irf_humidity(req, res);
});
module.exports = router;
