export type ServiceKey =
  | 'Engine'
  | 'Electrical'
  | 'Transmission'
  | 'Suspension'
  | 'Brakes'
  | 'AC'
  | 'Fuel'
  | 'Maintenance'
  | 'Body Work'

export type Estimate = {
  label: string
  min: number
  max: number
  note: string
}

export const SYMPTOM_CATEGORY_MAP: Record<string, ServiceKey> = {
  'Car not starting': 'Electrical',
  'Car shaking / vibrating': 'Suspension',
  'Warning light on dashboard': 'Electrical',
  'Strange noise': 'Engine',
  'Burning smell': 'Engine',
  'Poor fuel consumption': 'Fuel',
  Overheating: 'Engine',
  'Gear problems': 'Transmission',
}

export const EMERGENCY_SYMPTOMS = new Set([
  'Car not starting',
  'Burning smell',
  'Overheating',
  'Gear problems',
])

export const SERVICE_ESTIMATES: Record<ServiceKey, Estimate> = {
  Engine: {
    label: 'Engine diagnostics or repair',
    min: 15000,
    max: 120000,
    note: 'Final quote depends on diagnostics, parts, and vehicle model.',
  },
  Electrical: {
    label: 'Electrical diagnostics',
    min: 8000,
    max: 60000,
    note: 'Battery, wiring, sensor, and scan-tool work can vary widely.',
  },
  Transmission: {
    label: 'Transmission or gearbox work',
    min: 25000,
    max: 250000,
    note: 'Gearbox repairs usually need inspection before a firm quote.',
  },
  Suspension: {
    label: 'Suspension or steering repair',
    min: 12000,
    max: 90000,
    note: 'Price changes with shocks, links, arms, bushings, and labour.',
  },
  Brakes: {
    label: 'Brake service',
    min: 10000,
    max: 80000,
    note: 'Pads, discs, drums, fluid, and ABS issues affect the quote.',
  },
  AC: {
    label: 'AC and cooling service',
    min: 10000,
    max: 70000,
    note: 'Gas refill is cheaper than compressor or leak repairs.',
  },
  Fuel: {
    label: 'Fuel system service',
    min: 10000,
    max: 85000,
    note: 'Injectors, pump, filter, and diagnostics can change the range.',
  },
  Maintenance: {
    label: 'Routine maintenance',
    min: 12000,
    max: 65000,
    note: 'Oil grade, filters, plugs, and vehicle size affect the price.',
  },
  'Body Work': {
    label: 'Body work',
    min: 20000,
    max: 180000,
    note: 'Panel beating and paint work depend on damage size and finish.',
  },
}

export function categoriesFromSymptoms(symptoms: string[]) {
  return [...new Set(symptoms.map((symptom) => SYMPTOM_CATEGORY_MAP[symptom]).filter(Boolean))]
}

export function isEmergencySymptom(symptoms: string[]) {
  return symptoms.some((symptom) => EMERGENCY_SYMPTOMS.has(symptom))
}

export function serviceKeyFromLabel(label: string): ServiceKey {
  if (label.includes('Electrical')) return 'Electrical'
  if (label.includes('Transmission')) return 'Transmission'
  if (label.includes('Suspension')) return 'Suspension'
  if (label.includes('Brakes')) return 'Brakes'
  if (label.includes('AC')) return 'AC'
  if (label.includes('Fuel')) return 'Fuel'
  if (label.includes('Routine')) return 'Maintenance'
  if (label.includes('Body')) return 'Body Work'
  return 'Engine'
}

export function adjustEstimateForMode(estimate: Estimate, mode: 'workshop' | 'home') {
  if (mode === 'workshop') return estimate
  return {
    ...estimate,
    min: estimate.min + 5000,
    max: estimate.max + 15000,
    note: `${estimate.note} Home service may include call-out fees.`,
  }
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`
}
