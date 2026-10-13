import { euro } from '@/utils/money';
import type { ComponentKey, HeatingSystem } from '@/domain/schema';

/**
 * Zentrale Balance-Parameter. Die gesamte Wirtschaft lässt sich hier anpassen,
 * ohne UI-Komponenten oder Spielregeln zu verändern.
 */
export const CONFIG = {
  rent: {
    dueDay: 3,
    /** Maximaler Aufschlag auf die Vergleichsmiete bei Neuvermietung (vereinfachte Mietpreisbremse). */
    maxNewLeaseOverComparable: 0.1,
    /** Kappungsgrenze: maximal +20 % innerhalb von 3 Jahren. */
    cappingLimit: 0.2,
    cappingYears: 3,
    minMonthsBetweenIncreases: 12,
    increaseNoticeDays: 90,
    /** Modernisierungsumlage: 8 % der Kosten pro Jahr, max. 3 €/m² innerhalb von 6 Jahren. */
    modernizationRate: 0.08,
    modernizationCapPerSqm: euro(3),
    depositMonths: 3,
    defaultUtilityPerSqm: euro(2.9),
    listingCost: euro(39),
    affordabilityShare: 0.4,
  },
  dunning: {
    reminderAfterDays: 10,
    noticeAfterDays: 24,
    legalAfterDays: 45,
    legalCost: euro(380),
    evictionCost: euro(1800),
    terminationArrearsMonths: 2,
  },
  satisfaction: {
    base: 68,
    dailyInertia: 0.05,
    moveOutThreshold: 35,
    moveOutDailyBase: 0.0045,
    naturalMoveOutPerYear: 0.06,
    noticePeriodDays: 90,
  },
  applicants: {
    baseRatePerDay: 0.38,
    maxWaiting: 6,
    validityDays: 18,
  },
  components: {
    /** Basisverschleiß in Zustandspunkten pro Jahr. */
    wearPerYear: {
      roof: 1.6,
      facade: 1.5,
      windows: 2.0,
      pipes: 1.8,
      electrical: 1.4,
      heating: 3.0,
      sanitary: 2.2,
      stairwell: 4.5,
      basement: 1.6,
      outdoor: 5.0,
    } satisfies Record<ComponentKey, number>,
    defectBaseRatePerDay: 0.022,
    maintenanceWearReduction: 0.45,
    maintenanceEffectDays: 365,
  },
  apartments: {
    wearPerYear: 2.2,
    defectBaseRatePerDay: 0.0016,
    needsRenovationBelow: 50,
  },
  energy: {
    /** kWh pro m² und Kelvin-Gradtag für ein ungedämmtes Bestandsgebäude. */
    heatLossPerSqmKd: 0.052,
    insulationFactor: [1, 0.8, 0.62, 0.45],
    windowTierFactor: [1.18, 1.08, 0.97, 0.88, 0.8],
    hotWaterKwhPerPersonDay: 2.4,
    waterM3PerPersonDay: 0.125,
    commonKwhPerDay: 13,
    heatingBaseTemp: 15,
    heating: {
      oil_old: { label: 'Öl-Niedertemperaturkessel (alt)', efficiency: 0.76, pricePerKwh: 10.5, maintenance: euro(320), chimney: true },
      gas_old: { label: 'Gas-Kessel (alt)', efficiency: 0.8, pricePerKwh: 11, maintenance: euro(260), chimney: true },
      gas_condensing: { label: 'Gas-Brennwertkessel', efficiency: 0.96, pricePerKwh: 11, maintenance: euro(220), chimney: true },
      heat_pump: { label: 'Wärmepumpe', efficiency: 3.1, pricePerKwh: 28, maintenance: euro(180), chimney: false },
      district: { label: 'Fernwärme', efficiency: 0.98, pricePerKwh: 12.5, maintenance: euro(90), chimney: false },
    } satisfies Record<HeatingSystem, { label: string; efficiency: number; pricePerKwh: number; maintenance: number; chimney: boolean }>,
    /** Preise in Cent (Bruchteile erlaubt, Rundung erst bei Buchung). */
    electricityPerKwh: 32,
    waterPerM3: 470,
    feedInPerKwh: 8,
    pvKwp: 24,
  },
  costs: {
    wastePerPersonMonth: euro(11.5),
    propertyTaxMonthly: euro(96),
    bankFeesMonthly: euro(12),
    cleaning: { none: 0, tenants: 0, biweekly: euro(170), weekly: euro(295) },
    garden: { none: 0, monthly: euro(95), biweekly: euro(170) },
    caretaker: { none: 0, parttime: euro(690), fulltime: euro(1950) },
    management: { self: 0, software: euro(39), agency: euro(29) /* pro Einheit */ },
    insurance: { none: 0, basic: euro(118), comfort: euro(182) },
    insuranceDeductible: { none: 0, basic: euro(1000), comfort: euro(400) },
    maintenancePlan: euro(89),
    winterService: euro(45),
    caretakerAllocatableShare: 0.7,
    tenantAppBase: euro(29),
    tenantAppPerUnit: euro(2),
    frameworkContractFee: euro(25),
    frameworkDiscount: 0.07,
  },
  finance: {
    overdraftInterest: 0.115,
    insolvencyGraceDays: 45,
    maxLoanToValue: 0.8,
    taxRate: 0.25,
    loanRiskPremium: 0.025,
    emergencyLoanRate: 0.095,
    earlyRepaymentFee: 0.01,
  },
  automation: {
    /** Provision des Vermietungsservice in Nettokaltmieten (ohne Hausverwaltung). */
    lettingFeeRents: 2,
  },
  investments: {
    /** Abgeltungsteuer inkl. Solidaritätszuschlag */
    capitalGainsTax: 0.26375,
    /** Sparer-Pauschbetrag pro Jahr */
    allowance: euro(1000),
    /** Teilfreistellung für Aktien-ETF */
    etfPartialExemption: 0.3,
    etfOrderFee: euro(5),
    etfMonthlyMean: 0.0055,
    etfMonthlySd: 0.042,
    savingsSpread: 0.012,
    savingsMinRate: 0.004,
    /** Festgeld-Aufschlag pro Laufzeitjahr */
    fixedPremiumPerYear: 0.0015,
  },
  realEstate: {
    /** Grunderwerbsteuer */
    transferTax: 0.06,
    /** Notar und Grundbuch */
    notary: 0.02,
    /** Maklercourtage Käuferanteil */
    broker: 0.0357,
    surveyBase: euro(1400),
    surveyRate: 0.0008,
    /** Spekulationsfrist in Tagen (10 Jahre) */
    speculationDays: 3650,
    saleCosts: 0.015,
    offerIntervalDays: [45, 110] as const,
    offerLifetimeDays: 75,
    maxOffers: 3,
  },
  valuation: {
    rentMultiplier: 19,
    landShare: 1,
  },
  time: {
    /** Millisekunden realer Zeit pro Spieltag. */
    speeds: { slow: 1400, normal: 700, fast: 220, turbo: 60 },
  },
  difficulty: {
    easy: { costFactor: 0.9, defectFactor: 0.75, paymentBonus: 8, applicantFactor: 1.2 },
    normal: { costFactor: 1, defectFactor: 1, paymentBonus: 0, applicantFactor: 1 },
    hard: { costFactor: 1.12, defectFactor: 1.3, paymentBonus: -8, applicantFactor: 0.8 },
  },
} as const;

export type Difficulty = keyof typeof CONFIG.difficulty;

/** Umlagefähige Kostenarten (Betriebskosten, die über die Nebenkostenabrechnung verteilt werden). */
export const ALLOCATABLE_CATEGORIES = ['heating', 'water', 'electricity', 'waste', 'cleaning', 'garden', 'insurance', 'property_tax', 'caretaker'] as const;
