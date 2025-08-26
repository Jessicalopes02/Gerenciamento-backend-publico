const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('./database/models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = 'admin@admin.com';
    const existe = await User.findOne({ email });

    if (existe) {
      console.log('⚠️ Admin já existe.');
      return process.exit();
    }

    const senhaCriptografada = await bcrypt.hash('123456', 10);
    const admin = new User({
      nome: 'Administrador',
      email,
      senha: senhaCriptografada,
      perfil: 'admin'
    });

    await admin.save();
    console.log('✅ Admin criado com sucesso!');
    process.exit();
  } catch (err) {
    console.error('❌ Erro ao criar admin:', err);
    process.exit(1);
  }
}

seed();
