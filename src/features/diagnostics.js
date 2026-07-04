const { EmbedBuilder } = require("discord.js");
const { isAdmin, checkBotPermissions } = require("../utils/permissions");

async function handleDiagnosticsCommand(message) {
  if (message.content.trim() !== "!checkbot") return false;

  if (!isAdmin(message.member, message.author.id)) {
    await message.reply("No permission.");
    return true;
  }

  const botMember = message.guild.members.me || await message.guild.members.fetchMe();
  const results = checkBotPermissions(message.channel, botMember);
  const missing = results.filter((item) => !item.ok);

  const embed = new EmbedBuilder()
    .setTitle("Bot Permission Check")
    .setColor(missing.length ? "#ff9f1c" : "#2ecc71")
    .setDescription(results.map((item) => `${item.ok ? "✅" : "❌"} ${item.name}`).join("\n"))
    .setFooter({ text: missing.length ? "Fix missing permissions before deploying or testing tickets." : "All required permissions are available here." });

  await message.reply({ embeds: [embed] });
  return true;
}

module.exports = {
  handleDiagnosticsCommand
};
