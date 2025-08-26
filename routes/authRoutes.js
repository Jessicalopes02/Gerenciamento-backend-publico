import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../database/models/User.js';
import authMiddleware from '../auth/authMiddleware.js';
import * as authController from '../controllers/authController.js';
import { login } from '../controllers/authController.js';


const router = express.Router();



// 🔑 Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Usuário não encontrado' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'Senha inválida' });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, perfil: usuario.perfil });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: 'Erro no login' });
  }
});

// 🔧 Registrar (Apenas admin)
router.post('/registrar', authMiddleware, async (req, res) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ mensagem: 'Apenas administradores podem cadastrar usuários.' });
  }

  const { nome, email, senha } = req.body;

  const existe = await User.findOne({ email });
  if (existe) {
    return res.status(400).json({ mensagem: 'Email já cadastrado.' });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  const novoUsuario = new User({
    nome,
    email,
    senha: senhaCriptografada,
    perfil: 'usuario'  // 🔥 Sempre cria como usuario
  });

  await novoUsuario.save();
  res.status(201).json({ mensagem: 'Usuário criado com sucesso!' });
});

export default router;
