// Commande : !giverolesall
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'giverolesall',
  description: 'Donne tous les rôles du serveur à tous les membres.',
  adminOnly: true,
  async execute(message, args) {
    // Vérifie si l’utilisateur est admin
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
    }

    // Vérifie si le bot a la permission
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Je n’ai pas la permission de gérer les rôles !");
    }

    const roles = message.guild.roles.cache.filter(role => role.editable && role.name !== "@everyone");
    const members = message.guild.members.cache;

    if (roles.size === 0) {
      return message.reply("⚠️ Aucun rôle à donner (ou je ne peux pas les gérer).");
    }

    message.channel.send(`🛠️ Attribution de ${roles.size} rôles à ${members.size} membres...`);

    let count = 0;
    for (const member of members.values()) {
      try {
        await member.roles.add(roles);
        count++;
      } catch (err) {
        console.log(`Erreur pour ${member.user.tag}: ${err.message}`);
      }
    }

    message.channel.send(`✅ Terminé ! ${count} membres ont reçu tous les rôles.`);
  }
};
