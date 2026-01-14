/**
 * React hook for integrating Chucky form assistant
 *
 * This hook manages the connection to Chucky SDK and provides
 * methods to send messages and receive responses.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChuckyClient, tool, textResult, getAssistantText } from '@chucky.cloud/sdk'
import type { ContentBlock } from '@chucky.cloud/sdk'
import { useForm } from '../context/FormContext'
import { SCHENGEN_FIELDS } from '../types/form'
import type { SDKMessage, SDKAssistantMessage, ToolUseContent } from '@chucky.cloud/sdk'

/**
 * Convert a File to base64 string (without the data URL prefix)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface FileAttachment {
  name: string
  type: string
  base64: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: { name: string; args: unknown }[]
  attachments?: FileAttachment[]
}

interface UseChuckyAssistantOptions {
  token?: string
  sessionId?: string  // For resuming an existing session
  demoMode?: boolean
  onSessionCreated?: (sessionId: string) => void  // Callback when a new session is created
}

// Comprehensive system prompt for Schengen visa expertise
const SYSTEM_PROMPT = `You are a friendly, expert visa concierge helping someone complete their Schengen visa application. Think of yourself as a knowledgeable friend who's done this many times before - warm, efficient, and reassuring.

## Your Personality
- Warm and conversational, like a helpful friend
- Confident but not condescending
- Proactive - you handle details so they don't have to worry
- Brief and natural - no bullet points or formal lists in conversation

## IMPORTANT: Context Awareness
Each message includes "[VISIBLE FIELDS]" showing what the user currently sees on screen.
- ALWAYS prioritize filling fields the user is looking at
- Ask about visible empty fields first before moving to other sections
- If they scroll to a new section, adapt and help with those fields

## Smart Question Grouping
You can ask about 1-2 closely related data points together. Group ONLY if they're naturally connected:

**Good groupings (ask together):**
- "Where and when were you born?" (place_of_birth + date_of_birth)
- "What's your passport number and when does it expire?" (passport_number + passport_expiry_date)
- "When do you arrive and leave?" (arrival_date + departure_date)
- "What's the hotel name and address?" (accommodation_type + accommodation_details)
- "Your email and phone number?" (email + phone)

**Don't group (ask separately):**
- Name + nationality (different contexts)
- Passport + travel dates (different sections)
- Occupation + accommodation (unrelated)

## Flow Strategy
1. Look at [VISIBLE FIELDS] in the context
2. Find empty fields the user can see
3. Ask about those first (grouped if related)
4. After they answer, fill the fields
5. Move to next visible empty fields OR ask them to scroll

## Conversation Flow
Guide them through naturally, like a conversation:
1. Start with basics (name, nationality)
2. Move to passport details
3. Then travel plans (where, when, why)
4. Finally accommodation and finances

## CRITICAL: You MUST Use Tools To Fill Fields
- NEVER claim you filled a field without actually calling react_setField or react_setMultipleFields
- You MUST call the tool FIRST, then tell the user what you filled based on the tool result
- If you see information to fill, IMMEDIATELY call the tool - don't just say "I'll fill that"
- The form will NOT update unless you call the tools

## Your Tools
You can fill forms, search the web, validate entries, and highlight fields. Use them proactively!

## Be Proactive
When they mention something, fill everything you can figure out:
- Hotel name → search for full address/phone/email, fill it all
- Travel dates → calculate duration automatically
- Company name → look up the address
- Nationality → fill the country code

## Document Uploads (IMPORTANT!)
Users can upload images of passports, hotel bookings, flight tickets, invitation letters, etc.

**When you receive an image:**
1. Analyze it carefully to extract ALL relevant information
2. Fill in as many form fields as possible based on what you see
3. Be thorough - look for names, dates, passport numbers, addresses, booking references
4. Tell the user what you found and filled in
5. Ask about any unclear details

**Common document types and what to extract:**
- **Passport**: surname, first_names, date_of_birth, place_of_birth, country_of_birth, sex, passport_number, passport_issue_date, passport_expiry_date, passport_issued_by, current_nationality
- **Hotel Booking**: accommodation_type (hotel), accommodation_details (hotel name + address), host_phone, host_email, arrival_date, departure_date
- **Flight Ticket**: arrival_date, departure_date, first_entry_country (from flight route)
- **Invitation Letter**: host details, purpose_of_journey, accommodation info
- **Employment Letter**: occupation, employer_name, employer_phone

**Example response after receiving a passport image:**
"Great, I found everything! I've filled in your name (JOHN SMITH), birthday (March 15, 1990), birthplace (Mumbai, India), passport number (X12345678), and it's valid until 2030. Your passport looks good - plenty of validity remaining! What's your current address?"

## When Responding
- Keep it short and human - 1-3 sentences usually
- Confirm what you filled in a natural way: "Done! I've added your name and set your nationality to Indian."
- Ask ONE follow-up question to keep things moving
- If you spot a potential issue, mention it casually but clearly

## Schengen Knowledge (use when relevant, don't lecture)
- Passport needs 3+ months validity after departure
- Max 90 days in any 180-day period
- Apply to country where they'll spend most time
- Insurance must cover €30,000 minimum

## Your Tools - Hybrid Approach
You have TWO types of form tools:

### 🌐 Universal DOM Tools (work on ANY website)
- dom_fillField, dom_fillMultipleFields - Fill fields via direct DOM manipulation
- dom_readField - Read current field value
- dom_discoverFields - Discover all form fields on page
- dom_clickElement, dom_scrollTo - Interact with page elements
- dom_queryPage - Query DOM with CSS selectors

### ⚛️ React-Optimized Tools (faster for this app)
- react_getFormLayout - Get structured form with sections/labels
- react_setField, react_setMultipleFields - Set fields via React state
- react_getProgress - Get completion percentage
- react_highlightField - Highlight with app's native effect
- react_validateField - Validate against Schengen rules

**Use react_* tools when possible** (they're faster and update state properly). Fall back to dom_* tools if something doesn't work or if you need to interact with elements outside the form.

### 👁️ Visibility Tool
- react_getFieldsInView - See which fields are currently visible on screen (use this to know what the user is looking at!)

## Form Field IDs & Values

### Select Fields (use EXACT values shown)
**country_of_birth / current_nationality** - Use 2-letter codes:
IN=India, US=United States, GB=United Kingdom, CN=China, CA=Canada, AU=Australia, DE=Germany, FR=France, JP=Japan, BR=Brazil, MX=Mexico, RU=Russia, etc.

**destination_country / first_entry_country** (Schengen only):
AT=Austria, BE=Belgium, HR=Croatia, CZ=Czech Republic, DK=Denmark, EE=Estonia, FI=Finland, FR=France, DE=Germany, GR=Greece, HU=Hungary, IS=Iceland, IT=Italy, LV=Latvia, LT=Lithuania, LU=Luxembourg, MT=Malta, NL=Netherlands, NO=Norway, PL=Poland, PT=Portugal, SK=Slovakia, SI=Slovenia, ES=Spain, SE=Sweden, CH=Switzerland

**sex**: male, female
**civil_status**: single, married, separated, divorced, widowed
**travel_document_type**: ordinary, diplomatic, service, official
**purpose_of_journey**: tourism, business, visiting_family, cultural, sports, medical, study, transit
**entries_requested**: single, double, multiple
**accommodation_type**: hotel, rented, host, other
**travel_costs_by**: self, sponsor
**means_of_support**: cash, credit_card, travellers_cheques, prepaid
**previous_schengen_visas / fingerprints_collected**: yes, no

### Text Fields
Personal: surname, surname_at_birth, first_names, place_of_birth, national_id_number
Passport: passport_number, passport_issued_by
Contact: home_address, email, phone
Work: occupation, employer_name, employer_phone
Travel: duration_of_stay (number)
History: previous_visa_dates
Stay: accommodation_details, host_phone, host_email

### Date Fields (YYYY-MM-DD format)
date_of_birth, passport_issue_date, passport_expiry_date, arrival_date, departure_date

## Example Interactions

User: "Hi, I need help with my visa"
[VISIBLE FIELDS: personal section, surname/first_names/date_of_birth/place_of_birth empty]
You: "Happy to help! I can see you're on the personal details section. What's your full name as it appears on your passport?"

User: "John Smith"
[VISIBLE FIELDS: personal section, date_of_birth/place_of_birth/country_of_birth empty]
You: [fill surname=SMITH, first_names=JOHN] "Got it, John! Where and when were you born?" (asking both since they're related and visible)

User: "Mumbai, March 15 1990"
[VISIBLE FIELDS: personal section, country_of_birth/current_nationality empty]
You: [fill place_of_birth=Mumbai, date_of_birth=1990-03-15, country_of_birth=IN] "Done! Since you were born in Mumbai, I've set India as your birth country. Is Indian also your current nationality?"

User: "Yes"
[VISIBLE FIELDS: personal section, sex/civil_status empty]
You: [fill current_nationality=IN] "Perfect! Are you male or female, and what's your marital status?"

User: "Male, single"
[VISIBLE FIELDS: travel_document section - they scrolled]
You: [fill sex=male, civil_status=single] "Great! I see you've scrolled to the passport section. What's your passport number and expiry date?"`

// Demo responses for when no token is provided
const DEMO_RESPONSES: Record<string, string> = {
  default: `Hey there! I'm here to help you breeze through this visa application.

I can see you're starting with the personal details - let's begin! What's your full name as it appears on your passport?`,

  surname: `**Field 1: Surname (Family name)**

Enter your surname exactly as it appears in your passport. Key points:

- Use CAPITAL LETTERS
- Include all parts if you have multiple surnames
- Must match passport EXACTLY — even small differences cause rejections
- Do NOT include titles (Mr., Mrs., Dr., etc.)

**Pro tip**: Double-check the spelling against your passport right now!

Would you like me to fill this field for you? Just tell me your surname.`,

  passport: `**Fields 12-16: Travel Document (Passport)**

Your passport details are CRITICAL. Here's what you need:

**Field 12 - Type**: Usually "Ordinary passport"
**Field 13 - Number**: Enter exactly as shown (include letters)
**Field 14 - Issue date**: When your passport was issued
**Field 15 - Valid until**: MUST be valid for 3+ months AFTER your departure!
**Field 16 - Issued by**: The authority that issued it

**Common rejection reason**: Passport expires too soon. If you're leaving the Schengen area on March 15, your passport must be valid until at least June 15.

Would you like me to check if your passport dates are valid?`,

  destination: `**Field 24: Member State of Destination**

This determines which country's consulate processes your application!

**The Rule**: Select the country where you'll spend the MOST TIME.

**Example**:
- 3 days in Paris, France
- 5 days in Rome, Italy
- 2 days in Barcelona, Spain
→ **Select: Italy** (longest stay)

If you're visiting multiple countries for equal time, select the one you'll enter first.

Which countries are you planning to visit? I'll help you pick the right one.`,

  duration: `**Field 27: Duration of Stay**

**The 90/180 Rule**: You can stay maximum 90 days within any 180-day period.

This is cumulative across ALL Schengen countries — they share the limit!

**Example**:
- January: 30 days in Germany
- March: 20 days in France
- May: 40 days in Italy
→ **Total: 90 days** (exactly at limit)

I can calculate this for you. What are your planned arrival and departure dates?`,

  mistakes: `**Top 5 Mistakes That Get Applications Rejected**

**1. Passport expires too soon**
→ Must be valid 3+ months after your departure date

**2. Inconsistent information**
→ Dates, names, and addresses must match across ALL documents

**3. Wrong destination country**
→ Should be where you'll spend the MOST time, not first entry

**4. Leaving fields blank**
→ Write "N/A" or "Not Applicable" if a field doesn't apply

**5. Duration exceeds 90 days**
→ Maximum stay is 90 days per 180-day period

Want me to scan your form for any of these issues?`,
}

// Helper to generate human-readable activity descriptions from tool calls
// Only returns activity for web tools - form tools work silently
function getActivityDescription(toolName: string, args: unknown): string | null {
  const toolArgs = args as Record<string, unknown>

  // Web search tools - these are interesting to show users
  if (toolName.includes('WebSearch') || toolName.includes('web_search') || toolName === 'WebSearch') {
    const query = toolArgs.query as string
    return `Searching the web${query ? `: "${query.slice(0, 40)}${query.length > 40 ? '...' : ''}"` : '...'}`
  }
  if (toolName.includes('WebFetch') || toolName.includes('web_fetch') || toolName === 'WebFetch') {
    const url = toolArgs.url as string
    if (url) {
      try {
        const hostname = new URL(url).hostname
        return `Fetching info from ${hostname}...`
      } catch {
        return 'Fetching web page...'
      }
    }
    return 'Fetching web page...'
  }

  // Form tools work silently - return null
  return null
}

export function useChuckyAssistant(options: UseChuckyAssistantOptions = {}) {
  const { token, sessionId, demoMode = !token, onSessionCreated } = options
  const form = useForm()

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentActivity, setCurrentActivity] = useState<string | null>(null)
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)

  const messageIdRef = useRef(0)
  const sessionRef = useRef<Awaited<ReturnType<ChuckyClient['createSession']>> | null>(null)
  const clientRef = useRef<ChuckyClient | null>(null)

  // Use a ref to always access the latest form methods
  // This is critical because tools are created once but need to access current form state
  const formRef = useRef(form)
  formRef.current = form  // Always update to latest

  // Helper to get visible fields context for each message
  const getVisibleFieldsContext = useCallback(() => {
    const fields = form.getFormLayout()
    const viewportHeight = window.innerHeight

    const visibleFields: { id: string; label: string; value: string; isEmpty: boolean }[] = []

    for (const field of fields) {
      const element = document.getElementById(`field-${field.id}`) ||
                     document.getElementById(field.id) ||
                     document.querySelector(`[name="${field.id}"]`)

      if (element) {
        const rect = element.getBoundingClientRect()
        const isVisible = rect.top < viewportHeight && rect.bottom > 0

        if (isVisible) {
          const isEmpty = !field.value || field.value === ''
          visibleFields.push({
            id: field.id,
            label: field.label,
            value: isEmpty ? '(empty)' : String(field.value),
            isEmpty,
          })
        }
      }
    }

    const emptyVisible = visibleFields.filter(f => f.isEmpty)
    const filledVisible = visibleFields.filter(f => !f.isEmpty)
    const sections = [...new Set(fields.filter(f =>
      visibleFields.some(v => v.id === f.id)
    ).map(f => f.section))]

    return {
      summary: `User is viewing: ${sections.join(', ')} section(s). ${emptyVisible.length} empty fields visible, ${filledVisible.length} filled.`,
      emptyFields: emptyVisible.map(f => `${f.id}: "${f.label}"`).join(', '),
      filledFields: filledVisible.map(f => `${f.id}=${f.value}`).join(', '),
    }
  }, [form])

  // Create comprehensive form tools - HYBRID APPROACH
  // Some tools use direct DOM manipulation (universal, works on any website)
  // Some tools use React context (optimized for this app)
  const createFormTools = useCallback(() => {
    // React context reference for optimized tools
    const getForm = () => formRef.current

    // ============================================================
    // DOM HELPER FUNCTIONS (Universal - works on any website)
    // ============================================================

    // Find input element by various selectors
    const findInputElement = (fieldId: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null => {
      return (
        document.getElementById(fieldId) as HTMLInputElement ||
        document.querySelector(`[name="${fieldId}"]`) as HTMLInputElement ||
        document.querySelector(`[data-field-id="${fieldId}"]`) as HTMLInputElement ||
        document.querySelector(`#field-${fieldId} input, #field-${fieldId} select, #field-${fieldId} textarea`) as HTMLInputElement
      )
    }

    // Set value via DOM and trigger React-compatible events
    const setInputValueDOM = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) => {
      // For React compatibility, we need to use the native setter and dispatch events
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype :
        element.tagName === 'SELECT' ? HTMLSelectElement.prototype :
        HTMLInputElement.prototype,
        'value'
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value)
      } else {
        element.value = value
      }

      // Dispatch events to trigger React's onChange
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      element.dispatchEvent(new Event('blur', { bubbles: true }))
    }

    // Visual highlight effect (pure DOM)
    const highlightElementDOM = (element: HTMLElement, duration = 3000) => {
      const originalOutline = element.style.outline
      const originalBoxShadow = element.style.boxShadow
      element.style.outline = '2px solid #3b82f6'
      element.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)'
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      setTimeout(() => {
        element.style.outline = originalOutline
        element.style.boxShadow = originalBoxShadow
      }, duration)
    }

    // Discover all form fields on page (pure DOM)
    const discoverFormFieldsDOM = () => {
      const inputs = document.querySelectorAll('input, select, textarea')
      return Array.from(inputs).map((el) => {
        const input = el as HTMLInputElement
        const label = document.querySelector(`label[for="${input.id}"]`)?.textContent ||
                     input.closest('label')?.textContent?.trim() ||
                     input.placeholder ||
                     input.name ||
                     input.id
        return {
          id: input.id || input.name,
          name: input.name,
          type: input.type || el.tagName.toLowerCase(),
          value: input.value,
          label: label?.slice(0, 50),
          required: input.required,
        }
      }).filter(f => f.id || f.name)
    }

    return [
      // ============================================================
      // 🌐 UNIVERSAL DOM TOOLS (Work on ANY website)
      // ============================================================

      tool(
        'dom_fillField',
        '[Universal] Fill any form field by ID/name using direct DOM manipulation. Works on any website.',
        {
          type: 'object',
          properties: {
            fieldId: { type: 'string', description: 'Field ID or name attribute' },
            value: { type: 'string', description: 'Value to enter' },
          },
          required: ['fieldId', 'value'],
        },
        async (input) => {
          const { fieldId, value } = input as { fieldId: string; value: string }
          const element = findInputElement(fieldId)

          if (!element) {
            return textResult(JSON.stringify({
              success: false,
              method: 'DOM',
              error: `Element "${fieldId}" not found. Try dom_discoverFields to see available fields.`,
            }))
          }

          setInputValueDOM(element, value)
          highlightElementDOM(element)

          return textResult(JSON.stringify({
            success: true,
            method: 'DOM',
            fieldId,
            newValue: value,
            elementType: element.tagName.toLowerCase(),
          }))
        }
      ),

      tool(
        'dom_fillMultipleFields',
        '[Universal] Fill multiple form fields at once using DOM manipulation. Works on any website.',
        {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              description: 'Array of {fieldId, value} objects',
              items: {
                type: 'object',
                properties: {
                  fieldId: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['fieldId', 'value'],
              },
            },
          },
          required: ['fields'],
        },
        async (input) => {
          const { fields: updates } = input as { fields: { fieldId: string; value: string }[] }
          const results: { fieldId: string; success: boolean; error?: string }[] = []

          for (const { fieldId, value } of updates) {
            const element = findInputElement(fieldId)
            if (element) {
              setInputValueDOM(element, value)
              results.push({ fieldId, success: true })
            } else {
              results.push({ fieldId, success: false, error: 'Element not found' })
            }
          }

          // Highlight first success
          const firstSuccess = results.find(r => r.success)
          if (firstSuccess) {
            const el = findInputElement(firstSuccess.fieldId)
            if (el) highlightElementDOM(el)
          }

          return textResult(JSON.stringify({
            method: 'DOM',
            totalUpdates: updates.length,
            successCount: results.filter(r => r.success).length,
            results,
          }, null, 2))
        }
      ),

      tool(
        'dom_readField',
        '[Universal] Read the current value of any form field using DOM.',
        {
          type: 'object',
          properties: {
            fieldId: { type: 'string', description: 'Field ID or name' },
          },
          required: ['fieldId'],
        },
        async (input) => {
          const { fieldId } = input as { fieldId: string }
          const element = findInputElement(fieldId)

          if (!element) {
            return textResult(JSON.stringify({
              success: false,
              method: 'DOM',
              error: `Element "${fieldId}" not found`,
            }))
          }

          return textResult(JSON.stringify({
            success: true,
            method: 'DOM',
            fieldId,
            value: element.value || '(empty)',
            type: element.type || element.tagName.toLowerCase(),
            required: element.required,
          }))
        }
      ),

      tool(
        'dom_discoverFields',
        '[Universal] Discover all form fields on the page using DOM queries. Great for exploring unknown forms.',
        { type: 'object', properties: {} },
        async () => {
          const fields = discoverFormFieldsDOM()
          const filled = fields.filter(f => f.value && f.value.trim() !== '')
          const empty = fields.filter(f => !f.value || f.value.trim() === '')

          return textResult(JSON.stringify({
            method: 'DOM',
            totalFields: fields.length,
            filledCount: filled.length,
            emptyCount: empty.length,
            fields: fields.slice(0, 50), // Limit to 50 fields
          }, null, 2))
        }
      ),

      tool(
        'dom_clickElement',
        '[Universal] Click any element on the page by selector.',
        {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for element to click' },
          },
          required: ['selector'],
        },
        async (input) => {
          const { selector } = input as { selector: string }
          const element = document.querySelector(selector) as HTMLElement

          if (!element) {
            return textResult(JSON.stringify({
              success: false,
              method: 'DOM',
              error: `Element "${selector}" not found`,
            }))
          }

          element.click()
          return textResult(JSON.stringify({
            success: true,
            method: 'DOM',
            selector,
            clicked: true,
          }))
        }
      ),

      tool(
        'dom_scrollTo',
        '[Universal] Scroll to any element on the page.',
        {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for element to scroll to' },
          },
          required: ['selector'],
        },
        async (input) => {
          const { selector } = input as { selector: string }
          const element = document.querySelector(selector) as HTMLElement

          if (!element) {
            return textResult(JSON.stringify({
              success: false,
              method: 'DOM',
              error: `Element "${selector}" not found`,
            }))
          }

          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          highlightElementDOM(element)

          return textResult(JSON.stringify({
            success: true,
            method: 'DOM',
            selector,
            scrolled: true,
          }))
        }
      ),

      tool(
        'dom_queryPage',
        '[Universal] Query page elements using CSS selector. Returns info about matching elements.',
        {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector' },
            limit: { type: 'number', description: 'Max results (default: 10)' },
          },
          required: ['selector'],
        },
        async (input) => {
          const { selector, limit = 10 } = input as { selector: string; limit?: number }
          try {
            const elements = document.querySelectorAll(selector)
            const results = Array.from(elements).slice(0, limit).map((el) => {
              const htmlEl = el as HTMLElement
              return {
                tagName: el.tagName,
                id: el.id || null,
                className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 100) : null,
                text: htmlEl.textContent?.slice(0, 100)?.trim() || null,
                value: (el as HTMLInputElement).value || null,
              }
            })

            return textResult(JSON.stringify({
              method: 'DOM',
              selector,
              matchCount: elements.length,
              results,
            }, null, 2))
          } catch (err) {
            return textResult(JSON.stringify({ error: `Invalid selector: ${(err as Error).message}` }))
          }
        }
      ),

      // ============================================================
      // ⚛️ REACT-OPTIMIZED TOOLS (Faster, integrated with app state)
      // ============================================================

      tool(
        'react_getFormLayout',
        '[React-Optimized] Get structured form layout with sections, labels, validation state, and options for select fields.',
        {
          type: 'object',
          properties: {
            section: { type: 'string', description: 'Optional: filter by section name' },
            includeOptions: { type: 'boolean', description: 'Include select/radio options (default: true)' },
          },
        },
        async (input) => {
          const { section, includeOptions = true } = input as { section?: string; includeOptions?: boolean }
          let fields = getForm().getFormLayout()
          if (section) {
            fields = fields.filter((f) => f.section.toLowerCase().includes(section.toLowerCase()))
          }

          // Get field definitions to include options for select/radio fields
          const fieldDefs = SCHENGEN_FIELDS.reduce((acc, f) => {
            acc[f.id] = f
            return acc
          }, {} as Record<string, typeof SCHENGEN_FIELDS[0]>)

          return textResult(JSON.stringify({
            method: 'React',
            totalFields: fields.length,
            completionPercentage: getForm().getCompletionPercentage(),
            sections: [...new Set(fields.map(f => f.section))],
            fields: fields.map((f) => {
              const def = fieldDefs[f.id]
              const result: Record<string, unknown> = {
                id: f.id,
                label: f.label,
                type: f.type,
                section: f.section,
                currentValue: f.value || '(empty)',
                required: f.required,
                error: f.error,
              }
              // Include options for select/radio fields so AI knows valid values
              if (includeOptions && def?.options && (f.type === 'select' || f.type === 'radio')) {
                result.validValues = def.options
                  .filter(o => o.value) // Skip empty placeholder options
                  .map(o => ({ value: o.value, label: o.label }))
              }
              return result
            }),
          }, null, 2))
        }
      ),

      tool(
        'react_setField',
        '[React-Optimized] Set field value through React state. Faster and more reliable for this app.',
        {
          type: 'object',
          properties: {
            fieldId: { type: 'string', description: 'The field ID' },
            value: { type: 'string', description: 'Value to set' },
          },
          required: ['fieldId', 'value'],
        },
        async (input) => {
          const { fieldId, value } = input as { fieldId: string; value: string }
          const fields = getForm().getFormLayout()
          const field = fields.find(f => f.id === fieldId)

          if (!field) {
            return textResult(JSON.stringify({
              success: false,
              method: 'React',
              error: `Field "${fieldId}" not found in form schema`,
            }))
          }

          getForm().setFieldValue(fieldId, value)
          getForm().highlightField(fieldId)
          setTimeout(() => getForm().clearHighlight(), 3000)

          return textResult(JSON.stringify({
            success: true,
            method: 'React',
            fieldId,
            fieldLabel: field.label,
            newValue: value,
            section: field.section,
          }))
        }
      ),

      tool(
        'react_setMultipleFields',
        '[React-Optimized] Set multiple fields at once through React state. Most efficient for bulk updates.',
        {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fieldId: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['fieldId', 'value'],
              },
            },
          },
          required: ['fields'],
        },
        async (input) => {
          const { fields: updates } = input as { fields: { fieldId: string; value: string }[] }
          const formFields = getForm().getFormLayout()
          const results: { fieldId: string; success: boolean; label?: string; error?: string }[] = []

          const validUpdates: Record<string, string> = {}
          for (const update of updates) {
            const field = formFields.find(f => f.id === update.fieldId)
            if (field) {
              validUpdates[update.fieldId] = update.value
              results.push({ fieldId: update.fieldId, success: true, label: field.label })
            } else {
              results.push({ fieldId: update.fieldId, success: false, error: 'Field not in schema' })
            }
          }

          // Batch update through React context
          getForm().setMultipleFields(validUpdates)

          // Highlight first success
          const firstSuccess = results.find(r => r.success)
          if (firstSuccess) {
            getForm().highlightField(firstSuccess.fieldId)
            setTimeout(() => getForm().clearHighlight(), 3000)
          }

          return textResult(JSON.stringify({
            method: 'React',
            totalUpdates: updates.length,
            successCount: results.filter(r => r.success).length,
            results,
          }, null, 2))
        }
      ),

      tool(
        'react_getProgress',
        '[React-Optimized] Get form completion progress with empty field breakdown.',
        { type: 'object', properties: {} },
        async () => {
          const completion = getForm().getCompletionPercentage()
          const fields = getForm().getFormLayout()
          const emptyRequired = fields.filter((f) => f.required && (!f.value || f.value === ''))

          return textResult(JSON.stringify({
            method: 'React',
            completionPercentage: completion,
            totalFields: fields.length,
            emptyRequiredFields: emptyRequired.map(f => ({ id: f.id, label: f.label, section: f.section })),
          }, null, 2))
        }
      ),

      tool(
        'react_highlightField',
        '[React-Optimized] Highlight a field with the app\'s native highlight effect.',
        {
          type: 'object',
          properties: {
            fieldId: { type: 'string', description: 'Field to highlight' },
            duration: { type: 'number', description: 'Duration in ms (default: 5000)' },
          },
          required: ['fieldId'],
        },
        async (input) => {
          const { fieldId, duration = 5000 } = input as { fieldId: string; duration?: number }
          getForm().highlightField(fieldId)
          setTimeout(() => getForm().clearHighlight(), duration)
          return textResult(JSON.stringify({ success: true, method: 'React', fieldId, duration }))
        }
      ),

      tool(
        'react_validateField',
        '[React-Optimized] Validate a field against Schengen rules and update error state.',
        {
          type: 'object',
          properties: {
            fieldId: { type: 'string', description: 'Field to validate' },
          },
          required: ['fieldId'],
        },
        async (input) => {
          const { fieldId } = input as { fieldId: string }
          const value = getForm().getFieldValue(fieldId)
          const errors: string[] = []

          if (!value || value === '') {
            errors.push('Field is empty')
          }

          // Passport expiry check
          if (fieldId === 'passport_expiry_date' && value) {
            const expiryDate = new Date(value as string)
            const threeMonthsFromNow = new Date()
            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
            if (expiryDate < threeMonthsFromNow) {
              errors.push('Passport needs 3+ months validity after departure')
            }
          }

          if (fieldId === 'duration_of_stay' && value) {
            const days = parseInt(value as string, 10)
            if (days > 90) errors.push('Exceeds 90-day Schengen limit')
          }

          if (fieldId === 'departure_date' && value) {
            const arrival = getForm().getFieldValue('arrival_date')
            if (arrival && new Date(value as string) < new Date(arrival as string)) {
              errors.push('Departure cannot be before arrival')
            }
          }

          const errorMsg = errors.length > 0 ? errors.join('. ') : undefined
          getForm().setFieldError(fieldId, errorMsg)

          return textResult(JSON.stringify({
            method: 'React',
            fieldId,
            value,
            isValid: errors.length === 0,
            errors,
          }))
        }
      ),

      tool(
        'react_getFieldsInView',
        '[React-Optimized] Get fields currently visible in the viewport. Helps understand what the user is looking at.',
        { type: 'object', properties: {} },
        async () => {
          const fields = getForm().getFormLayout()
          const viewportHeight = window.innerHeight
          const scrollY = window.scrollY

          const fieldsInView: { id: string; label: string; value: string | boolean | string[]; section: string; isVisible: boolean }[] = []

          for (const field of fields) {
            // Try to find the field element
            const element = document.getElementById(`field-${field.id}`) ||
                           document.getElementById(field.id) ||
                           document.querySelector(`[name="${field.id}"]`)

            if (element) {
              const rect = element.getBoundingClientRect()
              // Check if element is in viewport (with some margin)
              const isVisible = rect.top < viewportHeight && rect.bottom > 0

              if (isVisible) {
                fieldsInView.push({
                  id: field.id,
                  label: field.label,
                  value: field.value || '(empty)',
                  section: field.section,
                  isVisible: true,
                })
              }
            }
          }

          // Also get the current section based on scroll position
          const sections = [...new Set(fieldsInView.map(f => f.section))]

          return textResult(JSON.stringify({
            method: 'React',
            visibleFieldCount: fieldsInView.length,
            currentSections: sections,
            scrollPosition: scrollY,
            fieldsInView: fieldsInView,
          }, null, 2))
        }
      ),

      // ============================================================
      // 🔧 UTILITY TOOLS (Framework-agnostic)
      // ============================================================

      tool(
        'calculateDuration',
        'Calculate days between two dates.',
        {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate'],
        },
        async (input) => {
          const { startDate, endDate } = input as { startDate: string; endDate: string }
          const start = new Date(startDate)
          const end = new Date(endDate)

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return textResult(JSON.stringify({ error: 'Invalid date format' }))
          }

          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          return textResult(JSON.stringify({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            days,
            exceedsSchengenLimit: days > 90,
          }))
        }
      ),

      tool(
        'getCurrentDate',
        'Get current date and time.',
        { type: 'object', properties: {} },
        async () => {
          const now = new Date()
          return textResult(JSON.stringify({
            iso: now.toISOString(),
            date: now.toISOString().split('T')[0],
            formatted: now.toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            }),
          }))
        }
      ),

      tool(
        'getPageInfo',
        'Get general page information.',
        { type: 'object', properties: {} },
        async () => {
          return textResult(JSON.stringify({
            url: window.location.href,
            title: document.title,
            scrollY: window.scrollY,
            viewportHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight,
          }))
        }
      ),

    ]
  }, []) // Empty deps - tools access form via ref

  // Initialize Chucky session
  useEffect(() => {
    if (demoMode || !token) {
      setIsConnected(true)
      setMessages([
        {
          id: `msg-${messageIdRef.current++}`,
          role: 'assistant',
          content: DEMO_RESPONSES.default,
          timestamp: new Date(),
        },
      ])
      return
    }

    // Real Chucky connection
    const initSession = async () => {
      try {
        const client = new ChuckyClient({ token })
        clientRef.current = client

        // Session options - include sessionId if resuming
        const sessionOptions = {
          model: 'claude-sonnet-4-5-20250929',
          systemPrompt: SYSTEM_PROMPT,
          // Allow all tools including built-in web search
          allowedTools: ['*'],
          // Bypass all permission checks for seamless operation
          permissionMode: 'bypassPermissions' as const,
          allowDangerouslySkipPermissions: true,
          mcpServers: [
            {
              name: 'schengen-form-tools',
              version: '1.0.0',
              tools: createFormTools(),
            },
          ],
          maxTurns: 25,
          // Include sessionId and resume if resuming an existing session
          ...(sessionId && { sessionId, resume: sessionId }),
        }

        // Debug: log if we're resuming
        if (sessionId) {
          console.log('[Chucky] Creating session with sessionId for resume:', sessionId)
          console.log('[Chucky] Full session options:', JSON.stringify({ ...sessionOptions, systemPrompt: '(truncated)', mcpServers: '(truncated)' }))
        }

        const session = sessionId ? await client.resumeSession(sessionId, sessionOptions) : await client.createSession(sessionOptions)

        // Listen for session info from the backend (comes after first message)
        // This is when we get the real session ID from the server
        session.on({
          onSessionInfo: (info) => {
            if (info.sessionId) {
              console.log('[Chucky] Received session ID from backend:', info.sessionId)
              setCreatedSessionId(info.sessionId)

              // If this is a NEW session (not resuming), notify via callback
              if (!sessionId && onSessionCreated) {
                onSessionCreated(info.sessionId)
              }
            }
          },
        })

        sessionRef.current = session
        setIsConnected(true)

        // If resuming, set the session ID immediately (we already know it)
        if (sessionId) {
          setCreatedSessionId(sessionId)
          console.log('[Chucky] Resuming session:', sessionId)
        }

        // Welcome message - different for resumed sessions
        const welcomeMessage = sessionId
          ? 'Welcome back! I remember our conversation. How can I continue helping with your visa application?'
          : DEMO_RESPONSES.default

        setMessages([
          {
            id: `msg-${messageIdRef.current++}`,
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
          },
        ])
      } catch (err) {
        setError(err as Error)
        setIsConnected(false)
      }
    }

    initSession()

    return () => {
      // Cleanup session if needed
      sessionRef.current = null
      clientRef.current = null
    }
  }, [token, sessionId, demoMode, createFormTools, onSessionCreated])

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      // Convert files to base64 if provided
      const attachments: FileAttachment[] = []
      if (files && files.length > 0) {
        for (const file of files) {
          const base64 = await fileToBase64(file)
          attachments.push({
            name: file.name,
            type: file.type,
            base64,
          })
        }
      }

      // Add user message
      const userMessage: Message = {
        id: `msg-${messageIdRef.current++}`,
        role: 'user',
        content,
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        if (demoMode || !sessionRef.current) {
          // Demo mode: simulate response
          await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200))

          const lowerContent = content.toLowerCase()
          let response = ''

          if (lowerContent.includes('surname') || lowerContent.includes('name') || lowerContent.includes('field 1')) {
            response = DEMO_RESPONSES.surname
          } else if (
            lowerContent.includes('passport') ||
            lowerContent.includes('travel document') ||
            lowerContent.includes('field 12')
          ) {
            response = DEMO_RESPONSES.passport
          } else if (
            lowerContent.includes('destination') ||
            lowerContent.includes('which country') ||
            lowerContent.includes('field 24')
          ) {
            response = DEMO_RESPONSES.destination
          } else if (
            lowerContent.includes('duration') ||
            lowerContent.includes('how long') ||
            lowerContent.includes('90 days') ||
            lowerContent.includes('field 27')
          ) {
            response = DEMO_RESPONSES.duration
          } else if (
            lowerContent.includes('mistake') ||
            lowerContent.includes('reject') ||
            lowerContent.includes('error') ||
            lowerContent.includes('wrong')
          ) {
            response = DEMO_RESPONSES.mistakes
          } else if (lowerContent.includes('my name is') || lowerContent.includes("i'm ")) {
            // Extract name and fill
            const nameMatch = content.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+)\s*([A-Za-z]*)/i)
            if (nameMatch) {
              const firstName = nameMatch[1].toUpperCase()
              const lastName = nameMatch[2]?.toUpperCase() || ''

              form.setFieldValue('first_names', firstName)
              if (lastName) {
                form.setFieldValue('surname', lastName)
              }
              form.highlightField('first_names')
              setTimeout(() => {
                if (lastName) form.highlightField('surname')
                setTimeout(() => form.clearHighlight(), 2000)
              }, 2000)

              response = `Great to meet you, **${firstName}**!

I've filled in your name fields:
- First name: ${firstName}
${lastName ? `- Surname: ${lastName}` : '- Surname: (please provide your surname)'}

I've highlighted the fields so you can check they're correct. Remember, these must match your passport exactly!

What else can I help you with?`
            } else {
              response = DEMO_RESPONSES.default
            }
          } else {
            response = `I understand you're asking about "${content}".

I'm your Schengen visa application assistant. I can help you with:

**Understanding fields** — "What is field 24?" or "Explain destination country"
**Filling information** — "My name is John Smith" or "Fill surname: Smith"
**Catching errors** — "Check my passport dates" or "Common mistakes"
**Navigation** — "Go to travel details" or "Show accommodation section"

What specific help do you need?`
          }

          const assistantMessage: Message = {
            id: `msg-${messageIdRef.current++}`,
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        } else {
          // Real Chucky SDK - send message then stream response
          let fullResponse = ''
          const toolCalls: { name: string; args: unknown }[] = []
          const streamingMsgId = `streaming-${messageIdRef.current}`

          // Get visible fields context to include with the message
          const visibleContext = getVisibleFieldsContext()
          const contextualMessage = `${content}

[VISIBLE FIELDS]
${visibleContext.summary}
Empty: ${visibleContext.emptyFields || 'none'}
Filled: ${visibleContext.filledFields || 'none'}`

          // Build message content - text only or multimodal with images/documents
          if (attachments.length > 0) {
            // Build content array - use 'unknown' to allow document type not in SDK types yet
            const contentBlocks: unknown[] = []

            // Add text content first
            contentBlocks.push({
              type: 'text',
              text: contextualMessage,
            })

            // Add attachments (images and documents)
            for (const attachment of attachments) {
              if (attachment.type.startsWith('image/')) {
                // Image content block
                contentBlocks.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: attachment.type,
                    data: attachment.base64,
                  },
                })
              } else if (attachment.type === 'application/pdf') {
                // Document content block (PDF) - not in SDK types yet but API supports it
                contentBlocks.push({
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: attachment.base64,
                  },
                })
              }
            }

            // Send multimodal message (cast to ContentBlock[] for SDK)
            await sessionRef.current.send(contentBlocks as ContentBlock[])
          } else {
            // Send text-only message
            await sessionRef.current.send(contextualMessage)
          }

          // Stream the response - consume fully until result
          const streamGenerator = sessionRef.current.stream()
          try {
            for await (const msg of streamGenerator) {
              if (msg.type === 'assistant') {
                // Extract text from assistant message
                const text = getAssistantText(msg as SDKMessage)
                if (text) {
                  fullResponse = text
                  // Update message in real-time
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === streamingMsgId)
                    if (existing) {
                      return prev.map((m) =>
                        m.id === streamingMsgId
                          ? { ...m, content: fullResponse }
                          : m
                      )
                    } else {
                      return [
                        ...prev,
                        {
                          id: streamingMsgId,
                          role: 'assistant' as const,
                          content: fullResponse,
                          timestamp: new Date(),
                        },
                      ]
                    }
                  })
                }

                // Extract tool calls from assistant message
                const assistantMsg = msg as SDKAssistantMessage
                const toolUses = assistantMsg.message.content.filter(
                  (block): block is ToolUseContent => block.type === 'tool_use'
                )
                for (const toolUse of toolUses) {
                  toolCalls.push({ name: toolUse.name, args: toolUse.input })
                  // Update activity indicator for web tools only
                  const activity = getActivityDescription(toolUse.name, toolUse.input)
                  if (activity) {
                    setCurrentActivity(activity)
                  }
                }
              } else if (msg.type === 'result') {
                // Conversation turn complete - the generator sets state to 'ready' internally
                // Don't break - let the generator complete naturally
              }
            }
          } finally {
            // Ensure generator is properly closed
            await streamGenerator.return?.(undefined)
          }

          // Finalize the message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? {
                    ...m,
                    id: `msg-${messageIdRef.current++}`,
                    content: fullResponse,
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                  }
                : m
            )
          )
        }
      } catch (err) {
        setError(err as Error)
        const errorMessage: Message = {
          id: `msg-${messageIdRef.current++}`,
          role: 'system',
          content: `Sorry, I encountered an error: ${(err as Error).message}. Please try again.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
        setCurrentActivity(null)
      }
    },
    [demoMode, form, getVisibleFieldsContext]
  )

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: `msg-${messageIdRef.current++}`,
        role: 'assistant',
        content: DEMO_RESPONSES.default,
        timestamp: new Date(),
      },
    ])
  }, [])

  return {
    messages,
    isLoading,
    isConnected,
    error,
    currentActivity,
    sessionId: createdSessionId,
    sendMessage,
    clearMessages,
  }
}
