/**
 * Generic form validation composable.
 * Validates on blur and before submit. Errors are keyed by field name.
 */
export interface ValidationRule {
  test: (value: unknown, form: Record<string, unknown>) => boolean
  message: string
}

export function useFormValidation<T extends Record<string, unknown>>(
  rules: Record<string, ValidationRule[]>,
) {
  const errors = reactive<Record<string, string>>({})

  function validateField(field: string, form: T) {
    const fieldRules = rules[field]
    if (!fieldRules) return
    for (const rule of fieldRules) {
      if (!rule.test(form[field], form as Record<string, unknown>)) {
        errors[field] = rule.message
        return
      }
    }
    delete errors[field]
  }

  function validateAll(form: T): boolean {
    let valid = true
    for (const field of Object.keys(rules)) {
      const fieldRules = rules[field]!
      let fieldValid = true
      for (const rule of fieldRules) {
        if (!rule.test(form[field], form as Record<string, unknown>)) {
          errors[field] = rule.message
          fieldValid = false
          valid = false
          break
        }
      }
      if (fieldValid) delete errors[field]
    }
    return valid
  }

  function clearErrors() {
    for (const key of Object.keys(errors)) delete errors[key]
  }

  function hasErrors(): boolean {
    return Object.keys(errors).length > 0
  }

  return { errors, validateField, validateAll, clearErrors, hasErrors }
}
