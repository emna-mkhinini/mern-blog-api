const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Utilitaire de génération de Token JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};

// 1. Récupérer tous les utilisateurs

const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filtre = role ? { role } : {};
        const users = await User.find(filtre).select('-password');

        res.status(200).json({
            total: users.length,
            users: users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.status(200).json(user);
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Identifiant invalide" });
        }
        res.status(500).json({ message: err.message });
    }
};

// 3. Créer un utilisateur
const createUser = async (req, res) => {
    try {
        // Exercice 2 : on ne lit PAS le champ role depuis req.body
        const { name, email, password, age } = req.body;

        // Vérifier les champs obligatoires
        if (
            typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof password !== "string" || !password.trim()
        ) {
            return res.status(400).json({
                error: "Le nom, l'email et le mot de passe sont obligatoires"
            });
        }

        // Vérifier la longueur du mot de passe (avant hachage !)
        if (password.length < 6) {
            return res.status(400).json({
                error: "Le mot de passe doit comporter au moins 6 caractères"
            });
        }

        // Vérifier le format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailNormalise = email.trim().toLowerCase();

        if (!emailRegex.test(emailNormalise)) {
            return res.status(400).json({ error: "L'email est invalide" });
        }

        // Vérifier si l'email existe déjà
        const exists = await User.findOne({ email: emailNormalise });
        if (exists) {
            return res.status(409).json({ error: "Cet email est déjà utilisé" });
        }

        // Hachage sécurisé avec sel (Salt factor = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: emailNormalise,
            password: hashedPassword,
            age,
            role: 'user'
        });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: "Cet email est déjà utilisé" });
        }
        return res.status(500).json({ message: err.message });
    }
};

// 4. Supprimer un utilisateur

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.status(200).json({
            message: "Utilisateur supprimé avec succès",
            user: user
        });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Identifiant invalide" });
        }
        res.status(500).json({ message: err.message });
    }
};

// 5. Connexion

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email: String(email).trim().toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        // Comparaison sécurisée du mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getUserProfile = async (req, res) => {
    res.status(200).json(req.user);
};

// 7. Mise à jour du mot de passe

const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "oldPassword et newPassword sont obligatoires" });
        }

        // Vérifier la longueur du nouveau mot de passe
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Le nouveau mot de passe doit comporter au moins 6 caractères" });
        }

        const user = await User.findById(req.user._id);

        // Comparer l'ancien mot de passe avec celui stocké en base
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Ancien mot de passe incorrect" });
        }

        // Générer un nouveau sel et hacher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Sauvegarder l'utilisateur
        await user.save();

        res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        // Vérifier que le rôle demandé est autorisé
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Le rôle doit être 'user' ou 'admin'" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        res.status(200).json({
            message: `Rôle de ${user.name} mis à jour en '${user.role}'`,
            user: user
        });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Identifiant invalide" });
        }
        res.status(500).json({ message: err.message });
    }
};

// Exporter les fonctions du contrôleur
module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    registerUser: createUser,
    deleteUser,
    loginUser,
    getUserProfile,
    updatePassword,
    updateUserRole
};
