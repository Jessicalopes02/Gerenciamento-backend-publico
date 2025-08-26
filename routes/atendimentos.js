import express from 'express';
import Atendimento from '../database/models/Atendimento.js';
import { adicionarComentarioSugestao } from '../controllers/atendimentoController.js';
import Message from '../database/models/Message.js';


const router = express.Router();

// GET /api/atendimentos/grupo/:id → buscar atendimento por grupo
router.get('/grupo/:id', async (req, res) => {
  try {
    const atendimento = await Atendimento.findOne({ grupo: req.params.id });
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });
    res.json(atendimento);
  } catch (err) {
    console.error('Erro ao buscar atendimento por grupo:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar atendimento' });
  }
});

// GET /api/atendimentos/com-mensagens → busca atendimentos com mensagens associadas
router.get('/com-mensagens', async (req, res) => {
  try {
    const atendimentos = await Atendimento.find();

    const atendimentosComMensagens = await Promise.all(
      atendimentos.map(async (atendimento) => {
        const mensagens = await Message.find({ atendimentoId: atendimento._id });
        return {
          _id: atendimento._id,
          grupo: atendimento.grupo,
          mensagens,
        };
      })
    );

    res.json(atendimentosComMensagens);
  } catch (err) {
    console.error('Erro ao buscar atendimentos com mensagens:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar atendimentos com mensagens' });
  }
});

router.post('/:atendimentoId/sugestoes/:sugestaoIndex/comentario', adicionarComentarioSugestao);

export default router;
