import test from "node:test";
import assert from "node:assert/strict";
import * as core from "../docs/tool.mjs";

test("handles BOM, quoted lines, duplicate addresses and safe formulas", () => {
  const input='\uFEFFName,Email\r\n"=test",a@example.test\r\nB,A@example.test\r\n"Two\nLines",c@example.test\r\nX,no';
  const result=core.cleanContacts(input,"Email");
  assert.equal(result.kept.length,2);
  assert.deepEqual(result.skipped.map(x=>x.reason),["duplicate email","invalid email"]);
  assert.match(result.csv,/"'=test"/);
  assert.match(result.csv,/"Two\nLines"/);
  assert.throws(() => core.parseCsv('A\n"broken'),/Unclosed/);
});
