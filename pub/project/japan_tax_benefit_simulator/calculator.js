(function (global) {
  'use strict';

  const CURRENT = Object.freeze({
    year: 2026,
    incomeTaxBasicDeductionMinimum: 580000,
    residentBasicDeduction: 430000,
    residentTaxRate: 0.10,
    residentPerCapita: 5000,
    reconstructionRate: 0.021,
    pensionEmployeeRate: 0.0915,
    healthEmployeeRate: 0.04955,
    employmentInsuranceRate: 0.0055
  });

  const floor1000 = value => Math.floor(Math.max(0, value) / 1000) * 1000;
  const round100 = value => Math.round(Math.max(0, value) / 100) * 100;

  function salaryDeduction(income) {
    const x = Math.max(0, income);
    if (x <= 1900000) return Math.min(x, 650000);
    if (x <= 3600000) return x * 0.30 + 80000;
    if (x <= 6600000) return x * 0.20 + 440000;
    if (x <= 8500000) return x * 0.10 + 1100000;
    return 1950000;
  }

  function progressiveIncomeTax(taxable) {
    const x = floor1000(taxable);
    const brackets = [
      [40000000, 0.45, 4796000], [18000000, 0.40, 2796000],
      [9000000, 0.33, 1536000], [6950000, 0.23, 636000],
      [3300000, 0.20, 427500], [1950000, 0.10, 97500], [0, 0.05, 0]
    ];
    const bracket = brackets.find(([min]) => x >= min);
    return Math.max(0, x * bracket[1] - bracket[2]);
  }

  function incomeTaxBasicDeduction(totalIncome) {
    const x = Math.max(0, totalIncome);
    if (x <= 1320000) return 950000;
    if (x <= 3360000) return 880000;
    if (x <= 4890000) return 680000;
    if (x <= 6550000) return 630000;
    if (x <= 23500000) return 580000;
    if (x <= 24000000) return 480000;
    if (x <= 24500000) return 320000;
    if (x <= 25000000) return 160000;
    return 0;
  }

  function socialInsurance(income, insured, age) {
    if (!insured || income <= 0) return 0;
    const pensionBase = Math.min(income, 7800000);
    const healthBase = Math.min(income, 16740000);
    const careRate = Number(age) >= 40 && Number(age) < 65 ? 0.0080 : 0;
    return round100(pensionBase * CURRENT.pensionEmployeeRate + healthBase * (CURRENT.healthEmployeeRate + careRate) + income * CURRENT.employmentInsuranceRate);
  }

  function refundableCredit(income, policy) {
    if (!policy.enabled) return 0;
    const excess = Math.max(0, income - policy.phaseStart);
    return round100(Math.max(0, policy.maxCredit - excess * policy.phaseRate));
  }

  function calculate(input, policy) {
    const income = Math.max(0, Number(input.income) || 0);
    const deduction = salaryDeduction(income);
    const salaryIncome = Math.max(0, income - deduction);
    const insurance = socialInsurance(income, input.insured, input.age);
    const basicDeduction = incomeTaxBasicDeduction(salaryIncome);
    const incomeTaxable = floor1000(salaryIncome - basicDeduction - insurance);
    const baseIncomeTax = progressiveIncomeTax(incomeTaxable);
    const incomeTax = round100(baseIncomeTax * (1 + CURRENT.reconstructionRate));
    const residentTaxable = floor1000(salaryIncome - CURRENT.residentBasicDeduction - insurance);
    const residentTax = residentTaxable > 0 ? round100(residentTaxable * CURRENT.residentTaxRate + CURRENT.residentPerCapita) : 0;
    const credit = refundableCredit(income, policy);
    const burden = incomeTax + residentTax + insurance;
    const disposable = Math.max(0, income - burden + credit);
    return { income, deduction, salaryIncome, basicDeduction, insurance, incomeTaxable, incomeTax, residentTaxable, residentTax, credit, burden, disposable };
  }

  function simulate(input, policy, maxIncome = 10000000, step = 10000) {
    const rows = [];
    for (let income = 0; income <= maxIncome; income += step) {
      const current = calculate({ ...input, income }, { ...policy, enabled: false });
      const reform = calculate({ ...input, income }, policy);
      rows.push({ income, current, reform, metrCurrent: 0, metrReform: 0 });
      if (rows.length > 1) {
        const previous = rows[rows.length - 2];
        previous.metrCurrent = 1 - (current.disposable - previous.current.disposable) / step;
        previous.metrReform = 1 - (reform.disposable - previous.reform.disposable) / step;
      }
    }
    if (rows.length > 1) {
      rows.at(-1).metrCurrent = rows.at(-2).metrCurrent;
      rows.at(-1).metrReform = rows.at(-2).metrReform;
    }
    return rows;
  }

  function findCliff(input, policy) {
    const at = Math.max(0, Number(input.income) || 0);
    const before = calculate({ ...input, income: at }, policy);
    const after = calculate({ ...input, income: at + 10000 }, policy);
    const delta = after.disposable - before.disposable;
    return delta < 0 ? { from: at, to: at + 10000, delta } : null;
  }

  function selfTest() {
    const p = { enabled: true, maxCredit: 600000, phaseStart: 1000000, phaseRate: 0.2 };
    const i = { income: 3000000, insured: true, age: 35 };
    const assertions = [
      salaryDeduction(0) === 0,
      salaryDeduction(1900000) === 650000,
      salaryDeduction(3600000) === 1160000,
      incomeTaxBasicDeduction(1320000) === 950000,
      incomeTaxBasicDeduction(1320001) === 880000,
      refundableCredit(1000000, p) === 600000,
      refundableCredit(4000000, p) === 0,
      calculate(i, p).disposable >= calculate(i, { ...p, enabled: false }).disposable,
      calculate({ ...i, income: -1 }, p).income === 0
    ];
    return { passed: assertions.filter(Boolean).length, total: assertions.length, ok: assertions.every(Boolean) };
  }

  global.TaxSimulator = { CURRENT, calculate, simulate, findCliff, selfTest };
})(window);
