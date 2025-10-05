const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

module.exports = {
  name: "ask",
  description: "Pose une question à l'IA et reçois une réponse.",
  adminOnly: false,
  async execute(message, args) {
    if (!args.length) return message.reply("❌ Veuillez poser une question après la commande.");

    const question = args.join(" ");

    // Vérifie si la clé OpenAI est configurée
    if (!process.env.OPENAI_API_KEY) return message.reply("❌ OpenAI n'est pas configuré.");

    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: question }],
        max_tokens: 500,
      });

      const answer = response.data.choices[0].message.content;
      message.reply(`🤖 ${answer}`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Une erreur est survenue lors de la réponse de l'IA.");
    }
  },
};
