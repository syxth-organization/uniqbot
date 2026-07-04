const { ChannelType, EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../utils/permissions");
const { getTicketType, TICKET_TYPES } = require("../utils/ticketTypes");
const { getTicketCategories, saveTicketCategories } = require("../utils/firestoreSettings");

function getChannelIdFromCommand(message) {
  const mentioned = message.mentions.channels.first();
  if (mentioned) return mentioned.id;

  const parts = message.content.trim().split(/\s+/);
  return parts[1] || null;
}

function getTypeFromCommand(message) {
  const parts = message.content.trim().split(/\s+/);
  const rawType = (parts[2] || "default").toLowerCase();

  if (rawType === "default") return "default";

  const validTypes = TICKET_TYPES.map((type) => type.value);
  return validTypes.includes(rawType) ? rawType : null;
}

async function resolveCategory(message) {
  const channelId = getChannelIdFromCommand(message);
  if (!channelId) return null;

  const channel = await message.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildCategory) return null;

  return channel;
}

function formatCategoryLine(category) {
  const type = category.type && category.type !== "default" ? getTicketType(category.type).label : "Default";
  return `• **${category.name}** \`${category.id}\` — ${type}`;
}

async function handleCategoryCommands(message, db) {
  const content = message.content.trim();

  if (content.startsWith("!addcategory")) {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const category = await resolveCategory(message);
    const type = getTypeFromCommand(message);

    if (!category) {
      await message.reply("Provide a valid category ID. Example: `!addcategory 123456789012345678 report`.");
      return true;
    }

    if (!type) {
      await message.reply("Invalid type. Use: `default`, `report`, `support`, `account`, `partnership`, or `other`.");
      return true;
    }

    const categories = await getTicketCategories(db);
    const filtered = categories.filter((item) => item.id !== category.id);
    filtered.push({ id: category.id, name: category.name, type });

    await saveTicketCategories(db, filtered);
    await message.reply(`Added ticket category: ${category.name} (${type}).`);
    return true;
  }

  if (content.startsWith("!removecategory")) {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const category = await resolveCategory(message);
    if (!category) {
      await message.reply("Provide a valid category ID. Example: `!removecategory 123456789012345678`.");
      return true;
    }

    const categories = await getTicketCategories(db);
    const updatedCategories = categories.filter((item) => item.id !== category.id);

    await saveTicketCategories(db, updatedCategories);
    await message.reply(`Removed ticket category: ${category.name}`);
    return true;
  }

  if (content === "!listcategories") {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const categories = await getTicketCategories(db);
    const embed = new EmbedBuilder()
      .setTitle("Ticket Categories")
      .setColor("#2b6cff")
      .setDescription(categories.length ? categories.map(formatCategoryLine).join("\n") : "No ticket categories set.");

    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

module.exports = {
  handleCategoryCommands
};
