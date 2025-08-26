import express from 'express';
import Atendimento from '../database/models/Atendimento.js';
import User from '../database/models/User.js';
import authMiddleware from '../auth/authMiddleware.js';

const router = express.Router();

// Utilitário para calcular o tempo de resposta com base nas mensagens
function calcularTempoResposta(mensagens) {
  const primeiraCliente = mensagens.find(m => m.autor === 'cliente');
  const primeiraOperador = mensagens.find(m => m.autor === 'operador');

  if (primeiraCliente && primeiraOperador) {
    const t1 = new Date(primeiraCliente.data);
    const t2 = new Date(primeiraOperador.data);
    return Math.floor((t2 - t1) / 1000); // em segundos
  }

  return null;
}

// Utilitário para formatar segundos como HH:MM:SS
function formatarSegundos(segundos) {
  const h = String(Math.floor(segundos / 3600)).padStart(2, '0');
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
  const s = String(segundos % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

router.get('/', authMiddleware, async (req, res) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ mensagem: 'Acesso negado.' });
  }

  const { dataInicio, dataFim } = req.query;
  const filtroData = {};

  if (dataInicio && dataFim) {
    filtroData.criadoEm = {
      $gte: new Date(`${dataInicio}T00:00:00Z`),
      $lte: new Date(`${dataFim}T23:59:59Z`)
    };
  }

  try {
    const usuarios = await User.find({ perfil: 'usuario' });
    const metricas = [];

    for (const u of usuarios) {
      const filtro = { operador: u.email, ...filtroData };

      const atendimentos = await Atendimento.find(filtro);
      const total = atendimentos.length;
      const emAtendimento = atendimentos.filter(a => a.status === 'Em atendimento').length;
      const finalizados = atendimentos.filter(a => a.status === 'Finalizado').length;

      const tempos = atendimentos
        .map(a => calcularTempoResposta(a.mensagens))
        .filter(t => t !== null);

      const mediaSegundos = tempos.length
        ? Math.floor(tempos.reduce((a, b) => a + b, 0) / tempos.length)
        : 0;

      metricas.push({
        operador: u.email,
        totalAtendimentos: total,
        emAtendimento,
        finalizados,
        tempoRespostaMedio: formatarSegundos(mediaSegundos)
      });
    }

    res.json(metricas);
  } catch (err) {
    console.error('Erro nas métricas:', err);
    res.status(500).json({ mensagem: 'Erro ao calcular métricas' });
  }
});

export default router;
