import express from 'express';
import Mensagem from '../models/Message.js'; // Corrija o path se necessário

const router = express.Router();

function isFormal(mensagem) {
  return mensagem.includes("Prezados") || mensagem.includes("Gentileza") || mensagem.includes("Por favor");
}

router.get('/metricas', async (req, res) => {
  try {
    const mensagens = await Mensagem.find({}).sort({ timestamp: 1 });

    let grupos = {};

    mensagens.forEach((msg, i) => {
      const grupo = msg.from;
      if (!grupos[grupo]) grupos[grupo] = { atrasos: 0, respostas: [], total: 0 };

      grupos[grupo].total++;

      const proximaMsg = mensagens[i + 1];

      if (proximaMsg && proximaMsg.from !== msg.from) {
        const diff = new Date(proximaMsg.timestamp) - new Date(msg.timestamp);
        const minutos = diff / 1000 / 60;

        grupos[grupo].respostas.push({
          pergunta: msg.body,
          resposta: proximaMsg.body,
          tempoResposta: minutos.toFixed(2),
          formal: isFormal(proximaMsg.body),
        });

        if (minutos > 15) grupos[grupo].atrasos++;
      }
    });

    res.json(grupos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao calcular métricas' });
  }
});

export default router;
