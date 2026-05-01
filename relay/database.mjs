export async function saveLeadPlaceholder(payload) {
  void payload;

  return {
    ok: true,
    channel: "database",
    message: "Database interface reserved; no persistence is configured yet."
  };
}
