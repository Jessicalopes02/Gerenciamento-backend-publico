import express from 'express';
import Atendimento from '../database/models/Atendimento.js';
import authMiddleware from '../auth/authMiddleware.js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import os from 'os';


const router = express.Router();

// ✅ Criar novo atendimento
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { grupo } = req.body;
    const operador = req.user.email; // 🔐 Agora confiável pelo token

    if (!grupo || !operador) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const novoAtendimento = new Atendimento({
      grupo,
      operador,
      criadoEm: new Date(),
      finalizado: false
    });

    await novoAtendimento.save();

    res.status(201).json(novoAtendimento);
  } catch (err) {
    console.error('Erro ao criar atendimento:', err);
    res.status(500).json({ erro: 'Erro ao criar atendimento' });
  }
});


// 🗓️ Atualizar prazo de retorno manual
router.post('/atualizar-prazo/:id', authMiddleware, async (req, res) => {
  const { prazo } = req.body;
  try {
    const atendimento = await Atendimento.findById(req.params.id);
    if (!atendimento) {
      return res.status(404).json({ mensagem: 'Atendimento não encontrado' });
    }

    const prazoData = new Date(prazo);
    atendimento.prazoRetorno = prazoData;

    // Verifica o status
    const hoje = new Date();
    const diff = (prazoData - hoje) / (1000 * 60 * 60); // em horas

    if (diff < 0) {
      atendimento.statusPrazo = 'vencido';
    } else if (diff <= 24) {
      atendimento.statusPrazo = 'proximo';
    } else {
      atendimento.statusPrazo = 'em dia';
    }

    await atendimento.save();
    res.json({ mensagem: 'Prazo atualizado com sucesso', atendimento });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao atualizar prazo' });
  }
});

// ✅ Enviar feedback para o cliente
router.post('/feedback-cliente/:id', authMiddleware, async (req, res) => {
  const { feedback } = req.body;
  try {
    const atendimento = await Atendimento.findByIdAndUpdate(
      req.params.id,
      { feedbackCliente: feedback },
      { new: true }
    );
    res.json({ mensagem: 'Feedback do cliente salvo', atendimento });
  } catch {
    res.status(500).json({ mensagem: 'Erro ao salvar feedback do cliente' });
  }
});

// ✅ Feedback interno (CS)
router.post('/feedback-interno/:id', authMiddleware, async (req, res) => {
  const { feedback } = req.body;
  try {
    const atendimento = await Atendimento.findByIdAndUpdate(
      req.params.id,
      { feedbackInterno: feedback },
      { new: true }
    );
    res.json({ mensagem: 'Feedback interno salvo', atendimento });
  } catch {
    res.status(500).json({ mensagem: 'Erro ao salvar feedback interno' });
  }
});

router.put('/finalizar/:id', authMiddleware, async (req, res) => {
  try {
    await Atendimento.findByIdAndUpdate(req.params.id, { finalizado: true });
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao finalizar atendimento:", err);
    res.status(500).json({ erro: 'Erro ao finalizar atendimento' });
  }
});

router.get('/historico/:id', authMiddleware, async (req, res) => {
  try {
    const mensagens = await Mensagem.find({ atendimentoId: req.params.id }).sort({ recebidoEm: 1 });
    res.json(mensagens);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
});

// 📤 Exportar atendimentos finalizados para Excel
router.get('/exportar/excel', authMiddleware, async (req, res) => {
  try {
    const atendimentos = await Atendimento.find({ finalizado: true });

    const dados = [];

    for (const atendimento of atendimentos) {
      const mensagens = await Mensagem.find({ atendimentoId: atendimento._id });

      dados.push({
        AtendimentoID: atendimento._id.toString(),
        Grupo: atendimento.grupo,
        Operador: atendimento.operador,
        CriadoEm: atendimento.criadoEm.toISOString(),
        TotalMensagens: mensagens.length
      });
    }

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Atendimentos');

    const tempFile = path.join(os.tmpdir(), `relatorio-atendimentos-${Date.now()}.xlsx`);
    XLSX.writeFile(workbook, tempFile);

    res.download(tempFile, 'relatorio-atendimentos.xlsx', () => {
      fs.unlinkSync(tempFile); // apaga o temporário após download
    });
  } catch (err) {
    console.error('Erro ao exportar:', err);
    res.status(500).json({ erro: 'Erro ao exportar atendimentos' });
  }
});

export default router;
