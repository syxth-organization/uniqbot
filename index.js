require("dotenv").config();

const { startHealthServer } = require("./src/server/health");
const { validateEnv } = require("./src/config/env");
const { createClient } = require("./src/bot/client");
const { initFirebase } = require("./src/firebase/firebase");
const { registerMessageCreate } = require("./src/events/messageCreate");
const { registerInteractionCreate } = require("./src/events/interactionCreate");

async function main() {
  validateEnv();
  startHealthServer();

  const db = initFirebase();
  const client = createClient();

  registerMessageCreate(client, db);
  registerInteractionCreate(client, db);

  client.once("ready", () => {
    console.log(`UNIQ Prism online as ${client.user.tag}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Destroying Discord client...");
    client.destroy();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received. Destroying Discord client...");
    client.destroy();
    process.exit(0);
  });

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
