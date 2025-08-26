import express from 'express';
import Atendimento from '../database/models/Atendimento.js';
import authMiddleware from '../auth/authMiddleware.js';

const router = express.Router();

// 🟢 Enviar sugestão
router.post('/', authMiddleware, async (req, res) => {
  const { grupo, texto } = req.body;
  if (!grupo || !texto) return res.status(400).json({ erro: 'Dados insuficientes' });

  try {
    let atendimento = await Atendimento.findOne({ grupo });
    if (!atendimento) {
      atendimento = new Atendimento({ grupo, contato: grupo, status: 'Em atendimento' });
    }

    atendimento.sugestoes.push({
      texto,
      aprovado: false,
      emailUsuario: req.usuario?.email || 'desconhecido'
    });

    await atendimento.save();

    res.json({ sucesso: true });
  } catch (err) {
    console.error('❌ Erro ao salvar sugestão:', err);
    res.status(500).json({ erro: 'Erro ao salvar sugestão', detalhes: err.message });
  }
});

// ✅ NOVO: buscar todas as sugestões pendentes
router.get('/pendentes', authMiddleware, async (req, res) => {
  // 🔒 Restrição de acesso
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem acessar.' });
  }

  try {
    const atendimentos = await Atendimento.find({ 'sugestoes.aprovado': false });
    const pendentes = [];

    atendimentos.forEach((at) => {
      at.sugestoes.forEach((sugestao, i) => {
        if (!sugestao.aprovado) {
          pendentes.push({
            id: `${at._id}-${i}`,
            usuario: at.contato || at.grupo || 'Desconhecido',
            sugestao: sugestao.texto
          });
        }
      });
    });

    res.json(pendentes);
  } catch (err) {
    console.error('Erro ao buscar sugestões pendentes:', err);
    res.status(500).json({ erro: 'Erro ao buscar sugestões' });
  }
});

router.post('/:id/aprovar', authMiddleware, async (req, res) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem acessar.' });
  }

  const [atendimentoId, index] = req.params.id.split('-');
  const { novaSugestao } = req.body;
  try {
    const atendimento = await Atendimento.findById(atendimentoId);
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    if (novaSugestao) {
      atendimento.sugestoes[index].texto = novaSugestao;
    }

    atendimento.sugestoes[index].aprovado = true;

    const emailUsuario = atendimento.sugestoes[index].emailUsuario;

    await atendimento.save();

    // Emitir evento para o usuário dono da sugestão
    const io = req.io; // garantir que app.use((req, res, next) => req.io = io) esteja no server.js
    if (emailUsuario && io) {
      io.to(emailUsuario).emit('sugestao-aprovada', {
        texto: atendimento.sugestoes[index].texto
      });
    }

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao aprovar sugestão:', err);
    res.status(500).json({ erro: 'Erro ao aprovar sugestão' });
  }
});


// ✅ Reprovar sugestão (restrito a admin)
router.post('/:id/reprovar', authMiddleware, async (req, res) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem acessar.' });
  }

  const [atendimentoId, index] = req.params.id.split('-');
  try {
    const atendimento = await Atendimento.findById(atendimentoId);
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    atendimento.sugestoes.splice(index, 1); // remove
    await atendimento.save();
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao reprovar sugestão:', err);
    res.status(500).json({ erro: 'Erro ao reprovar sugestão' });
  }
});

// ➕ Adicionar comentário no histórico da sugestão
router.post('/:id/comentario', authMiddleware, async (req, res) => {
  const { autor, mensagem } = req.body;
  const [atendimentoId, index] = req.params.id.split('-');

  try {
    const atendimento = await Atendimento.findById(atendimentoId);
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    if (!mensagem) return res.status(400).json({ erro: 'Comentário não pode estar vazio' });

    const sugestao = atendimento.sugestoes[index];
    if (!sugestao) return res.status(404).json({ erro: 'Sugestão não encontrada' });

    sugestao.historico.push({
      autor: req.usuario.perfil,
      mensagem
    });

    await atendimento.save();
    res.json({ sucesso: true, historico: sugestao.historico });

  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    res.status(500).json({ erro: 'Erro ao adicionar comentário' });
  }
});

router.get('/:id/historico', authMiddleware, async (req, res) => {
  const [atendimentoId, index] = req.params.id.split('-');

  try {
    const atendimento = await Atendimento.findById(atendimentoId);
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    const sugestao = atendimento.sugestoes[index];
    if (!sugestao) return res.status(404).json({ erro: 'Sugestão não encontrada' });

    res.json(sugestao.historico || []);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
});


export default router;
