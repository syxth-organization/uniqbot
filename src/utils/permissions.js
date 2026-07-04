const { PermissionsBitField } = require("discord.js");
const { getOwnerId } = require("../config/env");
const { getSupportRoles } = require("./firestoreSettings");

function isAdmin(member, userId) {
  if (!member) return false;

  const ownerId = getOwnerId();

  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    Boolean(ownerId && userId === ownerId)
  );
}

async function isSupportStaff(member, db) {
  if (!member) return false;
  if (isAdmin(member, member.id)) return true;

  const supportRoles = await getSupportRoles(db);
  return supportRoles.some((roleId) => member.roles.cache.has(roleId));
}

async function canManageTicket(interaction, db, ticketData) {
  if (!interaction.member) return false;
  if (await isSupportStaff(interaction.member, db)) return true;
  return Boolean(ticketData && ticketData.userId === interaction.user.id);
}

function checkBotPermissions(channel, botMember) {
  const required = [
    { name: "Manage Channels", flag: PermissionsBitField.Flags.ManageChannels, scope: "guild" },
    { name: "View Channels", flag: PermissionsBitField.Flags.ViewChannel, scope: "channel" },
    { name: "Send Messages", flag: PermissionsBitField.Flags.SendMessages, scope: "channel" },
    { name: "Embed Links", flag: PermissionsBitField.Flags.EmbedLinks, scope: "channel" },
    { name: "Attach Files", flag: PermissionsBitField.Flags.AttachFiles, scope: "channel" },
    { name: "Read Message History", flag: PermissionsBitField.Flags.ReadMessageHistory, scope: "channel" },
    { name: "Manage Messages", flag: PermissionsBitField.Flags.ManageMessages, scope: "channel" }
  ];

  const channelPermissions = channel.permissionsFor(botMember);

  return required.map((item) => {
    const source = item.scope === "guild" ? botMember.permissions : channelPermissions;
    return {
      name: item.name,
      ok: Boolean(source && source.has(item.flag))
    };
  });
}

module.exports = {
  isAdmin,
  isSupportStaff,
  canManageTicket,
  checkBotPermissions
};
