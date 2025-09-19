const fs = require("fs");
const path = require("path");
const warnsFile = path.join(__dirname, "../warns.json");

module.exports = {
  name: "unwarn",
  description: "Supprime un warn d'un utilisateur par numéro. - admin only",
  adminOnly: true,
  async execute(message, args) {
    const userId = args[0];
    const number = parseInt(args[1]);

    if (!userId || !number) return message.reply("❌ Usage: +unwarn [id] [numéro]");

    if (!fs.existsSync(warnsFile)) return message.reply("Aucun warn enregistré.");

    const warns = JSON.parse(fs.readFileSync(warnsFile, "utf8"));
    const userWarns = warns[userId];

    if (!userWarns || userWarns.length === 0) return message.reply("Cet utilisateur n'a aucun warn.");
    if (number < 1 || number > userWarns.length) return message.reply("❌ Numéro de warn invalide.");

    const removed = userWarns.splice(number - 1, 1);

    // Si plus de warn, on supprime la clé
    if (userWarns.length === 0) delete warns[userId];

    fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));
    message.reply(`✅ Warn #${number} supprimé pour l'utilisateur <@${userId}> (${removed[0].reason})`);
  }
};
