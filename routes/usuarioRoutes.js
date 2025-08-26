import express from 'express';
import User from '../database/models/User.js';
import authMiddleware from '../auth/authMiddleware.js';
import { getSocket, getQrCode, getConexoes } from '../services/baileysService.js';

const router = express.Router();

// 🔑 Listar usuários (apenas admin)
router.get('/', authMiddleware, async (req, res) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ mensagem: 'Apenas administradores podem acessar esta rota.' });
  }

  try {
    const usuarios = await User.find({ perfil: 'usuario' });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários.' });
  }
});

// ❌ Desconectar usuário
router.post('/:email/desconectar', authMiddleware, (req, res) => {
  const email = req.params.email.toLowerCase();
  const sock = getSocket(email);

  if (sock) {
    try {
      sock.ws.close();
      delete getConexoes()[email];
      return res.json({ sucesso: true, mensagem: 'Desconectado com sucesso' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao desconectar usuário' });
    }
  }

  return res.status(404).json({ erro: 'Usuário não conectado' });
});

// 🔎 Ver status + QR code
router.get('/:email/status', authMiddleware, (req, res) => {
  const email = req.params.email.toLowerCase();
  const sock = getSocket(email);
  const qrCode = getQrCode(email);

  res.json({
    conectado: sock ? !!sock.user : false,
    qrCodeUrl: qrCode
  });
});

export default router;
