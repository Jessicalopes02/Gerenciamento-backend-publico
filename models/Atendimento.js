import mongoose from 'mongoose';

const mensagemSchema = new mongoose.Schema({
  autor: {
    type: String,
    enum: ['cliente', 'operador'],
    required: true
  },
  texto: {
    type: String,
    required: true
  },
  data: {
    type: Date,
    required: true
  }
});

const atendimentoSchema = new mongoose.Schema({
  grupo: {
    type: String,
    required: true
  },
  operador: {
    type: String // email ou nome do operador
  },
  status: {
    type: String,
    enum: ['Em atendimento', 'Aguardando', 'Finalizado'],
    default: 'Em atendimento'
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  finalizado: {
    type: Boolean,
    default: false
  },
  mensagens: [mensagemSchema]
});

const Atendimento = mongoose.model('Atendimento', atendimentoSchema);
export default Atendimento;
