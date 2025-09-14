module.exports = {
  name: "boom",
  description: "Fait BOOM !",
  execute(message, args) {
    message.channel.send("💥 BOOM !");
  },
};
