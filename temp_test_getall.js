const CicloDotacionModel = require('./backend/models/CicloDotacionModel');

(async () => {
  try {
    console.log('Llamando CicloDotacionModel.getAll...');
    const res = await CicloDotacionModel.getAll(1,10,{});
    console.log('Resultado:', res);
    process.exit(0);
  } catch (err) {
    console.error('ERROR al ejecutar getAll:', err);
    process.exit(1);
  }
})();