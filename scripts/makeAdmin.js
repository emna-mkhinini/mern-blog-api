// Script pour créer le PREMIER administrateur
// (l'inscription publique force toujours role = 'user')
// Utilisation : node scripts/makeAdmin.js email@exemple.tn
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.log('Utilisation : node scripts/makeAdmin.js email@exemple.tn');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.log(`Aucun utilisateur trouvé avec l'email ${email}`);
  } else {
    console.log(`${user.name} (${user.email}) est maintenant admin`);
  }

  await mongoose.disconnect();
})();
