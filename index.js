const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");

const transcript = require("discord-html-transcripts");
const admin = require("firebase-admin");
const config = require("./config.json");

/* ================= FIREBASE ================= */

const serviceAccount = process.env.FIREBASE_KEY
  ? JSON.parse(process.env.FIREBASE_KEY)
  : require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* ================= DISCORD ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= HELPERS ================= */

function isAdmin(member, message) {
  return (
    member.permissions.has("Administrator") ||
    message.author.id === config.ownerId
  );
}

async function getSupportRoles() {
  const doc = await db.collection("settings").doc("supportRoles").get();
  return doc.exists ? doc.data().roles || [] : [];
}

async function getTicketCategories() {
  const doc = await db.collection("settings").doc("ticketCategories").get();
  return doc.exists ? doc.data().categories || [] : [];
}

/* ================= READY ================= */

client.once("ready", () => {
  console.log(`UNIQ Prism online as ${client.user.tag}`);
});

/* ================= COMMANDS ================= */

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  /* PANEL */
  if (message.content === "!panel") {
    const embed = new EmbedBuilder()
      .setTitle("💎 UNIQ PRISM SUPPORT CORE")
      .setDescription(
        "Welcome to UNIQ Prism Support System.\n\nPress the button below to create a Crystal Ticket."
      )
      .setColor("#2b6cff");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("Open Crystal Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  /* SUPPORT ROLES */
  if (message.content.startsWith("!addsupport")) {
    if (!isAdmin(message.member, message))
      return message.reply("No permission.");

    const role = message.mentions.roles.first();
    if (!role) return message.reply("Mention a role.");

    const ref = db.collection("settings").doc("supportRoles");
    const doc = await ref.get();

    let roles = doc.exists ? doc.data().roles : [];

    if (!roles.includes(role.id)) roles.push(role.id);

    await ref.set({ roles });

    return message.reply(`Added support role: ${role.name}`);
  }

  if (message.content.startsWith("!removesupport")) {
    if (!isAdmin(message.member, message))
      return message.reply("No permission.");

    const role = message.mentions.roles.first();
    if (!role) return message.reply("Mention a role.");

    const ref = db.collection("settings").doc("supportRoles");
    const doc = await ref.get();

    let roles = doc.exists ? doc.data().roles : [];

    roles = roles.filter(r => r !== role.id);

    await ref.set({ roles });

    return message.reply(`Removed support role: ${role.name}`);
  }

  if (message.content === "!listsupport") {
    if (!isAdmin(message.member, message))
      return message.reply("No permission.");

    const roles = await getSupportRoles();
    return message.reply(roles.map(r => `<@&${r}>`).join("\n"));
  }

  /* CATEGORY SYSTEM */
  if (message.content.startsWith("!addcategory")) {
    if (!isAdmin(message.member, message))
      return message.reply("No permission.");

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Mention a category.");

    const ref = db.collection("settings").doc("ticketCategories");
    const doc = await ref.get();

    let categories = doc.exists ? doc.data().categories : [];

    if (!categories.find(c => c.id === channel.id)) {
      categories.push({ id: channel.id, name: channel.name });
    }

    await ref.set({ categories });

    return message.reply(`Added category: ${channel.name}`);
  }

  if (message.content.startsWith("!removecategory")) {
    if (!isAdmin(message.member, message))
      return message.reply("No permission.");

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Mention a category.");

    const ref = db.collection("settings").doc("ticketCategories");
    const doc = await ref.get();

    let categories = doc.exists ? doc.data().categories : [];

    categories = categories.filter(c => c.id !== channel.id);

    await ref.set({ categories });

    return message.reply(`Removed category: ${channel.name}`);
  }

  if (message.content === "!listcategories") {
    if (!isAdmin(message.member, message))
      return message.reply("No permission.");

    const categories = await getTicketCategories();
    return message.reply(categories.map(c => c.name).join("\n"));
  }
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async (interaction) => {

  /* ================= CREATE TICKET ================= */
  if (interaction.customId === "create_ticket") {

    await interaction.deferReply({ ephemeral: true });

    const existing = await db.collection("tickets")
      .where("userId", "==", interaction.user.id)
      .where("status", "==", "open")
      .get();

    if (!existing.empty) {
      return interaction.editReply({
        content: "You already have an open ticket."
      });
    }

    const supportRoles = await getSupportRoles();

    const supportPerms = supportRoles.map(roleId => ({
      id: roleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }));

    const categories = await getTicketCategories();
    const parent = categories.length > 0 ? categories[0].id : null;

    const channel = await interaction.guild.channels.create({
      name: `crystal-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent,
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
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        ...supportPerms
      ]
    });

    await db.collection("tickets").doc(channel.id).set({
      userId: interaction.user.id,
      status: "open",
      type: null,
      channelId: channel.id
    });

    /* ================= TYPE MENU ================= */

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_type")
        .setPlaceholder("Select ticket type")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Report Issue")
            .setValue("report"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Support Help")
            .setValue("support"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Other")
            .setValue("other")
        )
    );

    const embed = new EmbedBuilder()
      .setTitle("Crystal Ticket Created")
      .setDescription("Select the type of support you need.")
      .setColor("#00aaff");

    const close = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [embed],
      components: [menu, close]
    });

    return interaction.editReply({
      content: `Ticket created: ${channel}`
    });
  }

  /* ================= TYPE SELECT ================= */
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_type") {

    const value = interaction.values[0];

    await db.collection("tickets")
      .doc(interaction.channel.id)
      .update({ type: value });

    return interaction.reply({
      content: `Ticket type set to: ${value}`,
      ephemeral: true
    });
  }

  /* ================= CLOSE TICKET ================= */
  if (interaction.customId === "close_ticket") {

    const channel = interaction.channel;

    await db.collection("tickets").doc(channel.id).update({
      status: "closed"
    });

    const file = await transcript.createTranscript(channel);

    const logChannel = interaction.guild.channels.cache.find(
      c => c.name === "ticket-logs"
    );

    if (logChannel) {
      logChannel.send({
        content: `Transcript: ${channel.name}`,
        files: [file]
      });
    }

    await interaction.reply({
      content: "Closing ticket...",
      ephemeral: true
    });

    setTimeout(() => channel.delete().catch(() => {}), 3000);
  }
});

/* ================= LOGIN (ENV READY) ================= */

client.login(process.env.DISCORD_TOKEN || config.token);