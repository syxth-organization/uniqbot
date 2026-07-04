async function getSupportRoles(db) {
  const doc = await db.collection("settings").doc("supportRoles").get();
  return doc.exists ? doc.data().roles || [] : [];
}

async function saveSupportRoles(db, roles) {
  await db.collection("settings").doc("supportRoles").set({ roles }, { merge: true });
}

async function getTicketCategories(db) {
  const doc = await db.collection("settings").doc("ticketCategories").get();
  return doc.exists ? doc.data().categories || [] : [];
}

async function saveTicketCategories(db, categories) {
  await db.collection("settings").doc("ticketCategories").set({ categories }, { merge: true });
}

async function getLogChannelId(db) {
  const doc = await db.collection("settings").doc("logChannel").get();
  return doc.exists ? doc.data().channelId || null : null;
}

async function saveLogChannelId(db, channelId) {
  await db.collection("settings").doc("logChannel").set({ channelId }, { merge: true });
}

function getCategoryForType(categories, type) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  const exactMatch = categories.find((category) => category.type === type);
  if (exactMatch) return exactMatch.id;

  const defaultCategory = categories.find((category) => !category.type || category.type === "default");
  if (defaultCategory) return defaultCategory.id;

  return categories[0].id;
}

module.exports = {
  getSupportRoles,
  saveSupportRoles,
  getTicketCategories,
  saveTicketCategories,
  getLogChannelId,
  saveLogChannelId,
  getCategoryForType
};
