import { FormField as FormFieldType } from '../types/form'
import { useForm } from '../context/FormContext'

interface Props {
  field: FormFieldType
}

export function FormField({ field }: Props) {
  const { state, setFieldValue, setFieldTouched } = useForm()
  const fieldState = state.fields[field.id]
  const value = fieldState?.value ?? ''
  const isHighlighted = fieldState?.highlighted ?? false
  const error = fieldState?.error

  const baseInputClass = `form-input ${isHighlighted ? 'highlighted' : ''} ${error ? 'error' : ''}`

  const handleChange = (newValue: string | boolean) => {
    setFieldValue(field.id, newValue)
  }

  const handleBlur = () => {
    setFieldTouched(field.id)
  }

  // Determine if field should span full width
  const isFullWidth = field.type === 'textarea' || field.id === 'home_address' || field.id === 'employer_name' || field.id === 'accommodation_details'

  return (
    <div
      id={`field-${field.id}`}
      className={`form-field ${isFullWidth ? 'md:col-span-2' : ''}`}
    >
      <label className={`form-label ${field.required ? 'required' : ''}`}>
        <span className="form-label-number">{field.number}</span>
        {field.label}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          className={baseInputClass}
          value={value as string}
          onChange={(e) => handleChange(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          className={baseInputClass}
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'tel' && (
        <input
          type="tel"
          className={baseInputClass}
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          className={baseInputClass}
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
      )}

      {field.type === 'select' && (
        <select
          className={`form-select ${isHighlighted ? 'highlighted' : ''} ${error ? 'error' : ''}`}
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="flex flex-wrap gap-4 mt-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => handleChange(e.target.value)}
                className="form-radio"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'textarea' && (
        <textarea
          className={`${baseInputClass} min-h-[80px]`}
          value={value as string}
          onChange={(e) => handleChange(e.target.value.toUpperCase())}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          rows={3}
        />
      )}

      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id={field.id}
            checked={value as boolean}
            onChange={(e) => handleChange(e.target.checked)}
            className="form-checkbox"
          />
          <label htmlFor={field.id} className="text-sm text-gray-700">
            {field.placeholder || 'Yes'}
          </label>
        </div>
      )}

      {field.help && (
        <p className="form-help">{field.help}</p>
      )}

      {error && (
        <p className="form-error-text">{error}</p>
      )}
    </div>
  )
}
