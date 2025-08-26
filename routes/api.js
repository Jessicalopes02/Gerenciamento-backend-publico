import express from 'express';

// Importa os sub-routers organizados
import authRoutes from './authRoutes.js';
import whatsappRoutes from './whatsappRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import atendimentosRoutes from './atendimentosRoutes.js';
import metricasRoutes from './metricasRoutes.js';
import sugestoesRoutes from './sugestoes.js';

const router = express.Router();

// Monta as rotas
router.use('/auth', authRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/atendimentos', atendimentosRoutes);
router.use('/metricas', metricasRoutes);
router.use('/sugestoes', sugestoesRoutes);

// Qualquer rota adicional específica que você queira manter pode ser declarada aqui (ex.: /informacoes)

export default router;
