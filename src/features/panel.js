const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");
const { isAdmin } = require("../utils/permissions");

function createPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("💎 UNIQ Prism Support Center")
    .setDescription([
      "Need help? Open a private ticket and wait for a support staff member.",
      "",
      "**Available support**",
      "• Report Issue",
      "• Support Help",
      "• Account Concern",
      "• Partnership",
      "• Other Concerns",
      "",
      "Please do not open duplicate tickets."
    ].join("\n"))
    .setColor("#2b6cff")
    .setFooter({ text: "UNIQ Prism Support System" });
}

function createPanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Open Ticket")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("support_guide")
      .setLabel("Support Guide")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function handlePanelCommand(message) {
  if (!isAdmin(message.member, message.author.id)) {
    await message.reply("No permission. Only administrators can send the support panel.");
    return;
  }

  await message.channel.send({ embeds: [createPanelEmbed()], components: [createPanelButtons()] });
  await message.reply("Support panel sent.").catch(() => {});
}

async function handleSupportGuide(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("Support Guide")
    .setDescription([
      "Before opening a ticket, prepare the details staff will need.",
      "",
      "**For reports:** describe what happened, when it happened, and include screenshots if available.",
      "**For account concerns:** do not send passwords or private recovery codes.",
      "**For partnerships:** include the purpose and the person or group involved.",
      "",
      "Use one ticket per concern so staff can track it properly."
    ].join("\n"))
    .setColor("#5865f2");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
  handlePanelCommand,
  handleSupportGuide,
  createPanelEmbed,
  createPanelButtons
};
