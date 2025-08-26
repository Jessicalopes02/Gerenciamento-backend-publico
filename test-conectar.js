const { conectar, getQrCode } = require('./services/baileysService');

const email = 'andressa@admin.com';

(async () => {
  console.log(`➡️ Testando conexão para ${email}`);
  await conectar(email);
  setTimeout(() => {
    const qr = getQrCode(email);
    if (qr) {
      console.log(`✅ QR gerado: ${qr}`);
    } else {
      console.log('❌ QR não foi gerado');
    }
    process.exit();
  }, 10000); // espera 10 segundos
})();
