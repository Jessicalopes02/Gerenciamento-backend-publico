import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nome: String, // ✅ adicionado
  email: String,
  senha: String,
  perfil: String
});

// Alteração para exportação padrão (default)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
