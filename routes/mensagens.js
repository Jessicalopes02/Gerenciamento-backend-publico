import express from 'express';
import Atendimento from '../database/models/Atendimento.js';

const router = express.Router();

// GET /api/mensagens/com-atendimentos
router.get('/com-atendimentos', async (req, res) => {
  try {
    const atendimentos = await Atendimento.aggregate([
      {
        $match: {
          mensagens: { $exists: true, $ne: [] }
        }
      },
      {
        $project: {
          grupo: 1,
          mensagens: 1
        }
      }
    ]);
    res.json(atendimentos);
  } catch (err) {
    console.error('Erro ao buscar atendimentos com mensagens:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar atendimentos' });
  }
});


export default router;
