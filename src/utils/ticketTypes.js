const TICKET_TYPES = [
  {
    label: "Report Issue",
    value: "report",
    description: "Report a bug, problem, or server issue.",
    emoji: "⚠️"
  },
  {
    label: "Support Help",
    value: "support",
    description: "Get help from the support team.",
    emoji: "🛠️"
  },
  {
    label: "Account Concern",
    value: "account",
    description: "Ask about account access or account concerns.",
    emoji: "👤"
  },
  {
    label: "Partnership",
    value: "partnership",
    description: "Discuss partnerships, collaborations, or business concerns.",
    emoji: "🤝"
  },
  {
    label: "Other",
    value: "other",
    description: "Use this if your concern does not fit the other options.",
    emoji: "📩"
  }
];

function getTicketType(value) {
  return TICKET_TYPES.find((type) => type.value === value) || TICKET_TYPES[TICKET_TYPES.length - 1];
}

function formatTicketType(value) {
  const type = getTicketType(value);
  return `${type.emoji} ${type.label}`;
}

module.exports = {
  TICKET_TYPES,
  getTicketType,
  formatTicketType
};
