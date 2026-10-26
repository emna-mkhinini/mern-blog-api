const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  updatePassword,
  updateUserRole
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Routes d'authentification publiques
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/', registerUser); // POST /api/users (alias de /register)

// Routes privées protégées par token JWT
// ⚠️ Doivent être déclarées AVANT '/:id', sinon "profile" serait pris pour un id
router.get('/profile', protect, getUserProfile);
router.put('/update-password', protect, updatePassword);

// Routes réservées aux administrateurs (JWT valide + rôle admin)
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.delete('/:id', protect, adminOnly, deleteUser);

// Exercice 2 : changer le rôle d'un utilisateur (admin uniquement)
router.put('/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
