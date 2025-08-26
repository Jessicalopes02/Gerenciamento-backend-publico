import mongoose from 'mongoose';

const sugestaoSchema = new mongoose.Schema({
    texto: String,
    aprovado: Boolean,
    historico: [
    {
      autor: String, // 'admin' ou 'usuario'
      mensagem: String,
      data: { type: Date, default: Date.now }
    }
  ]
}, { _id: false });


const atendimentoSchema = new mongoose.Schema({
  grupo: String,
  contato: String, // número ou ID do grupo
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Em atendimento', 'Aguardando', 'Finalizado'], default: 'Em atendimento' },
  respondido: { type: Boolean, default: false },
  ultimoContato: { type: Date, default: Date.now },
  
  mensagens: [{ autor: String, texto: String, data: Date }],
  infoCliente: {
    projeto: String,
    numerario: String,
    atracado: String,
    eta: String,
    adicionais: String,
    pontoAtencao: String,
    canal: String,
    fechamento: String
  }, 

  sugestoes: [
  {
    texto: String,
    aprovado: Boolean,
    historico: [
      {
        autor: String, // 'admin' ou 'usuario'
        mensagem: String,
        data: { type: Date, default: Date.now }
      }
    ]
  }
],
  agenda: [{
    data: String,
    origem: { type: String, enum: ['automático', 'manual'] },
    mensagem: String,
    alerta: [String]
  }],
  }, { timestamps: true });



const Atendimento = mongoose.model('Atendimento', atendimentoSchema);
export default Atendimento;

