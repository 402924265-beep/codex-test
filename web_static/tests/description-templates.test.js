import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("account description column has guided templates and local-only attachments", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(app, /人数 \/ 工时 × 产量/);
  assert.match(app, /清单编号 \/ 供应商 \/ 金额 \/ 用途/);
  assert.match(app, /单价 × 数量/);
  assert.match(app, /6666010314/);
  assert.match(app, /6666021500/);
  assert.match(app, /仅填汇总数和量，不上传个人明细/);
  assert.match(app, /description-attachment-input/);
  assert.match(app, /state\.descriptionAttachments/);
});
