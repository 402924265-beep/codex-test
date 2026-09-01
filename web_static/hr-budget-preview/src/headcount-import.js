const MONTH_COLUMNS = Object.freeze(["2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
const EMPLOYEE_TYPES = Object.freeze(["direct", "indirect", "white", "shared"]);
const SERVICE_TYPES = Object.freeze(["waste", "canteen", "cleaning", "security", "drivers", "suppliers", "trainees", "visitors"]);

const schema = (keyColumns, typeCodes) => Object.freeze({
  keyColumns: Object.freeze([...keyColumns]),
  monthColumns: MONTH_COLUMNS,
  columns: Object.freeze([...keyColumns, ...MONTH_COLUMNS]),
  personnelTypeCodes: typeCodes
});

export const EMPLOYEE_HEADCOUNT_IMPORT_SCHEMA = schema(
  ["factory_code", "department_code", "line_code", "personnel_type_code"],
  EMPLOYEE_TYPES
);

export const ATTENDANCE_HEADCOUNT_IMPORT_SCHEMA = schema(
  ["cost_center_code", "personnel_type_code"],
  SERVICE_TYPES
);

function templateMonths(valueAt) {
  return Object.fromEntries(MONTH_COLUMNS.map((month, offset) => [month, valueAt(offset + 7)]));
}

export function buildEmployeeHeadcountTemplateRows(data) {
  const rows = [];
  for (const [factoryCode, factory] of Object.entries(data.factories)) {
    for (const department of factory.departments) {
      for (const line of department.rows) {
        for (const personnelType of EMPLOYEE_TYPES) {
          const baseline = Number(line[personnelType] || 0);
          rows.push({
            factory_code: factoryCode,
            department_code: department.id,
            line_code: line.id,
            personnel_type_code: personnelType,
            ...templateMonths(() => personnelType === "shared" ? Math.round(baseline * 1000) / 1000 : baseline)
          });
        }
      }
    }
  }
  return rows;
}

export function buildAttendanceHeadcountTemplateRows(data) {
  const rows = [];
  for (const group of Object.values(data.groups)) {
    for (const costCenter of group.units) {
      for (const personnelType of SERVICE_TYPES) {
        rows.push({
          cost_center_code: costCenter.id,
          personnel_type_code: personnelType,
          ...templateMonths((monthIndex) => Number(costCenter.entries?.[personnelType]?.[monthIndex] || 0))
        });
      }
    }
  }
  return rows;
}

const blank = (value) => value == null || (typeof value === "string" && value.trim() === "");
const formula = (value) => typeof value === "string" && value.trim().startsWith("=")
  || value && typeof value === "object" && ("f" in value || "formula" in value || value.t === "f");

function rowNumber(row, index) {
  return Number.isInteger(row?.__rowNum__) ? row.__rowNum__ + 1 : index + 2;
}

function rowObject(row, columns) {
  return Array.isArray(row) ? Object.fromEntries(columns.map((column, index) => [column, row[index]])) : row;
}

function error(errors, row, column, code, value) {
  errors.push({ row, column, code, value });
}

function validateColumns(rawRow, row, rowNo, schemaDefinition, errors) {
  if (Array.isArray(rawRow)) return;
  for (const column of Object.keys(row)) {
    if (column === "__rowNum__" || schemaDefinition.columns.includes(column)) continue;
    error(errors, rowNo, column, /^\d{4}-\d{1,2}$/.test(column) ? "INVALID_MONTH" : "UNKNOWN_COLUMN", row[column]);
  }
}

function numericValue(value, rowNo, column, allowDecimal, errors) {
  if (formula(value)) {
    error(errors, rowNo, column, "FORMULA_NOT_ALLOWED", value);
    return null;
  }
  if (typeof value === "string") {
    error(errors, rowNo, column, /^[-+]?\d+(?:\.\d+)?$/.test(value.trim()) ? "TEXT_NUMBER_NOT_ALLOWED" : "NUMBER_REQUIRED", value);
    return null;
  }
  if (typeof value !== "number") {
    error(errors, rowNo, column, "NUMBER_REQUIRED", value);
    return null;
  }
  if (!Number.isFinite(value)) {
    error(errors, rowNo, column, "NON_FINITE_NUMBER", value);
    return null;
  }
  if (value < 0) {
    error(errors, rowNo, column, "NEGATIVE_NUMBER", value);
    return null;
  }
  if (!allowDecimal && !Number.isInteger(value)) {
    error(errors, rowNo, column, "INTEGER_REQUIRED", value);
    return null;
  }
  if (allowDecimal && Number(value.toFixed(3)) !== value) {
    error(errors, rowNo, column, "MAX_THREE_DECIMALS", value);
    return null;
  }
  return value;
}

function codeValue(row, column, rowNo, errors) {
  const value = row[column];
  if (typeof value !== "string" || !value.trim()) {
    error(errors, rowNo, column, "CODE_REQUIRED", value);
    return "";
  }
  return value.trim();
}

function isEmptyRow(rawRow) {
  const values = Array.isArray(rawRow) ? rawRow : Object.entries(rawRow || {})
    .filter(([key]) => key !== "__rowNum__")
    .map(([, value]) => value);
  return !values.length || values.every(blank);
}

function parseRows(rows, schemaDefinition, identify, changeFor) {
  if (!Array.isArray(rows)) return { errors: [{ row: 0, column: "", code: "ROWS_REQUIRED", value: rows }], changes: [] };
  const errors = [];
  const changes = [];
  const keys = new Set();

  rows.forEach((rawRow, index) => {
    if (isEmptyRow(rawRow)) return;
    const row = rowObject(rawRow, schemaDefinition.columns);
    const rowNo = rowNumber(row, index);
    validateColumns(rawRow, row, rowNo, schemaDefinition, errors);
    const identity = identify(row, rowNo, errors);
    if (identity.key) {
      if (keys.has(identity.key)) error(errors, rowNo, schemaDefinition.keyColumns[0], "DUPLICATE_KEY", identity.key);
      keys.add(identity.key);
    }
    if (!identity.valid) return;

    for (const month of MONTH_COLUMNS) {
      const rawValue = row[month];
      if (blank(rawValue)) continue;
      const value = numericValue(rawValue, rowNo, month, identity.allowDecimal, errors);
      if (value !== null) changes.push(changeFor(identity, month, value, rowNo));
    }
  });

  return { errors, changes: errors.length ? [] : changes };
}

export function parseEmployeeHeadcountImportRows(rows, data) {
  return parseRows(rows, EMPLOYEE_HEADCOUNT_IMPORT_SCHEMA, (row, rowNo, errors) => {
    const factoryCode = codeValue(row, "factory_code", rowNo, errors);
    const departmentCode = codeValue(row, "department_code", rowNo, errors);
    const lineCode = codeValue(row, "line_code", rowNo, errors);
    const personnelTypeCode = codeValue(row, "personnel_type_code", rowNo, errors);
    const factory = data.factories?.[factoryCode];
    if (factoryCode && !factory) error(errors, rowNo, "factory_code", "UNKNOWN_CODE", factoryCode);
    const department = factory?.departments?.find((item) => item.id === departmentCode);
    if (departmentCode && factory && !department) error(errors, rowNo, "department_code", "UNKNOWN_CODE", departmentCode);
    const line = department?.rows?.find((item) => item.id === lineCode);
    if (lineCode && department && !line) error(errors, rowNo, "line_code", "UNKNOWN_CODE", lineCode);
    if (personnelTypeCode && !EMPLOYEE_TYPES.includes(personnelTypeCode)) error(errors, rowNo, "personnel_type_code", "UNKNOWN_CODE", personnelTypeCode);
    return {
      factoryCode, departmentCode, lineCode, personnelTypeCode,
      key: [factoryCode, departmentCode, lineCode, personnelTypeCode].every(Boolean)
        ? `${factoryCode}|${departmentCode}|${lineCode}|${personnelTypeCode}` : "",
      valid: Boolean(factory && department && line && EMPLOYEE_TYPES.includes(personnelTypeCode)),
      allowDecimal: personnelTypeCode === "shared"
    };
  }, (identity, month, value, sourceRow) => {
    const monthIndex = Number(month.slice(5)) - 1;
    return {
      key: `${identity.factoryCode}.${identity.lineCode}.${identity.personnelTypeCode}.${monthIndex}`,
      factoryCode: identity.factoryCode,
      departmentCode: identity.departmentCode,
      lineCode: identity.lineCode,
      personnelTypeCode: identity.personnelTypeCode,
      month,
      monthIndex,
      value,
      sourceRow
    };
  });
}

export function parseAttendanceHeadcountImportRows(rows, data) {
  const costCenters = new Set(Object.values(data.groups || {}).flatMap((group) => group.units || []).map((item) => item.id));
  return parseRows(rows, ATTENDANCE_HEADCOUNT_IMPORT_SCHEMA, (row, rowNo, errors) => {
    const costCenterCode = codeValue(row, "cost_center_code", rowNo, errors);
    const personnelTypeCode = codeValue(row, "personnel_type_code", rowNo, errors);
    if (costCenterCode && !costCenters.has(costCenterCode)) error(errors, rowNo, "cost_center_code", "UNKNOWN_CODE", costCenterCode);
    if (personnelTypeCode && !SERVICE_TYPES.includes(personnelTypeCode)) error(errors, rowNo, "personnel_type_code", "UNKNOWN_CODE", personnelTypeCode);
    return {
      costCenterCode, personnelTypeCode,
      key: costCenterCode && personnelTypeCode ? `${costCenterCode}|${personnelTypeCode}` : "",
      valid: costCenters.has(costCenterCode) && SERVICE_TYPES.includes(personnelTypeCode),
      allowDecimal: false
    };
  }, (identity, month, value, sourceRow) => {
    const monthIndex = Number(month.slice(5)) - 1;
    return {
      key: `${identity.costCenterCode}.${identity.personnelTypeCode}.${monthIndex}`,
      costCenterCode: identity.costCenterCode,
      personnelTypeCode: identity.personnelTypeCode,
      month,
      monthIndex,
      value,
      sourceRow
    };
  });
}
