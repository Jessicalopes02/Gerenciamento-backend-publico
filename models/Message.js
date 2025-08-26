import mongoose from 'mongoose';

const mensagemSchema = new mongoose.Schema({
  atendimentoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Atendimento' },
  autor: { type: String, enum: ['cliente', 'operador'] },
  texto: String,
  grupo: String,
  remetente: String,
  respondido: { type: Boolean, default: false },
  recebidoEm: { type: Date, default: Date.now },
  horaEnvio: { type: Date, default: Date.now },
  tempoResposta: String, // Tempo de resposta calculado
  sentimento: String, 
});

const Message = mongoose.model('Mensagem', mensagemSchema);

export default Message;