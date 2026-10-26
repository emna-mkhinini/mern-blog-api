// 1) protect   : vérifie la présence et la validité du token JWT
// 2) adminOnly : contrôle le rôle (réservé aux admins)
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// 1. Protection des routes privées : vérifie la validité du JWT
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Si aucun en-tête Authorization "Bearer ..." n'est fourni
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé, aucun token fourni' });
  }

  try {
    // Extraction du token (après "Bearer ")
    const token = authHeader.split(' ')[1];

    // Vérification cryptographique de la signature avec le secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupération de l'utilisateur associé (sans le mot de passe)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé, utilisateur introuvable' });
    }

    return next();
  } catch (err) {

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Votre session a expiré, veuillez vous reconnecter' });
    }

    // Autres erreurs : signature invalide, token modifié, mal formé...
    return res.status(401).json({ message: 'Non autorisé, token invalide' });
  }
};

// 2. Contrôle d'accès basé sur les rôles (RBAC) : réservé aux admins
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Accès refusé : droits administrateur requis' });
};

module.exports = { protect, adminOnly };
