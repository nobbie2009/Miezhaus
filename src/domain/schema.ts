import { z } from 'zod';

/**
 * Fachliche Datenmodelle. Die Zod-Schemas sind die einzige Quelle der Wahrheit:
 * TypeScript-Typen werden daraus abgeleitet, und Spielstände werden beim Laden damit validiert.
 */

const int = z.number().int();
const cents = z.number().int();
const pct = z.number().min(0).max(100);
const id = z.string().min(1);

export const COMPONENT_KEYS = ['roof', 'facade', 'windows', 'pipes', 'electrical', 'heating', 'sanitary', 'stairwell', 'basement', 'outdoor'] as const;
export const ComponentKeySchema = z.enum(COMPONENT_KEYS);
export type ComponentKey = z.infer<typeof ComponentKeySchema>;

export const ComponentSchema = z.object({
  key: ComponentKeySchema,
  condition: pct,
  tier: int.min(1).max(5),
  installedYear: int,
  lastMaintenanceDay: int.nullable(),
  lastRenewalDay: int.nullable(),
});
export type Component = z.infer<typeof ComponentSchema>;

export const HEATING_SYSTEMS = ['oil_old', 'gas_old', 'gas_condensing', 'heat_pump', 'district'] as const;
export const HeatingSystemSchema = z.enum(HEATING_SYSTEMS);
export type HeatingSystem = z.infer<typeof HeatingSystemSchema>;

export const HistoryEntrySchema = z.object({ day: int, text: z.string(), cost: cents, target: z.string() });
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const BuildingSchema = z.object({
  id,
  name: z.string(),
  address: z.string(),
  city: z.string(),
  yearBuilt: int,
  landValue: cents,
  buildingClass: z.string(),
  /** Lagefaktor (Mikrolage) – multipliziert die ortsübliche Vergleichsmiete. */
  locationFactor: z.number().min(0.5).max(2),
  floors: int.min(1),
  heatingSystem: HeatingSystemSchema,
  insulationLevel: int.min(0).max(3),
  components: z.record(ComponentKeySchema, ComponentSchema),
  amenities: z.array(z.string()),
  cleanliness: pct,
  outdoorCare: pct,
  fireSafety: pct,
  security: pct,
  repairHistory: z.array(HistoryEntrySchema),
  modernizationHistory: z.array(HistoryEntrySchema),
});
export type Building = z.infer<typeof BuildingSchema>;

export const APARTMENT_STATUS = ['vacant_ready', 'rented', 'vacant_needs_renovation', 'renovating', 'uninhabitable', 'blocked'] as const;
export const ApartmentStatusSchema = z.enum(APARTMENT_STATUS);
export type ApartmentStatus = z.infer<typeof ApartmentStatusSchema>;

export const ListingSchema = z.object({ askingRent: cents, utilityPrepayment: cents, sinceDay: int, nextApplicantDay: int });
export type Listing = z.infer<typeof ListingSchema>;

export const ApartmentSchema = z.object({
  id,
  number: z.string(),
  floor: int,
  position: int,
  area: z.number().positive(),
  rooms: z.number().positive(),
  layout: z.string(),
  balcony: z.boolean(),
  kitchen: int.min(0).max(3),
  bath: int.min(0).max(3),
  flooring: int.min(0).max(3),
  condition: pct,
  smartThermostat: z.boolean(),
  status: ApartmentStatusSchema,
  tenantId: z.string().nullable(),
  contractId: z.string().nullable(),
  lastRenovationDay: int.nullable(),
  listing: ListingSchema.nullable(),
  modernizationPool: cents,
  blockedUntil: int.nullable(),
});
export type Apartment = z.infer<typeof ApartmentSchema>;

export const TraitsSchema = z.object({
  tidiness: pct,
  noiseSensitivity: pct,
  ecoAwareness: pct,
  renovationDemands: pct,
  communicativeness: pct,
  frugality: pct,
  community: pct,
  constructionTolerance: pct,
  diy: pct,
  moveOutTendency: pct,
});
export type Traits = z.infer<typeof TraitsSchema>;

export const MoodSchema = z.object({ reason: z.string(), value: z.number(), untilDay: int });
export type Mood = z.infer<typeof MoodSchema>;

export const TENANT_STATUS = ['active', 'moving_out', 'former'] as const;
export const TenantSchema = z.object({
  id,
  name: z.string(),
  archetype: z.string(),
  householdSize: int.min(1).max(8),
  occupation: z.string(),
  monthlyIncome: cents,
  creditScore: pct,
  pets: z.boolean(),
  traits: TraitsSchema,
  needs: z.array(z.string()),
  satisfaction: pct,
  factors: z.record(z.string(), z.number()),
  moods: z.array(MoodSchema),
  paymentReliability: pct,
  financialStress: pct,
  energyFactor: z.number().min(0.3).max(2.5),
  apartmentId: z.string().nullable(),
  moveInDay: int,
  noticeDay: int.nullable(),
  moveOutDay: int.nullable(),
  moveOutReason: z.string().nullable(),
  status: z.enum(TENANT_STATUS),
  lastComplaintDay: int.nullable(),
  complaints: int,
  thanks: int,
  referralGiven: z.boolean(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const RentChangeSchema = z.object({ day: int, netRent: cents, utilityPrepayment: cents, reason: z.string() });
export const PendingRentIncreaseSchema = z.object({
  newRent: cents,
  effectiveDay: int,
  announcedDay: int,
  kind: z.enum(['comparable', 'modernization']),
  modernizationUsed: cents,
});
export type PendingRentIncrease = z.infer<typeof PendingRentIncreaseSchema>;

export const ContractSchema = z.object({
  id,
  apartmentId: id,
  tenantId: id,
  startDay: int,
  endDay: int.nullable(),
  netRent: cents,
  utilityPrepayment: cents,
  deposit: cents,
  depositHeld: cents,
  dueDay: int.min(1).max(28),
  specialTerms: z.array(z.string()),
  status: z.enum(['active', 'notice', 'ended']),
  noticeDay: int.nullable(),
  endedDay: int.nullable(),
  terminatedBy: z.enum(['tenant', 'landlord', 'mutual']).nullable(),
  lastRentIncreaseDay: int.nullable(),
  rentHistory: z.array(RentChangeSchema),
  changes: z.array(z.object({ day: int, text: z.string() })),
  pendingIncrease: PendingRentIncreaseSchema.nullable(),
  paymentPlan: z.object({ monthlyAmount: cents, startDay: int }).nullable(),
});
export type Contract = z.infer<typeof ContractSchema>;

export const ClaimPaymentSchema = z.object({ day: int, amount: cents, ledgerIds: z.array(z.string()) });
export const ClaimSchema = z.object({
  id,
  kind: z.enum(['rent', 'utility_settlement', 'damage']),
  contractId: id,
  tenantId: id,
  apartmentId: id,
  period: z.string(),
  createdDay: int,
  dueDay: int,
  netRent: cents,
  utilities: cents,
  amount: cents,
  paid: cents,
  status: z.enum(['open', 'partial', 'paid', 'written_off']),
  dunningLevel: int.min(0).max(3),
  lastDunningDay: int.nullable(),
  payments: z.array(ClaimPaymentSchema),
  plannedPayDay: int.nullable(),
  plannedFraction: z.number().min(0).max(1),
  note: z.string(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const LEDGER_CATEGORIES = [
  'rent',
  'utilities_prepayment',
  'utility_settlement',
  'insurance_payout',
  'subsidy',
  'compensation',
  'sale',
  'deposit_offset',
  'loan_disbursement',
  'other_income',
  'feed_in',
  'maintenance',
  'repair',
  'renovation',
  'modernization',
  'heating',
  'water',
  'electricity',
  'waste',
  'cleaning',
  'garden',
  'insurance',
  'administration',
  'caretaker',
  'interest',
  'loan_principal',
  'tax',
  'property_tax',
  'legal',
  'marketing',
  'damage',
  'utility_refund',
  'other_expense',
  'property_purchase',
  'purchase_costs',
  'property_sale',
  'investment_deposit',
  'investment_withdrawal',
  'investment_income',
  'capital_gains_tax',
] as const;
export const LedgerCategorySchema = z.enum(LEDGER_CATEGORIES);
export type LedgerCategory = z.infer<typeof LedgerCategorySchema>;

export const LedgerEntrySchema = z.object({
  id,
  day: int,
  category: LedgerCategorySchema,
  amount: cents,
  apartmentId: z.string().nullable(),
  componentKey: ComponentKeySchema.nullable(),
  purpose: z.string(),
  status: z.enum(['posted', 'reversed']),
  ref: z.object({ type: z.string(), id: z.string() }).nullable(),
  propertyId: z.string().nullable(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const LoanSchema = z.object({
  id,
  name: z.string(),
  kind: z.enum(['bank', 'subsidy', 'initial']),
  principal: cents,
  remaining: cents,
  annualRate: z.number().min(0).max(0.5),
  termMonths: int.min(1),
  monthlyPayment: cents,
  startDay: int,
  paidMonths: int,
  purpose: z.string(),
});
export type Loan = z.infer<typeof LoanSchema>;

export const TRADES = ['plumbing', 'electric', 'painting', 'roofing', 'heating', 'cleaning', 'garden', 'general'] as const;
export const TradeSchema = z.enum(TRADES);
export type Trade = z.infer<typeof TradeSchema>;

export const ContractorSchema = z.object({
  id,
  name: z.string(),
  trade: TradeSchema,
  priceFactor: z.number().min(0.5).max(2),
  quality: int.min(1).max(5),
  reliability: pct,
  waitDays: int.min(0),
  jobsDone: int,
  available: z.boolean(),
  busyUntil: int,
  description: z.string(),
});
export type Contractor = z.infer<typeof ContractorSchema>;

export const DefectTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('component'), key: ComponentKeySchema }),
  z.object({ kind: z.literal('apartment'), apartmentId: id }),
]);
export type DefectTarget = z.infer<typeof DefectTargetSchema>;

export const DefectSchema = z.object({
  id,
  type: z.string(),
  target: DefectTargetSchema,
  severity: int.min(1).max(3),
  createdDay: int,
  discovered: z.boolean(),
  discoveredDay: int.nullable(),
  reportedBy: z.string().nullable(),
  escalateAtDay: int.nullable(),
  jobId: z.string().nullable(),
  cause: z.string(),
  escalatedFrom: z.string().nullable(),
  resolvedDay: int.nullable(),
  insuranceClaimed: z.boolean(),
});
export type Defect = z.infer<typeof DefectSchema>;

export const JobTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('component'), key: ComponentKeySchema }),
  z.object({ kind: z.literal('apartment'), apartmentId: id }),
  z.object({ kind: z.literal('building') }),
]);
export type JobTarget = z.infer<typeof JobTargetSchema>;

export const JOB_STATUS = ['scheduled', 'in_progress', 'done', 'cancelled'] as const;
export const JobSchema = z.object({
  id,
  kind: z.enum(['repair', 'maintenance', 'renovation', 'modernization']),
  measureId: z.string().nullable(),
  defectIds: z.array(z.string()),
  target: JobTargetSchema,
  title: z.string(),
  description: z.string(),
  cause: z.string(),
  urgency: z.enum(['low', 'normal', 'high', 'critical']),
  trade: TradeSchema,
  contractorId: id,
  estimatedCost: cents,
  uncertainty: z.number().min(0).max(1),
  actualCost: cents.nullable(),
  estimatedDays: int.min(1),
  workedDays: int,
  createdDay: int,
  startDay: int,
  completedDay: int.nullable(),
  status: z.enum(JOB_STATUS),
  paid: cents,
  materials: z.array(z.string()),
  expectedEffects: z.array(z.string()),
  noise: int.min(0).max(3),
  blocksApartment: z.boolean(),
  subsidyRate: z.number().min(0).max(1),
  delays: int,
});
export type Job = z.infer<typeof JobSchema>;

export const InsuranceClaimSchema = z.object({
  id,
  defectId: z.string(),
  jobId: z.string().nullable(),
  description: z.string(),
  amountClaimed: cents,
  deductible: cents,
  status: z.enum(['pending', 'paid', 'rejected']),
  filedDay: int,
  decisionDay: int,
  payout: cents,
  reduction: z.number().min(0).max(1),
});
export type InsuranceClaim = z.infer<typeof InsuranceClaimSchema>;

export const ServicesSchema = z.object({
  cleaning: z.enum(['none', 'tenants', 'biweekly', 'weekly']),
  garden: z.enum(['none', 'monthly', 'biweekly']),
  caretaker: z.enum(['none', 'parttime', 'fulltime']),
  management: z.enum(['self', 'software', 'agency']),
  insurance: z.enum(['none', 'basic', 'comfort']),
  maintenancePlan: z.boolean(),
  winterService: z.boolean(),
  /** Mieter-App: Mieter melden Schäden digital, Aufträge können automatisch vergeben werden. */
  tenantApp: z.boolean(),
});
export type Services = z.infer<typeof ServicesSchema>;

export const ApplicantSchema = z.object({
  id,
  apartmentId: id,
  name: z.string(),
  archetype: z.string(),
  householdSize: int,
  occupation: z.string(),
  monthlyIncome: cents,
  creditScore: pct,
  pets: z.boolean(),
  maxRent: cents,
  desiredMoveInDays: int,
  expectedStayYears: z.number(),
  needs: z.array(z.string()),
  traits: TraitsSchema,
  paymentReliability: pct,
  energyFactor: z.number(),
  arrivedDay: int,
  expiresDay: int,
  referredBy: z.string().nullable(),
  declined: z.boolean(),
});
export type Applicant = z.infer<typeof ApplicantSchema>;

export const DecisionOptionSchema = z.object({ id, label: z.string(), description: z.string(), costHint: cents.nullable() });
export const DecisionSchema = z.object({
  id,
  eventId: z.string(),
  day: int,
  title: z.string(),
  text: z.string(),
  options: z.array(DecisionOptionSchema).min(1),
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  expiresDay: int,
  defaultOptionId: z.string(),
  severity: z.enum(['info', 'warning', 'danger']),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const MESSAGE_CATEGORIES = ['tenant', 'building', 'finance', 'event', 'system', 'contractor', 'goal'] as const;
export const MessageSchema = z.object({
  id,
  day: int,
  category: z.enum(MESSAGE_CATEGORIES),
  severity: z.enum(['info', 'success', 'warning', 'danger']),
  title: z.string(),
  text: z.string(),
  tenantId: z.string().nullable(),
  apartmentId: z.string().nullable(),
  defectId: z.string().nullable(),
  link: z.object({ page: z.string(), id: z.string().nullable() }).nullable(),
  propertyId: z.string().nullable(),
  read: z.boolean(),
  important: z.boolean(),
});
export type Message = z.infer<typeof MessageSchema>;

export const SnapshotSchema = z.object({
  period: z.string(),
  day: int,
  cash: cents,
  income: cents,
  expenses: cents,
  operatingCashflow: cents,
  financingCashflow: cents,
  investments: cents,
  repairCosts: cents,
  rentDue: cents,
  rentCollected: cents,
  arrears: cents,
  arrears30: cents,
  arrears60: cents,
  arrears90: cents,
  arrearsOver90: cents,
  occupied: int,
  units: int,
  vacancyRate: z.number(),
  avgSatisfaction: z.number(),
  buildingCondition: z.number(),
  backlogCost: cents,
  energyKwh: z.number(),
  energyCost: cents,
  waterM3: z.number(),
  marketValue: cents,
  loanBalance: cents,
  equity: cents,
  netRentMonthly: cents,
  score: z.number(),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

export const GoalStateSchema = z.object({
  id: z.string(),
  progress: z.number().min(0).max(1),
  status: z.enum(['active', 'done', 'failed']),
  completedDay: int.nullable(),
  counter: z.number(),
});
export type GoalState = z.infer<typeof GoalStateSchema>;

export const MarketModifierSchema = z.object({
  id: z.string(),
  kind: z.enum(['energy', 'material', 'rent', 'interest', 'subsidy_energy', 'demand']),
  value: z.number(),
  untilDay: int,
  label: z.string(),
});

export const MarketSchema = z.object({
  baseRentPerSqm: cents,
  energyPriceIndex: z.number().positive(),
  materialIndex: z.number().positive(),
  interestRate: z.number().min(0).max(0.3),
  demandIndex: z.number().positive(),
  modifiers: z.array(MarketModifierSchema),
});
export type Market = z.infer<typeof MarketSchema>;

export const EnergyMonthSchema = z.object({
  heatKwh: z.number(),
  hotWaterKwh: z.number(),
  commonKwh: z.number(),
  pvKwh: z.number(),
  waterM3: z.number(),
  degreeDays: z.number(),
  heatCost: z.number(),
  elecCost: z.number(),
  waterCost: z.number(),
  feedIn: z.number(),
});
export type EnergyMonth = z.infer<typeof EnergyMonthSchema>;

export const SettingsSchema = z.object({
  difficulty: z.enum(['easy', 'normal', 'hard']),
  eventFrequency: z.number().min(0).max(3),
  autoPauseOnDecision: z.boolean(),
  autoDunning: z.boolean(),
});
export type GameSettings = z.infer<typeof SettingsSchema>;

export const InvestmentSchema = z.object({
  id,
  kind: z.enum(['savings', 'fixed', 'etf']),
  name: z.string(),
  /** Eingezahltes Kapital (Einstandswert) */
  principal: cents,
  /** Aktueller Wert */
  value: cents,
  annualRate: z.number(),
  startDay: int,
  maturityDay: int.nullable(),
  /** Aufgelaufene, noch nicht ausgezahlte Zinsen (Bruchteile von Cent) */
  accrued: z.number(),
  history: z.array(z.object({ day: int, value: cents })),
});
export type Investment = z.infer<typeof InvestmentSchema>;

export const AutomationSchema = z.object({
  autoRepair: z.boolean(),
  maxAutoCost: cents,
  monthlyBudget: cents,
  minCashReserve: cents,
  strategy: z.enum(['value', 'cheap', 'quality', 'fast']),
  includeCritical: z.boolean(),
  preferred: z.record(z.string(), z.string()),
  frameworkContracts: z.array(z.string()),
  autoLetting: z.boolean(),
  lettingRentFactor: z.number().min(0.7).max(1.1),
  minApplicantFit: z.number().min(0).max(1),
  autoRenovateVacant: z.boolean(),
  autoMaintenance: z.boolean(),
});
export type Automation = z.infer<typeof AutomationSchema>;

export const GameModeSchema = z.enum(['campaign', 'endless', 'challenge', 'sandbox']);
export type GameMode = z.infer<typeof GameModeSchema>;

/** Weitere Immobilie im Portfolio (das Stammhaus liegt direkt im Spielstand). */
export const PropertySchema = z.object({
  building: BuildingSchema,
  apartments: z.array(ApartmentSchema),
  tenants: z.array(TenantSchema),
  contracts: z.array(ContractSchema),
  claims: z.array(ClaimSchema),
  defects: z.array(DefectSchema),
  jobs: z.array(JobSchema),
  services: ServicesSchema,
  insuranceClaims: z.array(InsuranceClaimSchema),
  applicants: z.array(ApplicantSchema),
  energyMonth: EnergyMonthSchema,
  energyHistory: z.array(EnergyMonthSchema.extend({ period: z.string(), cost: cents })),
  counters: z.record(z.string(), z.number()),
  purchaseDay: int,
  purchasePrice: cents,
});
export type Property = z.infer<typeof PropertySchema>;

export const PropertyOfferSchema = z.object({
  id,
  listedDay: int,
  expiresDay: int,
  askingPrice: cents,
  /** Geschätzter Zustand laut Exposé (ungenau) */
  advertisedCondition: z.number(),
  surveyed: z.boolean(),
  seller: z.string(),
  pitch: z.string(),
  property: PropertySchema,
});
export type PropertyOffer = z.infer<typeof PropertyOfferSchema>;

export const GameStateSchema = z.object({
  schemaVersion: int,
  saveId: id,
  saveName: z.string(),
  scenarioId: z.string(),
  mode: GameModeSchema,
  seed: int,
  rng: int,
  startDay: int,
  day: int,
  endDay: int.nullable(),
  cash: cents,
  startCash: cents,
  overdraftLimit: cents,
  daysBelowOverdraft: int,
  building: BuildingSchema,
  apartments: z.array(ApartmentSchema),
  tenants: z.array(TenantSchema),
  contracts: z.array(ContractSchema),
  claims: z.array(ClaimSchema),
  ledger: z.array(LedgerEntrySchema),
  loans: z.array(LoanSchema),
  contractors: z.array(ContractorSchema),
  defects: z.array(DefectSchema),
  jobs: z.array(JobSchema),
  services: ServicesSchema,
  insuranceClaims: z.array(InsuranceClaimSchema),
  applicants: z.array(ApplicantSchema),
  decisions: z.array(DecisionSchema),
  messages: z.array(MessageSchema),
  history: z.array(SnapshotSchema),
  energyMonth: EnergyMonthSchema,
  energyHistory: z.array(EnergyMonthSchema.extend({ period: z.string(), cost: cents })),
  market: MarketSchema,
  goals: z.array(GoalStateSchema),
  achievements: z.array(z.object({ id: z.string(), day: int })),
  phase: int.min(1).max(5),
  unlocks: z.array(z.string()),
  counters: z.record(z.string(), z.number()),
  eventCooldowns: z.record(z.string(), int),
  settings: SettingsSchema,
  tutorialStep: int,
  idCounter: int,
  gameOver: z
    .object({ kind: z.enum(['insolvency', 'won', 'lost']), day: int, title: z.string(), text: z.string() })
    .nullable(),
  log: z.array(z.object({ day: int, text: z.string(), kind: z.string() })),
  properties: z.array(PropertySchema),
  propertyMarket: z.array(PropertyOfferSchema),
  investments: z.array(InvestmentSchema),
  automation: AutomationSchema,
  purchaseDay: int,
  purchasePrice: cents,
});
export type GameState = z.infer<typeof GameStateSchema>;
