import { ADMIN_BUDGET_DATA, ADMIN_BUDGET_MONTHS, adminCategoryMonthlyEur } from "./admin-budget-data.js";

export function buildAdminBudgetAccountSync(data = ADMIN_BUDGET_DATA, overrides = {}, months = ADMIN_BUDGET_MONTHS) {
  const output = {};
  for (const category of data.categories || []) {
    if (!category.ready || !category.accountCode) continue;
    const monthlyEur = adminCategoryMonthlyEur(category, overrides);
    const entry = output[category.accountCode] || { categoryIds: [], sourceLabels: [], months: {} };
    entry.categoryIds.push(category.id);
    entry.sourceLabels.push(category.sourceLabel);
    for (const month of months) {
      entry.months[String(month)] = Number(entry.months[String(month)] || 0) + Number(monthlyEur[month - 1] || 0) / 1000;
    }
    output[category.accountCode] = entry;
  }
  return output;
}

export function adminBudgetSyncTotal(output, month) {
  return Object.values(output || {}).reduce((sum, entry) => sum + Number(entry.months?.[String(month)] || 0), 0);
}

