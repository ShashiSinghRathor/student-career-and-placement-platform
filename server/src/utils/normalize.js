const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toId = (v) => {
  try {
    return new (require("mongoose").Types.ObjectId)(v);
  } catch {
    return null;
  }
};

const cleanStr = (v) => (typeof v === "string" ? v.trim() : "");

module.exports = { escapeRegex, toId, cleanStr };
