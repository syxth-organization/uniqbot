const { ChannelType, EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../utils/permissions");
const { saveLogChannelId, getLogChannelId } = require("../utils/firestoreSettings");

function getChannelIdFromCommand(message) {
  const mentioned = message.mentions.channels.first();
  if (mentioned) return mentioned.id;

  const parts = message.content.trim().split(/\s+/);
  return parts[1] || null;
}

async function resolveTextChannel(message) {
  const channelId = getChannelIdFromCommand(message);
  if (!channelId) return null;

  const channel = await message.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return null;

  return channel;
}

async function handleLogCommands(message, db) {
  const content = message.content.trim();

  if (content.startsWith("!setlogchannel")) {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const channel = await resolveTextChannel(message);
    if (!channel) {
      await message.reply("Provide a valid text channel. Example: `!setlogchannel #ticket-logs`.");
      return true;
    }

    await saveLogChannelId(db, channel.id);
    await message.reply(`Ticket logs will be sent to ${channel}.`);
    return true;
  }

  if (content === "!logchannel") {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const channelId = await getLogChannelId(db);
    const embed = new EmbedBuilder()
      .setTitle("Ticket Log Channel")
      .setColor("#2b6cff")
      .setDescription(channelId ? `Current log channel: <#${channelId}>` : "No log channel set. The bot will look for a channel named `ticket-logs`.");

    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

async function findLogChannel(guild, db) {
  const storedLogChannelId = await getLogChannelId(db);
  const envLogChannelId = process.env.TICKET_LOG_CHANNEL_ID || null;
  const preferredId = storedLogChannelId || envLogChannelId;

  if (preferredId) {
    const channel = await guild.channels.fetch(preferredId).catch(() => null);
    if (channel && channel.type === ChannelType.GuildText) return channel;
  }

  return guild.channels.cache.find(
    (channel) => channel.name === "ticket-logs" && channel.type === ChannelType.GuildText
  ) || null;
}

module.exports = {
  handleLogCommands,
  findLogChannel
};
