import express from 'express';
import User from '../database/models/User.js';
import authMiddleware from '../auth/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const atendentes = await User.find({ perfil: 'usuario' });
    res.json(atendentes);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar informações dos atendentes.' });
  }
});

export default router;
