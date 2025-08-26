import express from 'express';
import authMiddleware from '../auth/authMiddleware.js';
import { conectar, getQrCode, getSocket, desconectar, listarGrupos, enviarMensagemWhatsApp, atendimentosAtivos } from '../services/baileysService.js';


const router = express.Router();

// Iniciar conexão
router.post('/conectar', authMiddleware, async (req, res) => {
  const email = req.user?.email.toLowerCase();
  if (!email) return res.status(400).json({ erro: 'Email não encontrado' });

  try {
    await conectar(email, req.io);
    res.json({ mensagem: 'Conexão iniciada' });
  } catch (err) {
    console.error('Erro ao conectar:', err);
    res.status(500).json({ erro: 'Erro ao iniciar conexão' });
  }
});

// Buscar QR code
router.get('/qrcode', authMiddleware, (req, res) => {
  const email = req.user.email.toLowerCase();
  const qrCodeUrl = getQrCode(email);
  if (qrCodeUrl) {
    res.json({ qrCodeUrl });
  } else {
    res.status(404).json({ erro: 'QR Code não encontrado' });
  }
});


// Status conexão
router.get('/status', authMiddleware, (req, res) => {
  const email = req.user?.email.toLowerCase();
  const sock = getSocket(email);
  res.json({ conectado: sock ? !!sock.user : false });
});

// Listar grupos
router.get('/grupos/:email', authMiddleware, async (req, res) => {
  try {
    const grupos = await listarGrupos(req.params.email);
    const lista = Object.values(grupos).map((g) => ({
      id: g.id,
      nome: g.subject
    }));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Enviar mensagem
router.get('/mensagens', async (req, res) => {
  const grupo = req.query.grupo;
  console.log("Grupo recebido no backend:", grupo);
  if (!grupo) return res.status(400).json({ erro: 'Grupo não informado' });

  try {
    const mensagens = await MensagemModel.find({ grupo }).sort({ recebidoEm: 1 });
    res.json(mensagens);
  } catch (err) {
    console.error('❌ Erro ao buscar mensagens do grupo:', err);
    res.status(500).json({ erro: 'Erro ao buscar mensagens' });
  }
});



// Desconectar
router.post('/desconectar', authMiddleware, async (req, res) => {
  const email = req.user?.email.toLowerCase();
  try {
    await desconectar(email);
    res.json({ mensagem: 'Desconectado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao desconectar' });
  }
});

router.post('/reiniciar-conexao', authMiddleware, async (req, res) => {
  const email = req.user?.email?.toLowerCase();
  if (!email) return res.status(400).json({ erro: 'Email não encontrado' });

  try {
    await desconectar(email);
    await conectar(email, req.io);
    res.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao reiniciar conexão:", error);
    res.status(500).json({ erro: 'Erro ao reiniciar conexão' });
  }
});


router.post('/enviar-mensagem', authMiddleware, async (req, res) => {
  try {
    const { numero, mensagem } = req.body;
    const email = req.user?.email?.toLowerCase();

    if (!numero || !mensagem || !email) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    console.log(`📤 Enviando mensagem de ${email} para ${numero}: ${mensagem}`);
    console.log("🔵 Dados recebidos para envio:", req.body);
    
    await enviarMensagemWhatsApp(email, numero, mensagem);

    res.json({ sucesso: true });
  } catch (error) {
    console.error('❌ Erro no envio:', error);
    res.status(500).json({ erro: 'Erro interno no envio' });
  }
});

router.post('/associar', authMiddleware, (req, res) => {
  const { grupo, email } = req.body;
  if (!grupo || !email) {
    return res.status(400).json({ erro: 'Grupo e email obrigatórios' });
  }

  atendimentosAtivos[grupo] = email;
  console.log(`✅ Grupo ${grupo} associado ao atendente ${email}`);
  res.json({ sucesso: true });
});

// POST /api/compromissos
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


export default router;
