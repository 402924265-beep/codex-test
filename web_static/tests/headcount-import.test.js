import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ATTENDANCE_DATA } from "../hr-budget-preview/src/admin-attendance-data.js";
import { EMPLOYEE_ATTENDANCE_DATA } from "../hr-budget-preview/src/employee-attendance-data.js";
import {
  ATTENDANCE_HEADCOUNT_IMPORT_SCHEMA,
  EMPLOYEE_HEADCOUNT_IMPORT_SCHEMA,
  buildAttendanceHeadcountTemplateRows,
  buildEmployeeHeadcountTemplateRows,
  parseAttendanceHeadcountImportRows,
  parseEmployeeHeadcountImportRows
} from "../hr-budget-preview/src/headcount-import.js";

const employeeRow = (overrides = {}) => ({
  factory_code: "dw",
  department_code: "production",
  line_code: "line-1",
  personnel_type_code: "direct",
  "2026-08": "",
  "2026-09": "",
  "2026-10": "",
  "2026-11": "",
  "2026-12": "",
  ...overrides
});

const attendanceRow = (overrides = {}) => ({
  cost_center_code: "dw",
  personnel_type_code: "waste",
  "2026-08": "",
  "2026-09": "",
  "2026-10": "",
  "2026-11": "",
  "2026-12": "",
  ...overrides
});

test("separate template schemas and rows use existing data codes and August-December baselines", () => {
  assert.deepEqual(EMPLOYEE_HEADCOUNT_IMPORT_SCHEMA.columns, ["factory_code", "department_code", "line_code", "personnel_type_code", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
  assert.deepEqual(ATTENDANCE_HEADCOUNT_IMPORT_SCHEMA.columns, ["cost_center_code", "personnel_type_code", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);

  const employee = buildEmployeeHeadcountTemplateRows(EMPLOYEE_ATTENDANCE_DATA);
  const attendance = buildAttendanceHeadcountTemplateRows(ADMIN_ATTENDANCE_DATA);
  assert.ok(employee.some((row) => row.factory_code === "dw" && row.department_code === "production" && row.line_code === "line-1" && row.personnel_type_code === "direct" && row["2026-08"] === 47));
  assert.ok(attendance.some((row) => row.cost_center_code === "dw" && row.personnel_type_code === "waste" && row["2026-08"] === 10));
  assert.equal(employee.length, Object.values(EMPLOYEE_ATTENDANCE_DATA.factories).reduce((sum, factory) => sum + factory.departments.reduce((count, department) => count + department.rows.length * 4, 0), 0));
  assert.equal(attendance.length, Object.values(ADMIN_ATTENDANCE_DATA.groups).reduce((sum, group) => sum + group.units.length * 8, 0));
  assert.deepEqual(parseEmployeeHeadcountImportRows(employee, EMPLOYEE_ATTENDANCE_DATA).errors, []);
  assert.deepEqual(parseAttendanceHeadcountImportRows(attendance, ADMIN_ATTENDANCE_DATA).errors, []);
});

test("blank month cells do not overwrite and explicit zero does", () => {
  const result = parseEmployeeHeadcountImportRows([employeeRow({ "2026-08": "  ", "2026-09": 0 })], EMPLOYEE_ATTENDANCE_DATA);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.changes.map(({ key, value }) => ({ key, value })), [{ key: "dw.line-1.direct.8", value: 0 }]);
});

test("employee import rejects duplicate composite keys and unknown codes atomically", () => {
  const result = parseEmployeeHeadcountImportRows([
    employeeRow({ "2026-08": 12 }),
    employeeRow({ "2026-09": 13 }),
    employeeRow({ line_code: "missing-line", "2026-08": 1 })
  ], EMPLOYEE_ATTENDANCE_DATA);
  assert.deepEqual(result.changes, []);
  assert.ok(result.errors.some((item) => item.code === "DUPLICATE_KEY"));
  assert.ok(result.errors.some((item) => item.column === "line_code" && item.code === "UNKNOWN_CODE"));
});

test("invalid month columns, formulas, text numbers, NaN and Infinity reject the whole batch", () => {
  const result = parseEmployeeHeadcountImportRows([
    employeeRow({ "2026-08": 1 }),
    employeeRow({ line_code: "line-2", "2026-07": 1, "2026-08": "2", "2026-09": "=1+1", "2026-10": NaN, "2026-11": Infinity, "2026-12": { f: "1+1", v: 2 } })
  ], EMPLOYEE_ATTENDANCE_DATA);
  assert.deepEqual(result.changes, []);
  assert.ok(result.errors.some((item) => item.code === "INVALID_MONTH"));
  assert.ok(result.errors.some((item) => item.code === "TEXT_NUMBER_NOT_ALLOWED"));
  assert.equal(result.errors.filter((item) => item.code === "FORMULA_NOT_ALLOWED").length, 2);
  assert.ok(result.errors.filter((item) => item.code === "NON_FINITE_NUMBER").length === 2);
});

test("employee integer types reject fractions and shared FTE allows at most three decimals", () => {
  const invalidInteger = parseEmployeeHeadcountImportRows([employeeRow({ "2026-08": 1.5 })], EMPLOYEE_ATTENDANCE_DATA);
  assert.ok(invalidInteger.errors.some((item) => item.code === "INTEGER_REQUIRED"));

  const validShared = parseEmployeeHeadcountImportRows([employeeRow({ personnel_type_code: "shared", "2026-08": 0.333 })], EMPLOYEE_ATTENDANCE_DATA);
  assert.deepEqual(validShared.errors, []);
  assert.equal(validShared.changes[0].value, 0.333);

  const invalidShared = parseEmployeeHeadcountImportRows([employeeRow({ personnel_type_code: "shared", "2026-08": 0.3333 })], EMPLOYEE_ATTENDANCE_DATA);
  assert.ok(invalidShared.errors.some((item) => item.code === "MAX_THREE_DECIMALS"));

  const tinyShared = parseEmployeeHeadcountImportRows([employeeRow({ personnel_type_code: "shared", "2026-08": 0.0000001 })], EMPLOYEE_ATTENDANCE_DATA);
  assert.ok(tinyShared.errors.some((item) => item.code === "MAX_THREE_DECIMALS"));
});

test("negative employee and attendance numbers are rejected", () => {
  const employee = parseEmployeeHeadcountImportRows([employeeRow({ "2026-08": -1 })], EMPLOYEE_ATTENDANCE_DATA);
  const attendance = parseAttendanceHeadcountImportRows([attendanceRow({ "2026-08": -1 })], ADMIN_ATTENDANCE_DATA);
  assert.ok(employee.errors.some((item) => item.code === "NEGATIVE_NUMBER"));
  assert.ok(attendance.errors.some((item) => item.code === "NEGATIVE_NUMBER"));
});

test("attendance accepts integer zero and rejects duplicate, unknown or fractional service rows atomically", () => {
  const zero = parseAttendanceHeadcountImportRows([attendanceRow({ "2026-08": 0 })], ADMIN_ATTENDANCE_DATA);
  assert.deepEqual(zero.errors, []);
  assert.equal(zero.changes[0].key, "dw.waste.7");
  assert.equal(zero.changes[0].value, 0);

  const invalid = parseAttendanceHeadcountImportRows([
    attendanceRow({ "2026-08": 1 }),
    attendanceRow({ "2026-09": 2 }),
    attendanceRow({ cost_center_code: "unknown", personnel_type_code: "direct", "2026-08": 1.25 })
  ], ADMIN_ATTENDANCE_DATA);
  assert.deepEqual(invalid.changes, []);
  assert.ok(invalid.errors.some((item) => item.code === "DUPLICATE_KEY"));
  assert.ok(invalid.errors.some((item) => item.column === "cost_center_code" && item.code === "UNKNOWN_CODE"));
  assert.ok(invalid.errors.some((item) => item.column === "personnel_type_code" && item.code === "UNKNOWN_CODE"));
});

test("one invalid attendance row prevents otherwise valid changes from being returned", () => {
  const result = parseAttendanceHeadcountImportRows([
    attendanceRow({ "2026-08": 7 }),
    attendanceRow({ personnel_type_code: "canteen", "2026-08": 1.5 })
  ], ADMIN_ATTENDANCE_DATA);
  assert.ok(result.errors.some((item) => item.code === "INTEGER_REQUIRED"));
  assert.deepEqual(result.changes, []);
});
