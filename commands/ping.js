module.exports = {
  name: "ping",
  description: "Répond Pong !",
  adminOnly: false,
  execute(message, args) {
    message.reply("🏓 Pong !");
  },
};
