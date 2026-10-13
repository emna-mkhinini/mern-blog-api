const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const articleRoutes = require('./routes/articleRoutes');
const userRoutes = require('./routes/userRoutes');

// Chargement des variables d’environnement (.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Route principale
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur mon API' });
});

// Montage des routeurs modulaires
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);

// Connexion à MongoDB Atlas puis démarrage du serveur
(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`Serveur MERN en écoute sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Erreur critique de demarrage du serveur :', err.message);
    process.exit(1);
  }
})();