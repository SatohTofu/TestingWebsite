/* ==============================================
   FORM VALIDATION UTILITIES
   ============================================== */

/**
 * Comprehensive form validation system
 * Provides validation rules, error handling, and real-time feedback
 * 
 * Usage:
 * const validator = new FormValidator({
 *   username: ['required', 'minLength:3', 'maxLength:20', 'alphanumeric'],
 *   email: ['required', 'email'],
 *   password: ['required', 'minLength:8', 'strongPassword']
 * });
 * 
 * const result = validator.validate(formData);
 * if (!result.valid) {
 *   console.log(result.errors);
 * }
 */

class FormValidator {
    constructor(rules = {}) {
        this.rules = rules;
        this.customValidators = new Map();
        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: 'Must be at least {min} characters long',
            maxLength: 'Cannot exceed {max} characters',
            min: 'Must be at least {min}',
            max: 'Cannot exceed {max}',
            pattern: 'Invalid format',
            alphanumeric: 'Only letters and numbers are allowed',
            numeric: 'Only numbers are allowed',
            strongPassword: 'Password must contain uppercase, lowercase, number and special character',
            confirmPassword: 'Passwords do not match',
            phone: 'Please enter a valid phone number',
            url: 'Please enter a valid URL',
            date: 'Please enter a valid date',
            creditCard: 'Please enter a valid credit card number',
            unique: 'This value is already taken'
        };
        
        this.setupBuiltInValidators();
    }
    
    /**
     * Setup built-in validation rules
     */
    setupBuiltInValidators() {
        // Required field validator
        this.customValidators.set('required', (value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return true;
        });
        
        // Email validator
        this.customValidators.set('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });
        
        // Minimum length validator
        this.customValidators.set('minLength', (value, param) => {
            const min = parseInt(param);
            return value && value.length >= min;
        });
        
        // Maximum length validator
        this.customValidators.set('maxLength', (value, param) => {
            const max = parseInt(param);
            return !value || value.length <= max;
        });
        
        // Minimum value validator
        this.customValidators.set('min', (value, param) => {
            const min = parseFloat(param);
            return parseFloat(value) >= min;
        });
        
        // Maximum value validator
        this.customValidators.set('max', (value, param) => {
            const max = parseFloat(param);
            return parseFloat(value) <= max;
        });
        
        // Pattern validator
        this.customValidators.set('pattern', (value, param) => {
            const regex = new RegExp(param);
            return regex.test(value);
        });
        
        // Alphanumeric validator
        this.customValidators.set('alphanumeric', (value) => {
            const alphanumericRegex = /^[a-zA-Z0-9]+$/;
            return alphanumericRegex.test(value);
        });
        
        // Numeric validator
        this.customValidators.set('numeric', (value) => {
            return !isNaN(value) && !isNaN(parseFloat(value));
        });
        
        // Strong password validator
        this.customValidators.set('strongPassword', (value) => {
            if (!value) return false;
            
            const hasUpper = /[A-Z]/.test(value);
            const hasLower = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            
            return hasUpper && hasLower && hasNumber && hasSpecial && value.length >= 8;
        });
        
        // Phone number validator
        this.customValidators.set('phone', (value) => {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanValue = value.replace(/[\s\-\(\)]/g, '');
            return phoneRegex.test(cleanValue);
        });
        
        // URL validator
        this.customValidators.set('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
        
        // Date validator
        this.customValidators.set('date', (value) => {
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        });
        
        // Credit card validator (basic Luhn algorithm)
        this.customValidators.set('creditCard', (value) => {
            const cleanValue = value.replace(/\s/g, '');
            if (!/^\d{13,19}$/.test(cleanValue)) return false;
            
            let sum = 0;
            let isEven = false;
            
            for (let i = cleanValue.length - 1; i >= 0; i--) {
                let digit = parseInt(cleanValue[i]);
                
                if (isEven) {
                    digit *= 2;
                    if (digit > 9) digit -= 9;
                }
                
                sum += digit;
                isEven = !isEven;
            }
            
            return sum % 10 === 0;
        });
    }
    
    /**
     * Add custom validator
     * @param {string} name - Validator name
     * @param {Function} validator - Validation function
     * @param {string} message - Error message
     */
    addValidator(name, validator, message = 'Invalid value') {
        this.customValidators.set(name, validator);
        this.messages[name] = message;
    }
    
    /**
     * Set custom error message
     * @param {string} rule - Rule name
     * @param {string} message - Error message
     */
    setMessage(rule, message) {
        this.messages[rule] = message;
    }
    
    /**
     * Validate single field
     * @param {string} field - Field name
     * @param {*} value - Field value
     * @param {Object} allData - All form data (for cross-field validation)
     * @returns {Object} Validation result
     */
    validateField(field, value, allData = {}) {
        const fieldRules = this.rules[field] || [];
        const errors = [];
        
        for (const rule of fieldRules) {
            const [ruleName, parameter] = rule.split(':');
            
            // Special handling for confirmPassword
            if (ruleName === 'confirmPassword') {
                const passwordField = parameter || 'password';
                if (value !== allData[passwordField]) {
                    errors.push(this.formatMessage('confirmPassword', { field: passwordField }));
                }
                continue;
            }
            
            // Special handling for unique (requires async validation)
            if (ruleName === 'unique') {
                // This should be handled separately with async validation
                continue;
            }
            
            const validator = this.customValidators.get(ruleName);
            if (!validator) {
                console.warn(`Unknown validation rule: ${ruleName}`);
                continue;
            }
            
            const isValid = validator(value, parameter, allData);
            if (!isValid) {
                errors.push(this.formatMessage(ruleName, { 
                    min: parameter, 
                    max: parameter,
                    field 
                }));
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate entire form
     * @param {Object} data - Form data
     * @returns {Object} Validation result
     */
    validate(data) {
        const result = {
            valid: true,
            errors: {},
            fieldErrors: {}
        };
        
        for (const field in this.rules) {
            const fieldResult = this.validateField(field, data[field], data);
            
            if (!fieldResult.valid) {
                result.valid = false;
                result.fieldErrors[field] = fieldResult.errors;
                result.errors[field] = fieldResult.errors[0]; // First error only
            }
        }
        
        return result;
    }
    
    /**
     * Format error message with parameters
     * @param {string} rule - Rule name
     * @param {Object} params - Message parameters
     * @returns {string} Formatted message
     */
    formatMessage(rule, params = {}) {
        let message = this.messages[rule] || 'Invalid value';
        
        for (const [key, value] of Object.entries(params)) {
            message = message.replace(`{${key}}`, value);
        }
        
        return message;
    }
    
    /**
     * Validate field asynchronously (for unique checks, etc.)
     * @param {string} field - Field name
     * @param {*} value - Field value
     * @param {Function} uniqueChecker - Async function to check uniqueness
     * @returns {Promise<Object>} Validation result
     */
    async validateFieldAsync(field, value, uniqueChecker = null) {
        const syncResult = this.validateField(field, value);
        
        if (!syncResult.valid) {
            return syncResult;
        }
        
        const fieldRules = this.rules[field] || [];
        const hasUniqueRule = fieldRules.some(rule => rule.startsWith('unique'));
        
        if (hasUniqueRule && uniqueChecker) {
            try {
                const isUnique = await uniqueChecker(value);
                if (!isUnique) {
                    return {
                        valid: false,
                        errors: [this.formatMessage('unique')]
                    };
                }
            } catch (error) {
                return {
                    valid: false,
                    errors: ['Unable to verify uniqueness']
                };
            }
        }
        
        return syncResult;
    }
}

/**
 * Real-time form validation manager
 * Handles form binding, real-time validation, and UI feedback
 */
class FormValidationManager {
    constructor(formElement, validator, options = {}) {
        this.form = formElement;
        this.validator = validator;
        this.options = {
            validateOnChange: true,
            validateOnBlur: true,
            showErrorsOnSubmit: true,
            errorClass: 'error',
            errorMessageClass: 'error-message',
            successClass: 'success',
            ...options
        };
        
        this.fieldStates = new Map();
        this.submitCallbacks = [];
        this.changeCallbacks = [];
        
        this.bindEvents();
    }
    
    /**
     * Bind form events
     */
    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Field events
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (this.options.validateOnChange) {
                field.addEventListener('input', this.handleFieldChange.bind(this));
            }
            
            if (this.options.validateOnBlur) {
                field.addEventListener('blur', this.handleFieldBlur.bind(this));
            }
            
            // Initialize field state
            this.fieldStates.set(field.name, {
                touched: false,
                valid: true,
                errors: []
            });
        });
    }
    
    /**
     * Handle form submission
     * @param {Event} event - Submit event
     */
    handleSubmit(event) {
        event.preventDefault();
        
        const formData = this.getFormData();
        const result = this.validator.validate(formData);
        
        // Update UI with validation results
        if (this.options.showErrorsOnSubmit) {
            this.updateUI(result);
        }
        
        // Call submit callbacks
        this.submitCallbacks.forEach(callback => {
            callback(result, formData);
        });
        
        if (result.valid) {
            this.form.dispatchEvent(new CustomEvent('validSubmit', {
                detail: { data: formData, result }
            }));
        } else {
            this.form.dispatchEvent(new CustomEvent('invalidSubmit', {
                detail: { data: formData, result }
            }));
        }
    }
    
    /**
     * Handle field change
     * @param {Event} event - Input event
     */
    handleFieldChange(event) {
        const field = event.target;
        const fieldName = field.name;
        
        if (!fieldName) return;
        
        const formData = this.getFormData();
        const result = this.validator.validateField(fieldName, field.value, formData);
        
        // Update field state
        const fieldState = this.fieldStates.get(fieldName);
        if (fieldState) {
            fieldState.valid = result.valid;
            fieldState.errors = result.errors;
        }
        
        // Update field UI
        this.updateFieldUI(field, result);
        
        // Call change callbacks
        this.changeCallbacks.forEach(callback => {
            callback(fieldName, result, field.value);
        });
    }
    
    /**
     * Handle field blur
     * @param {Event} event - Blur event
     */
    handleFieldBlur(event) {
        const field = event.target;
        const fieldName = field.name;
        
        if (!fieldName) return;
        
        // Mark field as touched
        const fieldState = this.fieldStates.get(fieldName);
        if (fieldState) {
            fieldState.touched = true;
        }
        
        // Validate field
        this.handleFieldChange(event);
    }
    
    /**
     * Get form data as object
     * @returns {Object} Form data
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, etc.)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    /**
     * Update entire form UI
     * @param {Object} result - Validation result
     */
    updateUI(result) {
        // Clear all existing errors
        this.clearErrors();
        
        // Show field errors
        for (const [fieldName, errors] of Object.entries(result.fieldErrors || {})) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.updateFieldUI(field, { valid: false, errors });
            }
        }
        
        // Update form classes
        if (result.valid) {
            this.form.classList.add(this.options.successClass);
            this.form.classList.remove(this.options.errorClass);
        } else {
            this.form.classList.add(this.options.errorClass);
            this.form.classList.remove(this.options.successClass);
        }
    }
    
    /**
     * Update single field UI
     * @param {HTMLElement} field - Field element
     * @param {Object} result - Field validation result
     */
    updateFieldUI(field, result) {
        const fieldContainer = field.closest('.form-group') || field.parentElement;
        
        // Update field classes
        if (result.valid) {
            field.classList.add(this.options.successClass);
            field.classList.remove(this.options.errorClass);
            fieldContainer.classList.add(this.options.successClass);
            fieldContainer.classList.remove(this.options.errorClass);
        } else {
            field.classList.add(this.options.errorClass);
            field.classList.remove(this.options.successClass);
            fieldContainer.classList.add(this.options.errorClass);
            fieldContainer.classList.remove(this.options.successClass);
        }
        
        // Handle error messages
        const existingError = fieldContainer.querySelector(`.${this.options.errorMessageClass}`);
        if (existingError) {
            existingError.remove();
        }
        
        if (!result.valid && result.errors.length > 0) {
            const errorElement = document.createElement('div');
            errorElement.className = this.options.errorMessageClass;
            errorElement.textContent = result.errors[0];
            fieldContainer.appendChild(errorElement);
        }
    }
    
    /**
     * Clear all error states and messages
     */
    clearErrors() {
        // Remove error classes
        const errorElements = this.form.querySelectorAll(`.${this.options.errorClass}`);
        errorElements.forEach(element => {
            element.classList.remove(this.options.errorClass);
        });
        
        // Remove error messages
        const errorMessages = this.form.querySelectorAll(`.${this.options.errorMessageClass}`);
        errorMessages.forEach(message => message.remove());
        
        // Update form classes
        this.form.classList.remove(this.options.errorClass);
    }
    
    /**
     * Manually validate field
     * @param {string} fieldName - Field name
     * @returns {Object} Validation result
     */
    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return { valid: true, errors: [] };
        
        const formData = this.getFormData();
        const result = this.validator.validateField(fieldName, field.value, formData);
        
        this.updateFieldUI(field, result);
        
        return result;
    }
    
    /**
     * Manually validate entire form
     * @returns {Object} Validation result
     */
    validateForm() {
        const formData = this.getFormData();
        const result = this.validator.validate(formData);
        
        this.updateUI(result);
        
        return result;
    }
    
    /**
     * Add submit callback
     * @param {Function} callback - Callback function
     */
    onSubmit(callback) {
        this.submitCallbacks.push(callback);
    }
    
    /**
     * Add field change callback
     * @param {Function} callback - Callback function
     */
    onChange(callback) {
        this.changeCallbacks.push(callback);
    }
    
    /**
     * Reset form validation state
     */
    reset() {
        this.clearErrors();
        
        // Reset field states
        this.fieldStates.forEach(state => {
            state.touched = false;
            state.valid = true;
            state.errors = [];
        });
        
        // Reset form classes
        this.form.classList.remove(this.options.errorClass, this.options.successClass);
    }
    
    /**
     * Set field error manually
     * @param {string} fieldName - Field name
     * @param {string|Array} errors - Error message(s)
     */
    setFieldError(fieldName, errors) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        const errorArray = Array.isArray(errors) ? errors : [errors];
        const result = { valid: false, errors: errorArray };
        
        this.updateFieldUI(field, result);
        
        // Update field state
        const fieldState = this.fieldStates.get(fieldName);
        if (fieldState) {
            fieldState.valid = false;
            fieldState.errors = errorArray;
        }
    }
    
    /**
     * Clear field error manually
     * @param {string} fieldName - Field name
     */
    clearFieldError(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        const result = { valid: true, errors: [] };
        this.updateFieldUI(field, result);
        
        // Update field state
        const fieldState = this.fieldStates.get(fieldName);
        if (fieldState) {
            fieldState.valid = true;
            fieldState.errors = [];
        }
    }
}

// Common validation rule sets
const ValidationRules = {
    user: {
        username: ['required', 'minLength:3', 'maxLength:20', 'alphanumeric'],
        email: ['required', 'email', 'maxLength:255'],
        password: ['required', 'minLength:8', 'strongPassword'],
        confirmPassword: ['required', 'confirmPassword:password'],
        firstName: ['required', 'minLength:2', 'maxLength:50'],
        lastName: ['required', 'minLength:2', 'maxLength:50'],
        dateOfBirth: ['required', 'date'],
        phone: ['phone']
    },
    
    review: {
        title: ['required', 'minLength:5', 'maxLength:200'],
        content: ['required', 'minLength:50', 'maxLength:10000'],
        rating: ['required', 'numeric', 'min:1', 'max:10']
    },
    
    contact: {
        name: ['required', 'minLength:2', 'maxLength:100'],
        email: ['required', 'email'],
        subject: ['required', 'minLength:5', 'maxLength:200'],
        message: ['required', 'minLength:20', 'maxLength:2000']
    },
    
    payment: {
        cardNumber: ['required', 'creditCard'],
        expiryMonth: ['required', 'numeric', 'min:1', 'max:12'],
        expiryYear: ['required', 'numeric'],
        cvv: ['required', 'numeric', 'minLength:3', 'maxLength:4'],
        cardholderName: ['required', 'minLength:2', 'maxLength:100']
    }
};

// Export for global access
window.FormValidator = FormValidator;
window.FormValidationManager = FormValidationManager;
window.ValidationRules = ValidationRules;
