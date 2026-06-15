import test from "node:test";
import assert from "node:assert/strict";

import { localizeAccountLabel } from "../src/account-labels.js";

test("account labels switch between English, Chinese and Turkish", () => {
  assert.equal(localizeAccountLabel("6666020201", "Domestic business travel", "en"), "Domestic business travel");
  assert.equal(localizeAccountLabel("6666020201", "Domestic business travel", "zh"), "国内差旅费");
  assert.equal(localizeAccountLabel("6666020201", "Domestic business travel", "tr"), "Yurt içi seyahat giderleri");
  assert.equal(localizeAccountLabel("6666110207", "Amortization of Software", "zh"), "软件摊销");
  assert.equal(localizeAccountLabel("6666110207", "Amortization of Software", "tr"), "Yazılım itfa payı");
});

test("unknown accounts keep their source English label", () => {
  assert.equal(localizeAccountLabel("NEW", "New account", "zh"), "New account");
  assert.equal(localizeAccountLabel("NEW", "New account", "tr"), "New account");
});
