// Quick diagnostic script for POST /api/ciclos/smlv
// Run with: node test_smlv_endpoint.js
// Requires a valid JWT token placed in the TOKEN environment variable

require('dotenv').config();
const fetch = require('node-fetch');

(async () => {
  const token = process.env.TEST_JWT_TOKEN || process.env.TOKEN;
  if (!token) {
    console.error('Falta TEST_JWT_TOKEN en .env para probar el endpoint.');
    process.exit(1);
  }
  const anio = new Date().getFullYear();
  const valor_mensual = 1600000; // Ajustar según año

  try {
    const resp = await fetch('http://localhost:3001/api/ciclos/smlv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ anio, valor_mensual, observaciones: 'Test automatizado' })
    });
    const json = await resp.json();
    console.log('Status:', resp.status);
    console.log('Respuesta JSON:', json);
    if (resp.status === 200 && json.success) {
      console.log('✅ Endpoint SMLV OK');
    } else {
      console.log('❌ Fallo en endpoint SMLV');
    }
  } catch (err) {
    console.error('Error realizando solicitud:', err);
  }
})();
