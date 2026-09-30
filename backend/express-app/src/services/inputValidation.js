// MySQL INT UNSIGNED identifiers: reject coercions such as booleans and arrays.
function validId(value) {
  if (!["string", "number"].includes(typeof value) ||
      !/^[1-9]\d*$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 4294967295 ? id : null;
}

function validBody(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

module.exports = { validId, validBody };
