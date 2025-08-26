import { Boom } from '@hapi/boom';
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from 'baileys';
import P from 'pino';
import fs from 'fs';
import path from 'path';
import MensagemModel from '../models/Message.js'; 
import { io } from '../server.mjs'; 
import User from '../database/models/User.js';
import Atendimento from '../database/models/Atendimento.js';

export const conexoes = {};
export const qrcodes = {};

export const atendimentosAtivos = {};

export const conectar = async (email, io) => {
  console.log(`🟡 Conectando: ${email}`);
  const normalizedEmail = email.toLowerCase();
  const pasta = path.resolve(`baileys_auth/${normalizedEmail}`);
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(pasta);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' })
  });

  conexoes[normalizedEmail] = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=250x250`;
      qrcodes[normalizedEmail] = qrUrl;
      io.to(normalizedEmail).emit('qrCode', { email: normalizedEmail, qrCodeUrl: qrUrl });
    }

    if (connection === 'open') {
      const usuario = await User.findOne({ email: normalizedEmail });
      console.log(`✅ Conectado: ${normalizedEmail}`);
      io.emit('whatsapp-status', {
        conectado: true,
        email: normalizedEmail,
        nome: usuario?.nome || '',
      });
    }

    if (connection === 'close') {
      const usuario = await User.findOne({ email: normalizedEmail });
      console.log(`❌ Desconectado: ${normalizedEmail}`);
      io.emit('whatsapp-status', {
        conectado: false,
        email: normalizedEmail,
        nome: usuario?.nome || '',
      });

      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;

      if (shouldReconnect) {
        delete conexoes[normalizedEmail];
        setTimeout(() => conectar(normalizedEmail, io), 3000);
      } else {
        fs.rmSync(pasta, { recursive: true, force: true });
        delete conexoes[normalizedEmail];
        delete qrcodes[normalizedEmail];
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
  iniciarListenerMensagens(normalizedEmail);
};


export function desconectar(email) {
  const normalizedEmail = email.toLowerCase();
  const sock = conexoes[normalizedEmail];
  if (sock) {
    sock.ws.close();
    delete conexoes[normalizedEmail];
    delete qrcodes[normalizedEmail];
    console.log(`✅ Desconectado: ${normalizedEmail}`);
  }
}

export function iniciarListenerMensagens(email) {
  const sock = conexoes[email.toLowerCase()];
  if (!sock) return;

  sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    if (!msg.message || msg.key.fromMe) continue;

    const remoteJid = msg.key.remoteJid || '';
    const isGroup = remoteJid.endsWith("@g.us") ? remoteJid : null;
    const mensagemTexto = msg.message?.conversation ||
                          msg.message?.extendedTextMessage?.text ||
                          msg.message?.imageMessage?.caption || '';

    if (!mensagemTexto.trim()) continue;

    const novaMensagem = {
      autor: 'cliente',
      texto: mensagemTexto,
      grupo: isGroup,
      remetente: remoteJid,
      respondido: false,
      recebidoEm: new Date()
    };

    try {
      // 🔁 Novo fluxo: salvar no Atendimento
      let atendimento = await Atendimento.findOne({ grupo: isGroup });

      if (!atendimento) {
        atendimento = await Atendimento.create({
          grupo: isGroup,
          operador: null,
          mensagens: []
        });
      }

      // ⚠️ Verificação para garantir que operador não fique nulo se já tiver um
      if (!atendimento.operador && msg.key.fromMe) {
        atendimento.operador = msg.pushName || 'operador';
      }

      atendimento.mensagens.push({
        autor: msg.key.fromMe ? 'operador' : 'cliente',
        texto: mensagemTexto,
        data: new Date()
      });

      await atendimento.save();

      // ✅ Se quiser manter a MensagemModel separada (opcional)
      // await MensagemModel.create(novaMensagem);

      // 🔔 Enviar para atendente logado
      const emailResponsavel = atendimentosAtivos[remoteJid];
      if (emailResponsavel) {
        io.to(emailResponsavel.toLowerCase()).emit("mensagemRecebida", novaMensagem);
        console.log(`📥 Mensagem do cliente encaminhada para ${emailResponsavel}`);
      } else {
        console.warn(`⚠️ Nenhum atendente registrado para ${remoteJid}`);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar mensagem no atendimento:', err);
    }
  }
});
}

export function getSocket(email) {
  const sock = conexoes[email.toLowerCase()];
  return sock && sock.user ? sock : null;
}

export function getQrCode(email) {
  return qrcodes[email.toLowerCase()] || null;
}

export function getConexoes() {
  return conexoes;
}

export async function enviarMensagemWhatsApp(email, numero, mensagem) {
  const sock = getSocket(email);
  if (!sock) throw new Error('WhatsApp não conectado para este usuário');
  try {
    await sock.sendMessage(numero, { text: mensagem });
    console.log(`✅ Mensagem enviada para ${numero}: ${mensagem}`);

    atendimentosAtivos[numero] = email;

  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${numero}:`, error);
    throw error;
  }
}

export async function listarGrupos(email) {
  const sock = getSocket(email);
  if (!sock) throw new Error('WhatsApp não conectado para este usuário');
  try {
    const grupos = await sock.groupFetchAllParticipating();
    return grupos;
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    throw new Error('Erro ao listar grupos');
  }
}
