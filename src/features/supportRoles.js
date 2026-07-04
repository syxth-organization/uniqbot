const { EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../utils/permissions");
const { getSupportRoles, saveSupportRoles } = require("../utils/firestoreSettings");

async function handleSupportRoleCommands(message, db) {
  const content = message.content.trim();

  if (content.startsWith("!addsupport")) {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const role = message.mentions.roles.first();
    if (!role) {
      await message.reply("Mention a support role. Example: `!addsupport @Support`.");
      return true;
    }

    const roles = await getSupportRoles(db);
    if (!roles.includes(role.id)) roles.push(role.id);

    await saveSupportRoles(db, roles);
    await message.reply(`Added support role: ${role.name}`);
    return true;
  }

  if (content.startsWith("!removesupport")) {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const role = message.mentions.roles.first();
    if (!role) {
      await message.reply("Mention a support role. Example: `!removesupport @Support`.");
      return true;
    }

    const roles = await getSupportRoles(db);
    const updatedRoles = roles.filter((roleId) => roleId !== role.id);

    await saveSupportRoles(db, updatedRoles);
    await message.reply(`Removed support role: ${role.name}`);
    return true;
  }

  if (content === "!listsupport") {
    if (!isAdmin(message.member, message.author.id)) {
      await message.reply("No permission.");
      return true;
    }

    const roles = await getSupportRoles(db);
    const embed = new EmbedBuilder()
      .setTitle("Support Roles")
      .setColor("#2b6cff")
      .setDescription(roles.length ? roles.map((roleId) => `<@&${roleId}>`).join("\n") : "No support roles set.");

    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

module.exports = {
  handleSupportRoleCommands
};
