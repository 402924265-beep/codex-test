# Design QA - Rolling Forecast Monthly Variance

## Source Visual Truth

- Source direction: Product Design generated task-oriented split workbench, selected by user as the third direction to implement.
- Source image used for comparison: `C:\Users\Administrator\.codex\generated_images\019ecfa7-b947-7bd3-8f6a-dd3a29bcc401\ig_0d12fb102e6afb86016a31fa5d19e481919cc02c203d75db09.png`
- User adjustment after source: keep only the global language selector. Chinese mode must be all Chinese, English mode all English, Turkish mode all Turkish. Unit price and quantity start blank, and total keeps the 4+8 forecast until both fields are filled.

## Implementation Evidence

- Implemented page: `http://127.0.0.1:8780/`, Monthly Variance tab.
- Implementation screenshot captured before final width tightening: `E:\文档\Candy DW cost\tmp\design-qa\rolling-forecast-zh-viewport.png`
- Final width verification after tightening:
  - matrix wrapper client width: 791
  - matrix scroll width: 791
  - table width: 767.08
  - rolling total column visible: true
  - warning column visible: true
- The browser screenshot API timed out after the width tightening, so final acceptance is based on DOM geometry and interaction checks.

## Acceptance Checks

- Default Chinese state: unit price, price owner, quantity, and quantity owner inputs are blank.
- Default total source: first forecast row shows `424.10` and `沿用4+8`.
- Formula behavior: typing unit price `10` and quantity `100` changes the rolling total to `1,000.00` with source `单价×数量`.
- Warning behavior: the same test creates a severe warning `+132%`.
- Language behavior:
  - English mode shows `Rolling Forecast Hub`, `Save All Drafts`, `Submit All Forecasts`, `Unit Price`, `Rolling Total`, `Warning`.
  - Turkish mode shows `Dönen Tahmin Merkezi`, `Tüm Taslakları Kaydet`, `Tüm Tahminleri Gönder`, `Birim Fiyat`, `Dönen Toplam`, `Uyarı`.
- Submit access: global submit and current-account submit buttons are visible in the rolling forecast workspace.

## Test Result

- `npm.cmd run test:web`: 46 passed.
- `node --check web_static\src\app.js`: passed.
