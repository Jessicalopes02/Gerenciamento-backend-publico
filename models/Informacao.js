import mongoose from 'mongoose';

const informacaoSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  mensagem: { type: String, required: true },
}, { timestamps: true });

const Informacao = mongoose.model('Informacao', informacaoSchema);

export default Informacao;
