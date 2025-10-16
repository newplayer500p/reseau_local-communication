// evenement.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const evenementSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  priority: {
    type: String,
    enum: ["Critique", "Haute", "Moyen", "Basse"],
    default: "moyen",
  },
  createdBy: {
    email: { type: String, required: false },
    name: { type: String, required: false },
    userRef: { // Ajoutez une référence à l'utilisateur
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  publishedAt: { type: Date, required: true, default: () => new Date() },
  eventDate: { type: Date, required: false },
  attachments: [
    {
      type: Schema.Types.ObjectId,
      ref: "File",
    },
  ],
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Middleware pre-save pour peupler automatiquement le nom
evenementSchema.pre('save', async function(next) {
  if (this.isNew && this.createdBy.email && !this.createdBy.name) {
    try {
      const User = mongoose.model('User');
      const user = await User.findOne({ email: this.createdBy.email });
      
      if (user) {
        this.createdBy.name = user.nom; // ou user.name selon votre schéma User
        this.createdBy.userRef = user._id; // sauvegarde la référence
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      // Continuer même en cas d'erreur
    }
  }
  next();
});

export const Evenement = model("Evenement", evenementSchema);
export default Evenement;