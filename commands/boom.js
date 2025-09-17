module.exports = {
  name: "boom",
  description: "Fait BOOM !",
  adminOnly: false,
  execute(message, args) {
    message.channel.send("💥 BOOM !");
  },
};
