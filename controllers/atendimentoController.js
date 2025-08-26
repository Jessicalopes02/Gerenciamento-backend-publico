import Message from '../models/Message.js';
import Atendimento from '../models/Atendimento.js';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

// Função para calcular o tempo de resposta entre mensagens
const calcularTempoResposta = (horaCliente, horaOperador) => {
  const tempoCliente = new Date(horaCliente);
  const tempoOperador = new Date(horaOperador);
  const tempoResposta = tempoOperador - tempoCliente; // Tempo em milissegundos

  if (tempoResposta < 0) return 'Erro no tempo de resposta';
  
  const min = Math.floor(tempoResposta / 60000);
  const seg = Math.floor((tempoResposta % 60000) / 1000);
  return `${min}m ${seg}s`;
};

// Função para analisar o sentimento da mensagem
const analisarSentimento = (texto) => {
  const resultado = sentiment.analyze(texto);
  if (resultado.score > 0) return 'Positiva';
  if (resultado.score < 0) return 'Negativa';
  return 'Neutra';
};


// GET /atendimentos
export const listarAtendimentos = async (req, res) => {
  try {
    const mensagens = await Mensagem.find().sort({ createdAt: -1 });
    res.json(mensagens);
  } catch (err) {
    console.error("Erro ao listar atendimentos:", err);
    res.status(500).json({ erro: 'Erro ao listar atendimentos' });
  }
};

export const iniciarAtendimento = async (req, res) => {
  const { usuarioId, clienteId } = req.body;
  const novoAtendimento = new Atendimento({
    usuarioId,
    clienteId,
    status: 'iniciado',
    dataInicio: new Date()
  });

  await novoAtendimento.save();
  res.status(201).json(novoAtendimento);
};

// Função para enviar mensagem
export const enviarMensagem = async (req, res) => {
  try {
    const { grupo, mensagem, email } = req.body;

    if (!grupo || !mensagem) {
      return res.status(400).json({ erro: 'Grupo e mensagem são obrigatórios' });
    }

    const novaMensagem = new Message({
      grupo,
      texto: mensagem,
      autor: 'operador',
      respondido: true,
      sentimento: analisarSentimento(mensagem),  // Analisando o sentimento
      horaEnvio: new Date(),  // Hora do envio
    });

    // Se a mensagem anterior for do cliente, calcula o tempo de resposta
    const ultimaMensagem = await Message.findOne({ grupo }).sort({ createdAt: -1 });
    if (ultimaMensagem && ultimaMensagem.autor === 'cliente') {
      const tempoResposta = calcularTempoResposta(ultimaMensagem.horaEnvio, novaMensagem.horaEnvio);
      novaMensagem.tempoResposta = tempoResposta;
    }

    await novaMensagem.save();
    res.status(201).json({ sucesso: true, mensagem: novaMensagem });

  } catch (err) {
    console.error("Erro ao salvar mensagem:", err);
    res.status(500).json({ erro: 'Erro ao salvar mensagem' });
  }
};

export const adicionarComentarioSugestao = async (req, res) => {
  const { atendimentoId, sugestaoIndex } = req.params;
  const { autor, mensagem } = req.body;

  try {
    const atendimento = await Atendimento.findById(atendimentoId);
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    const sugestao = atendimento.sugestoes[sugestaoIndex];
    if (!sugestao) return res.status(404).json({ erro: 'Sugestão não encontrada' });

    sugestao.historico.push({ autor, mensagem });
    await atendimento.save();

    res.json({ sucesso: true, sugestao });
  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    res.status(500).json({ erro: 'Erro ao adicionar comentário' });
  }
};

export default {
  listarAtendimentos,
  enviarMensagem
};