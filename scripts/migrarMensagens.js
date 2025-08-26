import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Atendimento from '../database/models/Atendimento.js';
import MensagemModel from '../models/Message.js'; // Caminho correto ao seu modelo

const MONGODB_URI = process.env.MONGODB_URI;

async function runMigracao() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const mensagens = await MensagemModel.find({});
    console.log(`🔍 ${mensagens.length} mensagens encontradas`);

    let migradas = 0;

    for (const m of mensagens) {
      if (!m.grupo || !m.texto) continue;

      if (!m.remetente) {
        console.warn(`⚠️ Mensagem ignorada por não ter remetente. ID: ${m._id}`);
        continue;
      }

      const autor = m.remetente.endsWith('@s.whatsapp.net') ? 'cliente' : 'operador';

      const novaMensagem = {
        autor,
        texto: m.texto,
        data: m.recebidoEm || new Date()
      };

      const atendimento = await Atendimento.findOne({ grupo: m.grupo });

      if (!atendimento) {
        console.warn(`⚠️ Atendimento não encontrado para grupo ${m.grupo}`);
        continue;
      }

      atendimento.mensagens.push(novaMensagem);
      await atendimento.save();
      migradas++;
    }

    console.log(`✅ Migração concluída. ${migradas} mensagens migradas com sucesso.`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
    process.exit(1);
  }
}

runMigracao();
