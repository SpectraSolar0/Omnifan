module.exports = {
  name: "invit",
  description: "Ajoute le bot sur un serveur via un lien d'invitation. - admin only",
  adminOnly: true,
  async execute(message, args) {
    // Vérifie si un lien d'invitation est fourni
    const inviteLink = args[0];
    if (!inviteLink) {
      return message.reply("❌ Merci de fournir un lien d'invitation.\nExemple : `+invit https://discord.gg/abcdef`");
    }

    // Vérifie que le lien ressemble à une invitation Discord valide
    const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/;
    if (!inviteRegex.test(inviteLink)) {
      return message.reply("❌ Le lien fourni n'est pas une invitation Discord valide !");
    }

    try {
      // Envoi d'un message de confirmation
      await message.reply(`🔗 Tentative d'ajout du bot sur le serveur via : ${inviteLink}\n*(ouvre ce lien dans ton navigateur pour l'ajouter)*`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Une erreur est survenue lors du traitement de l'invitation.");
    }
  }
};
