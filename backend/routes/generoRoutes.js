const express = require('express');
const router = express.Router();

// Placeholder para controlador de géneros
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id_genero: 1, nombre: 'Masculino' },
            { id_genero: 2, nombre: 'Femenino' }
        ], 
        message: 'Géneros obtenidos correctamente' 
    });
});

module.exports = router;