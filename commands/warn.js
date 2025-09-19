    const fs = require("fs");
    const path = require("path");
    const warnsFile = path.join(__dirname, "../warns.json");

    module.exports = {
      name: "warn",
      description: "Avertit un utilisateur en ajoutant un warn. - admin only",
      adminOnly: true,
      async execute(message, args) {
        const userId = args[0];
        const reason = args.slice(1).join(" ");

        if (!userId || !reason) return message.reply("❌ Usage: +warn [id] [raison]");

        let warns = {};
        if (fs.existsSync(warnsFile)) warns = JSON.parse(fs.readFileSync(warnsFile, "utf8"));

        if (!warns[userId]) warns[userId] = [];
        warns[userId].push({
          reason,
          moderator: message.author.tag,
          date: new Date().toISOString()
        });

        fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));
        message.reply(`✅ Warn ajouté pour l'utilisateur <@${userId}>`);
      }
    };
