import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIo } from 'socket.io';
import { conectar, getQrCode, getSocket, getConexoes, conexoes } from './services/baileysService.js';
import authMiddleware from './auth/authMiddleware.js';
import authRoutes from './routes/auth.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import usuariosRoutes from './routes/usuarioRoutes.js';
import informacoesRoutes from './routes/informacoesRoutes.js';
import sugestoesRoutes from './routes/sugestoes.js';
import User from './database/models/User.js';
import atendimentosRoutes from './routes/atendimentosRoutes.js';
import compromissoRoutes from './routes/compromissoRoutes.js';
import mensagensRoutes from './routes/mensagens.js';
import metricasRoutes from './routes/metricas.js';


dotenv.config();

const app = express();

const allowedOrigins = [
  'https://gerenciamento-cs-front.onrender.com',
  'http://localhost:3000'
];


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


//const metricasRoutes = require('./routes/metricas.js');


app.options('*', cors()); // ✅ Responde preflight
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/informacoes', informacoesRoutes);
app.use('/api/sugestoes', sugestoesRoutes);
app.use('/api/atendimentos', atendimentosRoutes);
app.use('/api/compromissos', compromissoRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api', metricasRoutes);



// ✅ Criar servidor
const server = http.createServer(app);

// ✅ Configurar Socket.IO

const io = new SocketIo(server, {
  cors: {
    origin: 'https://gerenciamento-cs-front.onrender.com',
    credentials: true
  }
});


export { io };

// Torna o io acessível em req.io dentro de qualquer rota
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  socket.on('join', ({ email }) => {
    if (email) {
      socket.join(email.toLowerCase());
      console.log(`✅ Socket conectado à sala: ${email}`);
    }
  });
});

app.use('/api/whatsapp', whatsappRoutes);



// ✅ Iniciar servidor só depois de criar `server`
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});


// ✅ Conexão MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB conectado com sucesso');
}).catch((err) => {
  console.error('❌ Erro ao conectar no MongoDB:', err);
});


app.get('/api/usuarios/conectados', async (req, res) => {
  try {
    const emails = Object.keys(conexoes);

    const usuarios = await User.find({ email: { $in: emails } });

    const conectados = emails.map(email => {
      const user = usuarios.find(u => u.email === email);
      return {
        email,
        nome: user?.nome || '',
        conectado: true,
        status: user?.status || 'Desconhecido',
      };
    });

    res.json(conectados);
  } catch (error) {
    console.error('Erro ao buscar conectados:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});