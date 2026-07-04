const { handlePanelCommand } = require("../features/panel");
const { handleSupportRoleCommands } = require("../features/supportRoles");
const { handleCategoryCommands } = require("../features/categories");
const { handleLogCommands } = require("../features/logs");
const { handleHelpCommand } = require("../features/help");
const { handleDiagnosticsCommand } = require("../features/diagnostics");

function registerMessageCreate(client, db) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith("!")) return;

    try {
      if (await handleHelpCommand(message)) return;
      if (await handleDiagnosticsCommand(message)) return;

      if (message.content.trim() === "!panel") {
        await handlePanelCommand(message);
        return;
      }

      if (await handleSupportRoleCommands(message, db)) return;
      if (await handleCategoryCommands(message, db)) return;
      if (await handleLogCommands(message, db)) return;
    } catch (error) {
      console.error("messageCreate handler error:", error);
      await message.reply("Something went wrong while running that command.").catch(() => {});
    }
  });
}

module.exports = {
  registerMessageCreate
};
