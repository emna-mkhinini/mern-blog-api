const User = require("../models/usermodel");


// 1. Récupérer tous les utilisateurs
// GET /api/users
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;

        const filtre = role ? { role } : {};

        const users = await User.find(filtre);

        res.status(200).json({
            total: users.length,
            users: users
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// 2. Récupérer un utilisateur par ID
// GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                error: "Utilisateur introuvable"
            });
        }

        res.status(200).json(user);
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({
                error: "Identifiant invalide"
            });
        }

        res.status(500).json({
            message: err.message
        });
    }
};

// 3. Créer un utilisateur
// POST /api/users
const createUser = async (req, res) => {
    try {
        const { name, email, age, role } = req.body;

        // Vérifier les champs obligatoires
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                error: "Le nom et l'email sont obligatoires"
            });
        }

        // Vérifier le format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const emailNormalise = email.trim().toLowerCase();

        if (!emailRegex.test(emailNormalise)) {
            return res.status(400).json({
                error: "L'email est invalide"
            });
        }

        // Vérifier si l'email existe déjà
        const exists = await User.findOne({
            email: emailNormalise
        });

        if (exists) {
            return res.status(409).json({
                error: "Cet email est déjà utilisé"
            });
        }

        // Créer un nouvel utilisateur
        const user = await User.create({
            name: name.trim(),
            email: emailNormalise,
            age,
            role: role || "user"
        });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            user: user
        });
    } catch (err) {
        // Gérer les erreurs de validation Mongoose
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: err.message
            });
        }

        // Gérer les erreurs de doublon MongoDB
        if (err.code === 11000) {
            return res.status(409).json({
                error: "Cet email est déjà utilisé"
            });
        }

        res.status(500).json({
            message: err.message
        });
    }
};

// 4. Supprimer un utilisateur
// DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                error: "Utilisateur introuvable"
            });
        }

        res.status(200).json({
            message: "Utilisateur supprimé avec succès",
            user: user
        });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({
                error: "Identifiant invalide"
            });
        }

        res.status(500).json({
            message: err.message
        });
    }
};

// Exporter les fonctions du contrôleur
module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    deleteUser
};