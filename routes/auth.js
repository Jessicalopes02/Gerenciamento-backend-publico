import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // ✅ ADICIONE ISSO
import User from '../database/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // ✅ Compara senha com bcrypt
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // ✅ Cria token
    const token = jwt.sign(
      { id: user._id, email: user.email, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ Retorna dados
    res.json({ token, perfil: user.perfil, email: user.email });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ✅ Rota para registrar novos usuários
router.post('/register', async (req, res) => {
  const { email, senha, perfil } = req.body;

  try {
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const novoUsuario = new User({ email, senha: senhaHash, perfil });
    await novoUsuario.save();

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro no servidor ao criar usuário' });
  }
});

export default router;
