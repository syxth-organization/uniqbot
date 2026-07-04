const { EmbedBuilder } = require("discord.js");

async function handleHelpCommand(message) {
  if (message.content.trim() !== "!help") return false;

  const embed = new EmbedBuilder()
    .setTitle("UNIQ Prism Bot Commands")
    .setColor("#2b6cff")
    .setDescription([
      "**Ticket panel**",
      "`!panel` — Send the ticket panel.",
      "",
      "**Support roles**",
      "`!addsupport @role` — Allow a role to view and manage tickets.",
      "`!removesupport @role` — Remove a support role.",
      "`!listsupport` — Show all support roles.",
      "",
      "**Ticket categories**",
      "`!addcategory category_id default` — Set the default ticket category.",
      "`!addcategory category_id report` — Set a category for report tickets.",
      "`!addcategory category_id support` — Set a category for support tickets.",
      "`!addcategory category_id account` — Set a category for account tickets.",
      "`!addcategory category_id partnership` — Set a category for partnership tickets.",
      "`!addcategory category_id other` — Set a category for other tickets.",
      "`!removecategory category_id` — Remove a ticket category.",
      "`!listcategories` — Show ticket categories.",
      "",
      "**Logs and checks**",
      "`!setlogchannel #channel` — Set where transcripts and close logs are sent.",
      "`!logchannel` — Show the current log channel.",
      "`!checkbot` — Check the bot's server and channel permissions."
    ].join("\n"))
    .setFooter({ text: "Most commands require Administrator permission or OWNER_ID." });

  await message.reply({ embeds: [embed] });
  return true;
}

module.exports = {
  handleHelpCommand
};
