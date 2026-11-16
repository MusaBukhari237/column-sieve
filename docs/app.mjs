const el = id => document.getElementById(id);
function show(value) { el("result").textContent = value; }
function appendText(value) {
  const p = document.createElement("p"); p.textContent = value; el("result").append(p);
}
function action(callback) {
  const button = el("run");
  button.onclick = async () => {
    button.disabled = true;
    try { await callback(); } catch (error) { show(error.message); }
    finally { button.disabled = false; }
  };
}
function renderTable(rows) {
  const wrapper = document.createElement("div"), table = document.createElement("table");
  wrapper.className = "grid";
  rows.forEach((row,index) => {
    const tr = table.insertRow();
    row.forEach(value => {
      const cell = document.createElement(index ? "td" : "th");
      cell.textContent = String(value);
      if (!index) cell.scope = "col";
      tr.append(cell);
    });
  });
  wrapper.append(table); el("result").append(wrapper);
}
let previousUrl;
function download(filename, contents, type = "text/csv") {
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  previousUrl = URL.createObjectURL(new Blob([contents],{type}));
  const link = document.createElement("a");
  link.className = "download"; link.href = previousUrl;
  link.download = filename; link.textContent = "Download " + filename;
  el("result").append(link);
}
import {cleanContacts,parseCsv} from "./tool.mjs";
function columns() {
  const select = el("column"), previous = select.value;
  select.replaceChildren();
  try {
    const {header} = parseCsv(el("csv").value);
    for (const label of header) select.add(new Option(label,label));
    if (header.includes(previous)) select.value = previous;
    else select.selectedIndex = Math.max(0,header.findIndex(x => /e.?mail/i.test(x)));
  } catch {}
}
el("csv").oninput = columns;
el("example").onclick = () => { el("csv").value = "Name,Email\nAda,ada@example.test\nA. Duplicate,ADA@example.test\nBad address,not-an-address\nRen,ren@example.test"; columns(); };
action(() => {
  const result = cleanContacts(el("csv").value,el("column").value);
  show(result.kept.length+" kept · "+result.skipped.length+" skipped");
  if (result.skipped.length) renderTable([["Record","Reason"],...result.skipped.slice(0,100).map(r => [r.row,r.reason])]);
  if (result.skipped.length > 100) appendText("Showing the first 100 skipped records.");
  download("cleaned.csv",result.csv);
});
