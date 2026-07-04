const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const transcript = require("discord-html-transcripts");
const {
  getSupportRoles,
  getTicketCategories,
  getCategoryForType
} = require("../utils/firestoreSettings");
const { TICKET_TYPES, getTicketType, formatTicketType } = require("../utils/ticketTypes");
const { canManageTicket, isSupportStaff } = require("../utils/permissions");
const { discordTime, humanDuration } = require("../utils/time");
const { findLogChannel } = require("./logs");

function createTicketTypeSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("ticket_create_type")
      .setPlaceholder("Choose the type of ticket you need")
      .addOptions(
        TICKET_TYPES.map((type) => new StringSelectMenuOptionBuilder()
          .setLabel(type.label)
          .setDescription(type.description)
          .setEmoji(type.emoji)
          .setValue(type.value))
      )
  );
}

function createTicketButtons(ticketData = {}) {
  const claimed = Boolean(ticketData.claimedBy);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("claim_ticket")
      .setLabel(claimed ? "Claimed" : "Claim Ticket")
      .setStyle(claimed ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
  );
}

function createCloseConfirmButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("confirm_close_ticket")
      .setLabel("Confirm Close")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("cancel_close_ticket")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary)
  );
}

function cleanChannelName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "user";
}

function buildTicketEmbed(ticketData) {
  const type = getTicketType(ticketData.type);
  const status = ticketData.status || "open";
  const statusLabel = status === "closed" ? "Closed" : ticketData.claimedBy ? "In Progress" : "Open";
  const color = status === "closed" ? "#e74c3c" : ticketData.claimedBy ? "#f1c40f" : "#00aaff";

  const embed = new EmbedBuilder()
    .setTitle(`${type.emoji} ${type.label}`)
    .setDescription([
      `Hello <@${ticketData.userId}>. A support staff member will assist you here.`,
      "",
      "Please explain your concern clearly. Add screenshots or files if they help."
    ].join("\n"))
    .setColor(color)
    .addFields(
      { name: "Status", value: statusLabel, inline: true },
      { name: "Type", value: formatTicketType(ticketData.type), inline: true },
      { name: "Opened by", value: `<@${ticketData.userId}>`, inline: true },
      { name: "Claimed by", value: ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : "Not claimed yet", inline: true },
      { name: "Created", value: ticketData.createdAt ? discordTime(ticketData.createdAt, "R") : "Now", inline: true },
      { name: "Ticket ID", value: ticketData.channelId ? `\`${ticketData.channelId}\`` : "Pending", inline: true }
    )
    .setFooter({ text: "UNIQ Prism Support System" });

  return embed;
}

function buildTicketLogEmbed(ticketData, channel, closerId, closedAt) {
  const createdAt = ticketData.createdAt || closedAt;

  return new EmbedBuilder()
    .setTitle("Ticket Closed")
    .setColor("#e74c3c")
    .addFields(
      { name: "Ticket", value: `#${channel.name}`, inline: true },
      { name: "Type", value: formatTicketType(ticketData.type), inline: true },
      { name: "Duration", value: humanDuration(createdAt, closedAt), inline: true },
      { name: "Opened by", value: `<@${ticketData.userId}>`, inline: true },
      { name: "Closed by", value: `<@${closerId}>`, inline: true },
      { name: "Claimed by", value: ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : "Not claimed", inline: true },
      { name: "Created", value: discordTime(createdAt, "F"), inline: false },
      { name: "Closed", value: discordTime(closedAt, "F"), inline: false }
    )
    .setFooter({ text: `Ticket ID: ${channel.id}` });
}

async function getOpenTicketForUser(db, userId) {
  return db.collection("tickets")
    .where("userId", "==", userId)
    .where("status", "==", "open")
    .limit(1)
    .get();
}

async function getTicketData(db, channelId) {
  const doc = await db.collection("tickets").doc(channelId).get();
  return doc.exists ? doc.data() : null;
}

async function updateTicketControlMessage(channel, ticketData) {
  if (!ticketData.controlMessageId) return;

  const message = await channel.messages.fetch(ticketData.controlMessageId).catch(() => null);
  if (!message) return;

  await message.edit({
    embeds: [buildTicketEmbed(ticketData)],
    components: ticketData.status === "closed" ? [] : [createTicketButtons(ticketData)]
  }).catch(() => {});
}

async function handleCreateTicketPrompt(interaction, db) {
  const existing = await getOpenTicketForUser(db, interaction.user.id);

  if (!existing.empty) {
    const ticket = existing.docs[0].data();
    await interaction.reply({
      content: ticket.channelId ? `You already have an open ticket: <#${ticket.channelId}>` : "You already have an open ticket.",
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Create a Ticket")
    .setDescription("Choose the type of support you need. The bot will create a private ticket after you select one.")
    .setColor("#2b6cff");

  await interaction.reply({
    embeds: [embed],
    components: [createTicketTypeSelectMenu()],
    ephemeral: true
  });
}

async function handleTicketCreateTypeSelect(interaction, db) {
  await interaction.deferReply({ ephemeral: true });

  const typeValue = interaction.values[0];
  const ticketType = getTicketType(typeValue);
  const existing = await getOpenTicketForUser(db, interaction.user.id);

  if (!existing.empty) {
    const ticket = existing.docs[0].data();
    await interaction.editReply({
      content: ticket.channelId ? `You already have an open ticket: <#${ticket.channelId}>` : "You already have an open ticket."
    });
    return;
  }

  const supportRoles = await getSupportRoles(db);
  const supportPerms = supportRoles.map((roleId) => ({
    id: roleId,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.EmbedLinks
    ]
  }));

  const categories = await getTicketCategories(db);
  const parent = getCategoryForType(categories, typeValue);
  const safeUsername = cleanChannelName(interaction.user.username);

  const channel = await interaction.guild.channels.create({
    name: `${ticketType.value}-${safeUsername}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: parent || undefined,
    topic: `Ticket for ${interaction.user.tag} (${interaction.user.id}) | Type: ${ticketType.label}`,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks
        ]
      },
      ...supportPerms
    ]
  });

  const now = new Date().toISOString();
  const ticketData = {
    userId: interaction.user.id,
    username: interaction.user.tag,
    status: "open",
    type: typeValue,
    channelId: channel.id,
    createdAt: now,
    claimedBy: null,
    controlMessageId: null
  };

  const controlMessage = await channel.send({
    content: `<@${interaction.user.id}>`,
    embeds: [buildTicketEmbed(ticketData)],
    components: [createTicketButtons(ticketData)]
  });

  ticketData.controlMessageId = controlMessage.id;
  await db.collection("tickets").doc(channel.id).set(ticketData);

  await interaction.editReply({ content: `Ticket created: ${channel}` });
}

async function handleClaimTicket(interaction, db) {
  await interaction.deferReply({ ephemeral: true });

  const ticketData = await getTicketData(db, interaction.channel.id);
  if (!ticketData || ticketData.status !== "open") {
    await interaction.editReply({ content: "This is not an open ticket." });
    return;
  }

  if (!(await isSupportStaff(interaction.member, db))) {
    await interaction.editReply({ content: "Only support staff can claim tickets." });
    return;
  }

  if (ticketData.claimedBy) {
    await interaction.editReply({ content: `This ticket is already claimed by <@${ticketData.claimedBy}>.` });
    return;
  }

  const updatedTicket = {
    ...ticketData,
    claimedBy: interaction.user.id,
    claimedAt: new Date().toISOString()
  };

  await db.collection("tickets").doc(interaction.channel.id).set(updatedTicket, { merge: true });
  await updateTicketControlMessage(interaction.channel, updatedTicket);

  await interaction.channel.send(`Ticket claimed by <@${interaction.user.id}>.`).catch(() => {});
  await interaction.editReply({ content: "Ticket claimed." });
}

async function handleCloseTicketRequest(interaction, db) {
  const ticketData = await getTicketData(db, interaction.channel.id);

  if (!ticketData || ticketData.status !== "open") {
    await interaction.reply({ content: "This is not an open ticket.", ephemeral: true });
    return;
  }

  if (!(await canManageTicket(interaction, db, ticketData))) {
    await interaction.reply({ content: "You do not have permission to close this ticket.", ephemeral: true });
    return;
  }

  await interaction.reply({
    content: "Are you sure you want to close this ticket? A transcript will be saved before deletion.",
    components: [createCloseConfirmButtons()],
    ephemeral: true
  });
}

async function handleCancelCloseTicket(interaction) {
  await interaction.update({
    content: "Close cancelled.",
    components: []
  });
}

async function handleConfirmCloseTicket(interaction, db) {
  await interaction.deferUpdate();

  const channel = interaction.channel;
  const ticketData = await getTicketData(db, channel.id);

  if (!ticketData || ticketData.status !== "open") {
    await interaction.editReply({ content: "This ticket is no longer open.", components: [] });
    return;
  }

  if (!(await canManageTicket(interaction, db, ticketData))) {
    await interaction.editReply({ content: "You do not have permission to close this ticket.", components: [] });
    return;
  }

  const closedAt = new Date().toISOString();
  const closedTicketData = {
    ...ticketData,
    status: "closed",
    closedAt,
    closedBy: interaction.user.id
  };

  await db.collection("tickets").doc(channel.id).set(closedTicketData, { merge: true });
  await updateTicketControlMessage(channel, closedTicketData);

  await interaction.editReply({ content: "Closing ticket. Saving transcript now...", components: [] });

  const logChannel = await findLogChannel(interaction.guild, db);

  if (logChannel) {
    try {
      const file = await transcript.createTranscript(channel, {
        limit: -1,
        filename: `${channel.name}-transcript.html`,
        saveImages: true,
        poweredBy: false
      });

      await logChannel.send({
        embeds: [buildTicketLogEmbed(closedTicketData, channel, interaction.user.id, closedAt)],
        files: [file]
      });
    } catch (error) {
      console.error(`Failed to create transcript for ${channel.id}:`, error);
      await logChannel.send(`Failed to create transcript for #${channel.name}.`).catch(() => {});
    }
  } else {
    console.warn(`Ticket ${channel.id} closed but no log channel was found.`);
  }

  await channel.send("Ticket closed. This channel will be deleted in 5 seconds.").catch(() => {});
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

module.exports = {
  handleCreateTicketPrompt,
  handleTicketCreateTypeSelect,
  handleClaimTicket,
  handleCloseTicketRequest,
  handleConfirmCloseTicket,
  handleCancelCloseTicket
};
