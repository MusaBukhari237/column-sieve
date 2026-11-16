export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, "");
  if (!text.trim()) throw new Error("Paste a CSV with a header row.");
  const rows = [];
  let row = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === undefined) throw new Error("Unclosed quoted field.");
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
      continue;
    }
    if (ch === undefined || ch === "," || ch === "\r" || ch === "\n") {
      row.push(cell); cell = ""; closed = false;
      if (ch !== ",") {
        if (row.some(value => value !== "") || row.length > 1) rows.push(row);
        row = [];
        if (ch === "\r" && text[i + 1] === "\n") i++;
      }
    } else if (closed || (ch === '"' && cell)) {
      throw new Error("Unexpected characters around a quoted field.");
    } else if (ch === '"') quoted = true;
    else cell += ch;
  }
  const header = rows.shift()?.map(name => name.trim());
  if (!header?.length || header.some(name => !name) || new Set(header).size !== header.length) {
    throw new Error("CSV headers must be non-empty and unique.");
  }
  return {header, rows};
}
export function encodeCsv(rows) {
  return rows.map(row => row.map(value => {
    const text = String(value);
    const safe = /^(?:\s*[=+@-]|[\t\r\n])/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(",")).join("\r\n") + "\r\n";
}

export function cleanContacts(input, emailColumn) {
  const {header, rows} = parseCsv(input);
  const index = header.indexOf(emailColumn);
  if (index === -1) throw new Error("Select a column from the CSV header.");
  const seen = new Set(), kept = [], skipped = [];
  rows.forEach((row, offset) => {
    const email = row[index]?.trim();
    const key = email?.toLowerCase();
    const reason = row.length !== header.length ? "wrong column count"
      : !email || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) ? "invalid email"
      : seen.has(key) ? "duplicate email" : null;
    if (reason) { skipped.push({row:offset + 2, reason}); return; }
    seen.add(key);
    row[index] = email;
    kept.push(row);
  });
  return {kept, skipped, csv:encodeCsv([header, ...kept])};
}
