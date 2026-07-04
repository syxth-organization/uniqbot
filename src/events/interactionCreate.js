const { handleSupportGuide } = require("../features/panel");
const {
  handleCreateTicketPrompt,
  handleTicketCreateTypeSelect,
  handleClaimTicket,
  handleCloseTicketRequest,
  handleConfirmCloseTicket,
  handleCancelCloseTicket
} = require("../features/tickets");

async function safeInteractionError(interaction) {
  const reply = {
    content: "Something went wrong while processing this action.",
    components: [],
    ephemeral: true
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(reply).catch(() => {});
  } else {
    await interaction.reply(reply).catch(() => {});
  }
}

function registerInteractionCreate(client, db) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.inGuild()) return;

    try {
      if (interaction.isButton() && interaction.customId === "support_guide") {
        await handleSupportGuide(interaction);
        return;
      }

      if (interaction.isButton() && interaction.customId === "create_ticket") {
        await handleCreateTicketPrompt(interaction, db);
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_create_type") {
        await handleTicketCreateTypeSelect(interaction, db);
        return;
      }

      if (interaction.isButton() && interaction.customId === "claim_ticket") {
        await handleClaimTicket(interaction, db);
        return;
      }

      if (interaction.isButton() && interaction.customId === "close_ticket") {
        await handleCloseTicketRequest(interaction, db);
        return;
      }

      if (interaction.isButton() && interaction.customId === "confirm_close_ticket") {
        await handleConfirmCloseTicket(interaction, db);
        return;
      }

      if (interaction.isButton() && interaction.customId === "cancel_close_ticket") {
        await handleCancelCloseTicket(interaction);
      }
    } catch (error) {
      console.error("interactionCreate handler error:", error);
      await safeInteractionError(interaction);
    }
  });
}

module.exports = {
  registerInteractionCreate
};
