export interface FormField {
  id: string
  number: number
  label: string
  type: 'text' | 'select' | 'date' | 'radio' | 'checkbox' | 'textarea' | 'tel' | 'email'
  required: boolean
  section: string
  options?: { value: string; label: string }[]
  placeholder?: string
  help?: string
  validation?: {
    pattern?: RegExp
    message?: string
    minLength?: number
    maxLength?: number
  }
}

export interface FormData {
  [key: string]: string | boolean | string[]
}

export interface FormFieldState {
  value: string | boolean | string[]
  touched: boolean
  error?: string
  highlighted: boolean
}

export interface FormState {
  fields: Record<string, FormFieldState>
  currentSection: string
  completionPercentage: number
}

// All 37 fields of the Schengen visa form
export const SCHENGEN_FIELDS: FormField[] = [
  // Section 1: Personal Information
  {
    id: 'surname',
    number: 1,
    label: 'Surname (Family name)',
    type: 'text',
    required: true,
    section: 'personal',
    placeholder: 'As shown in passport',
    help: 'Enter your surname(s) exactly as they appear in your travel document',
    validation: { minLength: 1, maxLength: 50 }
  },
  {
    id: 'surname_at_birth',
    number: 2,
    label: 'Surname at birth (Former family name(s))',
    type: 'text',
    required: false,
    section: 'personal',
    placeholder: 'If different from current surname',
    help: 'Only fill this if your surname has changed since birth'
  },
  {
    id: 'first_names',
    number: 3,
    label: 'First name(s) (Given name(s))',
    type: 'text',
    required: true,
    section: 'personal',
    placeholder: 'As shown in passport',
    help: 'Enter all your first names as they appear in your travel document'
  },
  {
    id: 'date_of_birth',
    number: 4,
    label: 'Date of birth',
    type: 'date',
    required: true,
    section: 'personal',
    help: 'Format: DD/MM/YYYY'
  },
  {
    id: 'place_of_birth',
    number: 5,
    label: 'Place of birth',
    type: 'text',
    required: true,
    section: 'personal',
    placeholder: 'City/Town'
  },
  {
    id: 'country_of_birth',
    number: 6,
    label: 'Country of birth',
    type: 'select',
    required: true,
    section: 'personal',
    options: [
      { value: '', label: 'Select country...' },
      { value: 'AF', label: 'Afghanistan' },
      { value: 'AL', label: 'Albania' },
      { value: 'DZ', label: 'Algeria' },
      { value: 'AR', label: 'Argentina' },
      { value: 'AU', label: 'Australia' },
      { value: 'BD', label: 'Bangladesh' },
      { value: 'BR', label: 'Brazil' },
      { value: 'CA', label: 'Canada' },
      { value: 'CN', label: 'China' },
      { value: 'EG', label: 'Egypt' },
      { value: 'IN', label: 'India' },
      { value: 'ID', label: 'Indonesia' },
      { value: 'IR', label: 'Iran' },
      { value: 'IQ', label: 'Iraq' },
      { value: 'JP', label: 'Japan' },
      { value: 'KE', label: 'Kenya' },
      { value: 'MY', label: 'Malaysia' },
      { value: 'MX', label: 'Mexico' },
      { value: 'MA', label: 'Morocco' },
      { value: 'NG', label: 'Nigeria' },
      { value: 'PK', label: 'Pakistan' },
      { value: 'PH', label: 'Philippines' },
      { value: 'RO', label: 'Romania' },
      { value: 'RU', label: 'Russia' },
      { value: 'SA', label: 'Saudi Arabia' },
      { value: 'ZA', label: 'South Africa' },
      { value: 'KR', label: 'South Korea' },
      { value: 'TH', label: 'Thailand' },
      { value: 'TR', label: 'Turkey' },
      { value: 'UA', label: 'Ukraine' },
      { value: 'AE', label: 'United Arab Emirates' },
      { value: 'GB', label: 'United Kingdom' },
      { value: 'US', label: 'United States' },
      { value: 'VN', label: 'Vietnam' },
      { value: 'OTHER', label: 'Other...' },
    ]
  },
  {
    id: 'current_nationality',
    number: 7,
    label: 'Current nationality',
    type: 'select',
    required: true,
    section: 'personal',
    options: [
      { value: '', label: 'Select nationality...' },
      { value: 'AF', label: 'Afghan' },
      { value: 'AL', label: 'Albanian' },
      { value: 'DZ', label: 'Algerian' },
      { value: 'AR', label: 'Argentine' },
      { value: 'AU', label: 'Australian' },
      { value: 'BD', label: 'Bangladeshi' },
      { value: 'BR', label: 'Brazilian' },
      { value: 'CA', label: 'Canadian' },
      { value: 'CN', label: 'Chinese' },
      { value: 'EG', label: 'Egyptian' },
      { value: 'IN', label: 'Indian' },
      { value: 'ID', label: 'Indonesian' },
      { value: 'IR', label: 'Iranian' },
      { value: 'IQ', label: 'Iraqi' },
      { value: 'JP', label: 'Japanese' },
      { value: 'KE', label: 'Kenyan' },
      { value: 'MY', label: 'Malaysian' },
      { value: 'MX', label: 'Mexican' },
      { value: 'MA', label: 'Moroccan' },
      { value: 'NG', label: 'Nigerian' },
      { value: 'PK', label: 'Pakistani' },
      { value: 'PH', label: 'Filipino' },
      { value: 'RO', label: 'Romanian' },
      { value: 'RU', label: 'Russian' },
      { value: 'SA', label: 'Saudi' },
      { value: 'ZA', label: 'South African' },
      { value: 'KR', label: 'South Korean' },
      { value: 'TH', label: 'Thai' },
      { value: 'TR', label: 'Turkish' },
      { value: 'UA', label: 'Ukrainian' },
      { value: 'AE', label: 'Emirati' },
      { value: 'GB', label: 'British' },
      { value: 'US', label: 'American' },
      { value: 'VN', label: 'Vietnamese' },
      { value: 'OTHER', label: 'Other...' },
    ],
    help: 'Nationality at birth, if different: ________________'
  },
  {
    id: 'sex',
    number: 8,
    label: 'Sex',
    type: 'radio',
    required: true,
    section: 'personal',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ]
  },
  {
    id: 'civil_status',
    number: 9,
    label: 'Civil status',
    type: 'select',
    required: true,
    section: 'personal',
    options: [
      { value: '', label: 'Select status...' },
      { value: 'single', label: 'Single' },
      { value: 'married', label: 'Married' },
      { value: 'separated', label: 'Separated' },
      { value: 'divorced', label: 'Divorced' },
      { value: 'widowed', label: 'Widow(er)' },
      { value: 'other', label: 'Other (please specify)' },
    ]
  },
  {
    id: 'national_id_number',
    number: 11,
    label: 'National identity number (if applicable)',
    type: 'text',
    required: false,
    section: 'personal',
    placeholder: 'If your country issues national ID numbers'
  },

  // Section 2: Travel Document
  {
    id: 'travel_document_type',
    number: 12,
    label: 'Type of travel document',
    type: 'select',
    required: true,
    section: 'travel_document',
    options: [
      { value: '', label: 'Select type...' },
      { value: 'ordinary', label: 'Ordinary passport' },
      { value: 'diplomatic', label: 'Diplomatic passport' },
      { value: 'service', label: 'Service passport' },
      { value: 'official', label: 'Official passport' },
      { value: 'special', label: 'Special passport' },
      { value: 'other', label: 'Other travel document (please specify)' },
    ]
  },
  {
    id: 'passport_number',
    number: 13,
    label: 'Number of travel document',
    type: 'text',
    required: true,
    section: 'travel_document',
    placeholder: 'Passport number',
    help: 'Enter exactly as shown in your passport'
  },
  {
    id: 'passport_issue_date',
    number: 14,
    label: 'Date of issue',
    type: 'date',
    required: true,
    section: 'travel_document'
  },
  {
    id: 'passport_expiry_date',
    number: 15,
    label: 'Valid until',
    type: 'date',
    required: true,
    section: 'travel_document',
    help: 'Must be valid for at least 3 months after your planned departure from Schengen area'
  },
  {
    id: 'passport_issued_by',
    number: 16,
    label: 'Issued by (country/authority)',
    type: 'text',
    required: true,
    section: 'travel_document',
    placeholder: 'Issuing authority'
  },

  // Section 3: Contact Information
  {
    id: 'home_address',
    number: 19,
    label: 'Home address',
    type: 'textarea',
    required: true,
    section: 'contact',
    placeholder: 'Street, house number, postal code, city'
  },
  {
    id: 'email',
    number: 19,
    label: 'E-mail address',
    type: 'email',
    required: true,
    section: 'contact',
    placeholder: 'your.email@example.com'
  },
  {
    id: 'phone',
    number: 19,
    label: 'Telephone number(s)',
    type: 'tel',
    required: true,
    section: 'contact',
    placeholder: '+1 234 567 8900',
    help: 'Include country code'
  },

  // Section 4: Occupation
  {
    id: 'occupation',
    number: 21,
    label: 'Current occupation',
    type: 'text',
    required: true,
    section: 'occupation',
    placeholder: 'e.g., Software Engineer, Student, Retired'
  },
  {
    id: 'employer_name',
    number: 21,
    label: 'Employer/School name and address',
    type: 'textarea',
    required: false,
    section: 'occupation',
    placeholder: 'Company/Institution name and full address'
  },
  {
    id: 'employer_phone',
    number: 21,
    label: 'Employer telephone',
    type: 'tel',
    required: false,
    section: 'occupation',
    placeholder: '+1 234 567 8900'
  },

  // Section 5: Travel Details
  {
    id: 'purpose_of_journey',
    number: 23,
    label: 'Main purpose(s) of the journey',
    type: 'select',
    required: true,
    section: 'travel',
    options: [
      { value: '', label: 'Select purpose...' },
      { value: 'tourism', label: 'Tourism' },
      { value: 'business', label: 'Business' },
      { value: 'visiting_family', label: 'Visiting family or friends' },
      { value: 'cultural', label: 'Cultural' },
      { value: 'sports', label: 'Sports' },
      { value: 'official_visit', label: 'Official visit' },
      { value: 'medical', label: 'Medical reasons' },
      { value: 'study', label: 'Study' },
      { value: 'transit', label: 'Transit' },
      { value: 'airport_transit', label: 'Airport transit' },
      { value: 'other', label: 'Other (please specify)' },
    ]
  },
  {
    id: 'destination_country',
    number: 24,
    label: 'Member State of destination',
    type: 'select',
    required: true,
    section: 'travel',
    options: [
      { value: '', label: 'Select country...' },
      { value: 'AT', label: 'Austria' },
      { value: 'BE', label: 'Belgium' },
      { value: 'HR', label: 'Croatia' },
      { value: 'CZ', label: 'Czech Republic' },
      { value: 'DK', label: 'Denmark' },
      { value: 'EE', label: 'Estonia' },
      { value: 'FI', label: 'Finland' },
      { value: 'FR', label: 'France' },
      { value: 'DE', label: 'Germany' },
      { value: 'GR', label: 'Greece' },
      { value: 'HU', label: 'Hungary' },
      { value: 'IS', label: 'Iceland' },
      { value: 'IT', label: 'Italy' },
      { value: 'LV', label: 'Latvia' },
      { value: 'LI', label: 'Liechtenstein' },
      { value: 'LT', label: 'Lithuania' },
      { value: 'LU', label: 'Luxembourg' },
      { value: 'MT', label: 'Malta' },
      { value: 'NL', label: 'Netherlands' },
      { value: 'NO', label: 'Norway' },
      { value: 'PL', label: 'Poland' },
      { value: 'PT', label: 'Portugal' },
      { value: 'SK', label: 'Slovakia' },
      { value: 'SI', label: 'Slovenia' },
      { value: 'ES', label: 'Spain' },
      { value: 'SE', label: 'Sweden' },
      { value: 'CH', label: 'Switzerland' },
    ],
    help: 'If visiting multiple Schengen countries, select the main destination (longest stay)'
  },
  {
    id: 'first_entry_country',
    number: 25,
    label: 'Member State of first entry',
    type: 'select',
    required: true,
    section: 'travel',
    options: [
      { value: '', label: 'Select country...' },
      { value: 'AT', label: 'Austria' },
      { value: 'BE', label: 'Belgium' },
      { value: 'HR', label: 'Croatia' },
      { value: 'CZ', label: 'Czech Republic' },
      { value: 'DK', label: 'Denmark' },
      { value: 'EE', label: 'Estonia' },
      { value: 'FI', label: 'Finland' },
      { value: 'FR', label: 'France' },
      { value: 'DE', label: 'Germany' },
      { value: 'GR', label: 'Greece' },
      { value: 'HU', label: 'Hungary' },
      { value: 'IS', label: 'Iceland' },
      { value: 'IT', label: 'Italy' },
      { value: 'LV', label: 'Latvia' },
      { value: 'LI', label: 'Liechtenstein' },
      { value: 'LT', label: 'Lithuania' },
      { value: 'LU', label: 'Luxembourg' },
      { value: 'MT', label: 'Malta' },
      { value: 'NL', label: 'Netherlands' },
      { value: 'NO', label: 'Norway' },
      { value: 'PL', label: 'Poland' },
      { value: 'PT', label: 'Portugal' },
      { value: 'SK', label: 'Slovakia' },
      { value: 'SI', label: 'Slovenia' },
      { value: 'ES', label: 'Spain' },
      { value: 'SE', label: 'Sweden' },
      { value: 'CH', label: 'Switzerland' },
    ]
  },
  {
    id: 'entries_requested',
    number: 26,
    label: 'Number of entries requested',
    type: 'radio',
    required: true,
    section: 'travel',
    options: [
      { value: 'single', label: 'Single entry' },
      { value: 'double', label: 'Two entries' },
      { value: 'multiple', label: 'Multiple entries' },
    ]
  },
  {
    id: 'duration_of_stay',
    number: 27,
    label: 'Duration of the intended stay (days)',
    type: 'text',
    required: true,
    section: 'travel',
    placeholder: 'Number of days',
    help: 'Maximum 90 days within any 180-day period',
    validation: { pattern: /^\d+$/, message: 'Please enter a number' }
  },
  {
    id: 'arrival_date',
    number: 29,
    label: 'Intended date of arrival in the Schengen area',
    type: 'date',
    required: true,
    section: 'travel'
  },
  {
    id: 'departure_date',
    number: 30,
    label: 'Intended date of departure from the Schengen area',
    type: 'date',
    required: true,
    section: 'travel'
  },

  // Section 6: Previous Visas
  {
    id: 'previous_schengen_visas',
    number: 28,
    label: 'Schengen visas issued during the past three years',
    type: 'radio',
    required: true,
    section: 'previous_visas',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes (please provide dates of validity)' },
    ]
  },
  {
    id: 'previous_visa_dates',
    number: 28,
    label: 'Dates of validity (if yes)',
    type: 'text',
    required: false,
    section: 'previous_visas',
    placeholder: 'From DD/MM/YYYY to DD/MM/YYYY'
  },
  {
    id: 'fingerprints_collected',
    number: 29,
    label: 'Fingerprints collected previously for a Schengen visa',
    type: 'radio',
    required: true,
    section: 'previous_visas',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes (date, if known)' },
    ]
  },

  // Section 7: Accommodation
  {
    id: 'accommodation_type',
    number: 31,
    label: 'Accommodation',
    type: 'select',
    required: true,
    section: 'accommodation',
    options: [
      { value: '', label: 'Select type...' },
      { value: 'hotel', label: 'Hotel / Hostel' },
      { value: 'rented', label: 'Rented accommodation' },
      { value: 'host', label: 'Staying with family/friends' },
      { value: 'other', label: 'Other (please specify)' },
    ]
  },
  {
    id: 'accommodation_details',
    number: 31,
    label: 'Name and address of hotel / host',
    type: 'textarea',
    required: true,
    section: 'accommodation',
    placeholder: 'Hotel name and full address, or name and address of inviting person'
  },
  {
    id: 'host_phone',
    number: 31,
    label: 'Telephone number of hotel / host',
    type: 'tel',
    required: false,
    section: 'accommodation',
    placeholder: '+33 1 234 5678'
  },
  {
    id: 'host_email',
    number: 31,
    label: 'E-mail address of hotel / host',
    type: 'email',
    required: false,
    section: 'accommodation'
  },

  // Section 8: Costs / Financial Means
  {
    id: 'travel_costs_by',
    number: 33,
    label: 'Cost of travelling and living is covered',
    type: 'select',
    required: true,
    section: 'financial',
    options: [
      { value: '', label: 'Select who is covering costs...' },
      { value: 'self', label: 'By the applicant himself/herself' },
      { value: 'sponsor', label: 'By a sponsor (host, company, organisation)' },
    ]
  },
  {
    id: 'means_of_support',
    number: 33,
    label: 'Means of support',
    type: 'select',
    required: true,
    section: 'financial',
    options: [
      { value: '', label: 'Select means of support...' },
      { value: 'cash', label: 'Cash' },
      { value: 'credit_card', label: 'Credit card' },
      { value: 'travellers_cheques', label: "Traveller's cheques" },
      { value: 'prepaid', label: 'Prepaid accommodation' },
      { value: 'prepaid_transport', label: 'Prepaid transport' },
      { value: 'other', label: 'Other (please specify)' },
    ]
  },
]

export const FORM_SECTIONS = [
  { id: 'personal', title: 'Personal Data', icon: '👤' },
  { id: 'travel_document', title: 'Travel Document', icon: '📘' },
  { id: 'contact', title: 'Contact Information', icon: '📞' },
  { id: 'occupation', title: 'Occupation', icon: '💼' },
  { id: 'travel', title: 'Travel Details', icon: '✈️' },
  { id: 'previous_visas', title: 'Previous Schengen Visas', icon: '📋' },
  { id: 'accommodation', title: 'Accommodation', icon: '🏨' },
  { id: 'financial', title: 'Cost of Travel / Means of Support', icon: '💳' },
]
