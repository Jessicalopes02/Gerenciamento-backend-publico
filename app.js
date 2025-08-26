import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import atendimentoRoutes from './routes/atendimentosRoutes.js';
import metricasRoutes from './routes/metricasRoutes.js';
import sugestoesRoutes from './routes/sugestoes.js';
import atendimentos from './routes/atendimentos.js';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conectando ao MongoDB
  console.log('🔧 Registrando rotas de WhatsApp...');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/sugestoes', sugestoesRoutes);
app.use('/api/atendimentos', atendimentos);


export default app;