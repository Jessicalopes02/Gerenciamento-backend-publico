import express from 'express';
import authMiddleware from '../auth/authMiddleware.js';
import Compromisso from '../models/Compromisso.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { grupo, data, descricao, origem } = req.body;

    if (!grupo || !data || !descricao) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos.' });
    }

    const compromisso = await Compromisso.create({ grupo, data, descricao, origem });
    res.json({ sucesso: true, compromisso });
  } catch (err) {
    console.error('Erro ao criar compromisso:', err);
    res.status(500).json({ erro: 'Erro interno ao criar compromisso' });
  }
});

router.get('/:grupo', authMiddleware, async (req, res) => {
  try {
    const { grupo } = req.params;
    const compromissos = await Compromisso.find({ grupo });
    res.json(compromissos);
  } catch (err) {
    console.error('Erro ao buscar compromissos:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar compromissos' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Compromisso.findByIdAndDelete(id);
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao deletar compromisso:', err);
    res.status(500).json({ erro: 'Erro ao excluir compromisso' });
  }
});

export default router;
