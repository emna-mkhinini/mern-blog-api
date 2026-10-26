const express = require('express');
const router = express.Router();

const {
  getAllArticles,
  getMyArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/articleController');
const { protect } = require('../middlewares/authMiddleware');

// Le préfixe '/api/articles' est défini dans server.js :
// ici '/' représente donc '/api/articles'.

// Consultation publique
router.get('/', getAllArticles);

// Exercice 2 : articles de l'utilisateur connecté
// ⚠️ Doit être déclarée AVANT '/:id', sinon "my-articles" serait pris pour un id
router.get('/my-articles', protect, getMyArticles);

router.get('/:id', getArticleById);

// Actions protégées (token JWT obligatoire)
router.post('/', protect, createArticle);
router.put('/:id', protect, updateArticle);
router.delete('/:id', protect, deleteArticle);

module.exports = router;
