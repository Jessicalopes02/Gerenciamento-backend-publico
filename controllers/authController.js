import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../database/models/User.js';
import { conectar } from '../services/baileysService.js';

const SECRET = process.env.JWT_SECRET || 'secreta';

export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ mensagem: 'Usuário não encontrado' });

    const senhaCorreta = await bcrypt.compare(senha, user.senha);
    if (!senhaCorreta) return res.status(401).json({ mensagem: 'Senha incorreta' });

    await conectar(email); // conecta no WhatsApp

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });


    res.json({ token, perfil: user.perfil, email: user.email });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ mensagem: 'Erro interno no login' });
  }
};
