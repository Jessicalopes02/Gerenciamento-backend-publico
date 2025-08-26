import mongoose from 'mongoose';

const compromissoSchema = new mongoose.Schema({
  grupo: { type: String, required: true },
  data: { type: Date, required: true },
  descricao: { type: String, required: true },
  origem: { type: String, enum: ['manual', 'automatica'], default: 'manual' },
}, {
  timestamps: true
});

export default mongoose.model('Compromisso', compromissoSchema);
