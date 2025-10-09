const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.json({ success: true, data: [], message: 'Pedidos - En desarrollo' }));
module.exports = router;