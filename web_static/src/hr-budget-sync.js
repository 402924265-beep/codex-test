export const HR_BUDGET_SYNC_MONTHS = [6, 7, 8, 9, 10, 11, 12];

const POSITION_CODES = {
  wages: {
    direct: "6666010188",
    indirect: "6666010102",
    whiteCollar: "6666010101"
  },
  overtime: {
    direct: "6666010183",
    indirect: "6666010186"
  },
  incentive: {
    direct: "6666010380",
    indirect: "6666010184",
    whiteCollar: "6666010185"
  },
  socialSecurity: {
    direct: "6666010019",
    indirect: "6666010012",
    whiteCollar: "6666010196"
  },
  unemployment: {
    direct: "5001010205",
    indirect: "5001010206",
    whiteCollar: "6666010207"
  },
  indemnity: {
    direct: "6666010229",
    indirect: "6666010226",
    whiteCollar: "6666010227"
  }
};

const ACCOUNT_GROUPS = [
  { keys: ["wages"], codes: POSITION_CODES.wages },
  { keys: ["overtime"], codes: POSITION_CODES.overtime },
  { keys: ["bonus", "rdIncentive", "incentive", "mbo"], codes: POSITION_CODES.incentive },
  { keys: ["cashAid"], code: "6666010315" },
  { keys: ["socialSecurity"], codes: POSITION_CODES.socialSecurity },
  { keys: ["unemployment"], codes: POSITION_CODES.unemployment },
  { keys: ["indemnity"], codes: POSITION_CODES.indemnity }
];

function positionKey(item) {
  if (String(item?.type || "").toUpperCase() === "WC") return "whiteCollar";
  return String(item?.position || "").toLowerCase() === "direct" ? "direct" : "indirect";
}

function addOutput(output, code, account, month, amountEur) {
  if (!code) return;
  const entry = output[code] || { accountKeys: [], sourceLabels: [], months: {} };
  if (!entry.accountKeys.includes(account.key)) entry.accountKeys.push(account.key);
  if (!entry.sourceLabels.includes(account.sourceLabel)) entry.sourceLabels.push(account.sourceLabel);
  entry.months[String(month)] = Number(entry.months[String(month)] || 0) + Number(amountEur || 0) / 1000;
  output[code] = entry;
}

export function buildHrBudgetAccountSync(data, months = HR_BUDGET_SYNC_MONTHS) {
  const accounts = new Map((data?.accounts || []).map((account) => [account.key, account]));
  const output = {};

  for (const group of ACCOUNT_GROUPS) {
    for (const key of group.keys) {
      const account = accounts.get(key);
      if (!account) continue;
      for (const month of months) {
        const monthIndex = Number(month) - 1;
        if (group.code) {
          addOutput(output, group.code, account, month, account.monthly?.[monthIndex]);
          continue;
        }
        let breakdownTotal = 0;
        for (const item of account.breakdown || []) {
          const amount = Number(item.monthly?.[monthIndex] || 0);
          breakdownTotal += amount;
          addOutput(output, group.codes[positionKey(item)], account, month, amount);
        }
        const residual = Number(account.monthly?.[monthIndex] || 0) - breakdownTotal;
        if (Math.abs(residual) >= 0.000001) addOutput(output, group.codes.direct || Object.values(group.codes)[0], account, month, residual);
      }
    }
  }

  return output;
}

export function hrBudgetSyncTotal(output, month) {
  return Object.values(output || {}).reduce((sum, entry) => sum + Number(entry.months?.[String(month)] || 0), 0);
}
