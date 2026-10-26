const Article = require('../models/articleModel');

// 1. Récupérer tous les articles avec les données de l'auteur
// GET /api/articles
const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate('author', 'name email');
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Exercice 2 : Récupérer uniquement les articles de l'utilisateur connecté
// GET /api/articles/my-articles (protégée)
const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id })
      .populate('author', 'name email');

    res.status(200).json({
      total: articles.length,
      articles: articles
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Créer un nouvel article (l'auteur = l'utilisateur connecté)
// POST /api/articles (protégée)
const createArticle = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'title et content sont obligatoires' });
    }

    const newArticle = await Article.create({
      title,
      content,
      author: req.user._id
    });

    const populatedArticle = await newArticle.populate('author', 'name email');
    res.status(201).json(populatedArticle);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// 3. Récupérer un article par son ID
// GET /api/articles/:id
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name email');

    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    res.status(200).json(article);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

// 4. Mettre à jour un article (auteur ou admin)
// PUT /api/articles/:id (protégée)
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Action interdite : vous n'êtes pas l'auteur de cet article"
      });
    }

    article.title = req.body.title || article.title;
    article.content = req.body.content || article.content;

    const updated = await article.save();
    const populated = await updated.populate('author', 'name email role');
    res.status(200).json(populated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

// 5. Supprimer un article (auteur ou admin)
// DELETE /api/articles/:id (protégée)
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Action interdite : vous n'êtes pas l'auteur de cet article"
      });
    }

    await Article.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Article supprimé avec succès', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllArticles,
  getMyArticles,
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle
};
