const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'Dotaciones - En desarrollo' }));
module.exports = router;