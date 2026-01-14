import { SCHENGEN_FIELDS, FORM_SECTIONS } from '../types/form'
import { useForm } from '../context/FormContext'
import { FormField } from './FormField'

export function SchengenForm() {
  const { getCompletionPercentage } = useForm()
  const completion = getCompletionPercentage()

  return (
    <div className="space-y-6">
      {/* Demo warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-semibold text-orange-800">This is a demo — Do not enter real personal data</h3>
            <p className="text-sm text-orange-700 mt-1">
              This form demonstrates an AI assistant that can help fill visa applications.
              Use fictional information only. Nothing is submitted or stored.
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Form Completion</span>
          <span className="text-sm font-bold text-eu-blue">{completion}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Complete all required fields (*) before submission
        </p>
      </div>

      {/* Form notice */}
      <div className="bg-blue-50 border-l-4 border-eu-blue p-4 rounded-r">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-eu-blue" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-eu-blue-dark">
              <strong>Need help?</strong> Click the assistant button in the bottom right corner.
              Our AI assistant can explain fields, catch errors, and help you complete this form correctly.
            </p>
          </div>
        </div>
      </div>

      {/* Form sections */}
      {FORM_SECTIONS.map((section) => {
        const sectionFields = SCHENGEN_FIELDS.filter((f) => f.section === section.id)
        if (sectionFields.length === 0) return null

        return (
          <section key={section.id} className="form-section">
            <div className="form-section-header flex items-center gap-2">
              <span className="text-lg">{section.icon}</span>
              <span>{section.title}</span>
            </div>
            <div className="form-section-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionFields.map((field) => (
                  <FormField key={field.id} field={field} />
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* Declaration section */}
      <section className="form-section">
        <div className="form-section-header">
          <span>📝 Declaration and Signature</span>
        </div>
        <div className="form-section-content">
          <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-700 space-y-3">
            <p>
              I am aware that the visa fee is not refunded if the visa is refused.
            </p>
            <p>
              Applicable in case a multiple-entry visa is requested:
              I am aware of the need to have an adequate travel medical insurance for my first stay
              and any subsequent visits to the territory of Member States.
            </p>
            <p>
              I am aware of and consent to the following: the collection of the data required by this
              application form and the taking of my photograph and, if applicable, the taking of
              fingerprints, are mandatory for the examination of the visa application; and any personal
              data concerning me which appear on the visa application form, as well as my fingerprints
              and my photograph will be supplied to the relevant authorities of the Member States and
              processed by those authorities, for the purposes of a decision on my visa application.
            </p>
            <div className="flex items-start gap-3 pt-4 border-t border-gray-300">
              <input type="checkbox" id="declaration" className="form-checkbox mt-1" />
              <label htmlFor="declaration" className="text-gray-800">
                I declare that the information provided in this application is complete and correct to
                the best of my knowledge. I am aware that any false statements may lead to my
                application being rejected or to the annulment of a visa already granted, and may
                also render me liable to prosecution under the law of the Member State which deals
                with the application.
              </label>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <label className="form-label">Place and date</label>
              <input type="text" className="form-input" placeholder="City, DD/MM/YYYY" />
            </div>
            <div>
              <label className="form-label">Signature</label>
              <div className="border-2 border-dashed border-gray-300 rounded h-20 flex items-center justify-center text-gray-400 text-sm">
                Digital signature area
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit button */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          type="button"
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
        >
          Save Draft
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-eu-blue text-white rounded font-medium hover:bg-eu-blue-dark transition-colors flex items-center gap-2"
        >
          <span>Submit Application</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Footer notice */}
      <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-200">
        <p>This is a demonstration form. No actual visa application is being submitted.</p>
        <p className="mt-1">Powered by Chucky AI — Intelligent Form Assistance</p>
      </div>
    </div>
  )
}
