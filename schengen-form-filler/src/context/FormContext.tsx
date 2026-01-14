import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'
import { SCHENGEN_FIELDS, FormFieldState } from '../types/form'

interface FormContextState {
  fields: Record<string, FormFieldState>
  highlightedField: string | null
}

type FormAction =
  | { type: 'SET_FIELD_VALUE'; fieldId: string; value: string | boolean | string[] }
  | { type: 'SET_FIELD_ERROR'; fieldId: string; error: string | undefined }
  | { type: 'SET_FIELD_TOUCHED'; fieldId: string }
  | { type: 'HIGHLIGHT_FIELD'; fieldId: string }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Record<string, string | boolean | string[]> }

interface FormContextValue {
  state: FormContextState
  setFieldValue: (fieldId: string, value: string | boolean | string[]) => void
  setFieldError: (fieldId: string, error: string | undefined) => void
  setFieldTouched: (fieldId: string) => void
  highlightField: (fieldId: string) => void
  clearHighlight: () => void
  getFieldValue: (fieldId: string) => string | boolean | string[]
  getFormData: () => Record<string, string | boolean | string[]>
  getFormLayout: () => Array<{ id: string; label: string; value: string | boolean | string[]; type: string; section: string; error?: string; required?: boolean }>
  setMultipleFields: (fields: Record<string, string | boolean | string[]>) => void
  getCompletionPercentage: () => number
}

const FormContext = createContext<FormContextValue | null>(null)

// Initialize all fields with empty state
const initialFields: Record<string, FormFieldState> = {}
SCHENGEN_FIELDS.forEach((field) => {
  initialFields[field.id] = {
    value: field.type === 'checkbox' ? false : '',
    touched: false,
    error: undefined,
    highlighted: false,
  }
})

const initialState: FormContextState = {
  fields: initialFields,
  highlightedField: null,
}

function formReducer(state: FormContextState, action: FormAction): FormContextState {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldId]: {
            ...state.fields[action.fieldId],
            value: action.value,
            touched: true,
          },
        },
      }

    case 'SET_FIELD_ERROR':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldId]: {
            ...state.fields[action.fieldId],
            error: action.error,
          },
        },
      }

    case 'SET_FIELD_TOUCHED':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldId]: {
            ...state.fields[action.fieldId],
            touched: true,
          },
        },
      }

    case 'HIGHLIGHT_FIELD':
      // Clear previous highlight and set new one
      const newFields = { ...state.fields }
      if (state.highlightedField && newFields[state.highlightedField]) {
        newFields[state.highlightedField] = {
          ...newFields[state.highlightedField],
          highlighted: false,
        }
      }
      if (newFields[action.fieldId]) {
        newFields[action.fieldId] = {
          ...newFields[action.fieldId],
          highlighted: true,
        }
      }
      return {
        ...state,
        fields: newFields,
        highlightedField: action.fieldId,
      }

    case 'CLEAR_HIGHLIGHT':
      if (!state.highlightedField) return state
      return {
        ...state,
        fields: {
          ...state.fields,
          [state.highlightedField]: {
            ...state.fields[state.highlightedField],
            highlighted: false,
          },
        },
        highlightedField: null,
      }

    case 'SET_MULTIPLE_FIELDS':
      const updatedFields = { ...state.fields }
      Object.entries(action.fields).forEach(([fieldId, value]) => {
        if (updatedFields[fieldId]) {
          updatedFields[fieldId] = {
            ...updatedFields[fieldId],
            value,
            touched: true,
          }
        }
      })
      return {
        ...state,
        fields: updatedFields,
      }

    default:
      return state
  }
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState)

  const setFieldValue = useCallback((fieldId: string, value: string | boolean | string[]) => {
    dispatch({ type: 'SET_FIELD_VALUE', fieldId, value })
  }, [])

  const setFieldError = useCallback((fieldId: string, error: string | undefined) => {
    dispatch({ type: 'SET_FIELD_ERROR', fieldId, error })
  }, [])

  const setFieldTouched = useCallback((fieldId: string) => {
    dispatch({ type: 'SET_FIELD_TOUCHED', fieldId })
  }, [])

  const highlightField = useCallback((fieldId: string) => {
    dispatch({ type: 'HIGHLIGHT_FIELD', fieldId })
    // Scroll to field
    const element = document.getElementById(`field-${fieldId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const clearHighlight = useCallback(() => {
    dispatch({ type: 'CLEAR_HIGHLIGHT' })
  }, [])

  const getFieldValue = useCallback((fieldId: string) => {
    return state.fields[fieldId]?.value ?? ''
  }, [state.fields])

  const getFormData = useCallback(() => {
    const data: Record<string, string | boolean | string[]> = {}
    Object.entries(state.fields).forEach(([key, field]) => {
      data[key] = field.value
    })
    return data
  }, [state.fields])

  const getFormLayout = useCallback(() => {
    return SCHENGEN_FIELDS.map((field) => ({
      id: field.id,
      label: field.label,
      value: state.fields[field.id]?.value ?? '',
      type: field.type,
      section: field.section,
      error: state.fields[field.id]?.error,
      required: field.required,
    }))
  }, [state.fields])

  const setMultipleFields = useCallback((fields: Record<string, string | boolean | string[]>) => {
    dispatch({ type: 'SET_MULTIPLE_FIELDS', fields })
  }, [])

  const getCompletionPercentage = useCallback(() => {
    const requiredFields = SCHENGEN_FIELDS.filter((f) => f.required)
    const filledRequired = requiredFields.filter((f) => {
      const value = state.fields[f.id]?.value
      if (typeof value === 'boolean') return value
      if (Array.isArray(value)) return value.length > 0
      return value && value.trim() !== ''
    })
    return Math.round((filledRequired.length / requiredFields.length) * 100)
  }, [state.fields])

  const value: FormContextValue = {
    state,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    highlightField,
    clearHighlight,
    getFieldValue,
    getFormData,
    getFormLayout,
    setMultipleFields,
    getCompletionPercentage,
  }

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>
}

export function useForm() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useForm must be used within a FormProvider')
  }
  return context
}
