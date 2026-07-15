/**
 * Central configuration for all measurement templates.
 *
 * All measurement forms are generated dynamically from this file.
 * To add a new garment type, add an entry to MEASUREMENT_TEMPLATES only.
 * No component code needs to change.
 */

export type MeasurementType =
  | 'shirt'
  | 'pant'
  | 'shalwar_kameez'
  | 'coat'
  | 'waistcoat'
  | 'custom';

export interface MeasurementField {
  /** Machine key stored in measurement_values.fieldName */
  key: string;
  /** Human-readable label shown in the form */
  label: string;
  /** Unit displayed after the input */
  unit: string;
  /** Whether the field is required (default: false) */
  required?: boolean;
}

export interface MeasurementTemplate {
  type: MeasurementType;
  /** Human-readable garment name */
  label: string;
  /** Material icon name */
  icon: string;
  /** Ordered list of measurement fields for this garment */
  fields: MeasurementField[];
}

// ── Template Definitions ──────────────────────────────────────────────────────

export const MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    type: 'shirt',
    label: 'Shirt',
    icon: 'checkroom',
    fields: [
      { key: 'neck', label: 'Neck', unit: 'in' },
      { key: 'chest', label: 'Chest', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'shoulder', label: 'Shoulder', unit: 'in' },
      { key: 'sleeveLength', label: 'Sleeve Length', unit: 'in' },
      { key: 'shirtLength', label: 'Shirt Length', unit: 'in' }
    ]
  },
  {
    type: 'pant',
    label: 'Pant',
    icon: 'straighten',
    fields: [
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'hip', label: 'Hip', unit: 'in' },
      { key: 'thigh', label: 'Thigh', unit: 'in' },
      { key: 'length', label: 'Length', unit: 'in' },
      { key: 'bottomWidth', label: 'Bottom Width', unit: 'in' }
    ]
  },
  {
    type: 'shalwar_kameez',
    label: 'Shalwar Kameez',
    icon: 'dry_cleaning',
    fields: [
      { key: 'chest', label: 'Chest', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'shoulder', label: 'Shoulder', unit: 'in' },
      { key: 'armLength', label: 'Arm Length', unit: 'in' },
      { key: 'collar', label: 'Collar', unit: 'in' },
      { key: 'kameezLength', label: 'Kameez Length', unit: 'in' },
      { key: 'shalwarLength', label: 'Shalwar Length', unit: 'in' }
    ]
  },
  {
    type: 'coat',
    label: 'Coat',
    icon: 'business_center',
    fields: [
      { key: 'chest', label: 'Chest', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'shoulder', label: 'Shoulder', unit: 'in' },
      { key: 'sleeveLength', label: 'Sleeve Length', unit: 'in' },
      { key: 'coatLength', label: 'Coat Length', unit: 'in' }
    ]
  },
  {
    type: 'waistcoat',
    label: 'Waistcoat',
    icon: 'style',
    fields: [
      { key: 'chest', label: 'Chest', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'shoulder', label: 'Shoulder', unit: 'in' },
      { key: 'length', label: 'Length', unit: 'in' }
    ]
  },
  {
    type: 'custom',
    label: 'Custom',
    icon: 'tune',
    fields: [] // User-defined fields added dynamically in the form
  }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Find a template by its type key.
 */
export function getTemplate(type: MeasurementType): MeasurementTemplate | undefined {
  return MEASUREMENT_TEMPLATES.find((t) => t.type === type);
}

/**
 * Get the human-readable label for a specific field within a garment type.
 * Falls back to the raw key if not found.
 */
export function getFieldLabel(type: MeasurementType, key: string): string {
  const template = getTemplate(type);
  if (!template) return key;
  const field = template.fields.find((f) => f.key === key);
  return field?.label ?? key;
}

/**
 * Get a badge color class for a given measurement type (used in list/detail views).
 */
export function getTypeBadgeClass(type: MeasurementType): string {
  const map: Record<MeasurementType, string> = {
    shirt: 'badge-shirt',
    pant: 'badge-pant',
    shalwar_kameez: 'badge-shalwar',
    coat: 'badge-coat',
    waistcoat: 'badge-waistcoat',
    custom: 'badge-custom'
  };
  return map[type] ?? 'badge-custom';
}
