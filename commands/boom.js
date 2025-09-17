module.exports = {
  name: "boom",
  description: "Fait BOOM !",
  adminOnly: true,
  execute(message, args) {
    message.channel.send("💥 BOOM !");
  },
};
