const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: "RSS API working" });
});

module.exports = router;
