const OpenAI = require("openai");

module.exports = {
  name: "ask",
  description: "Pose une question à l'IA OpenAI.",
  async execute(message, args) {
    if (!args.length) {
      return message.reply("❌ Merci d’entrer une question !");
    }

    // Crée le client OpenAI avec la clé depuis Render (variable d’environnement)
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const question = args.join(" ");

    try {
      // Envoie la requête au modèle GPT-4o-mini (rapide et bon marché)
      const response = await client.responses.create({
        model: "gpt-4o-mini",
        input: question,
      });

      const reply = response.output[0]?.content[0]?.text || "Aucune réponse générée.";
      message.reply(`💬 **Réponse :** ${reply}`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Une erreur est survenue lors de la communication avec OpenAI.");
    }
  },
};
