const express = require('express');
const router = express.Router();

// Placeholder para controlador de áreas
router.get('/', (req, res) => {
    res.json({ success: true, data: [], message: 'Áreas - En desarrollo' });
});

module.exports = router;