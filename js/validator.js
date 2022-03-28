// 'Validator' object
function Validator(options) {

    function getParent(child, parent) {
        while (child.parentElement) {
            if (child.parentElement.matches(parent)) {
                return child.parentElement;
            }
            child = child.parentElement;
        }
    }

    var selectorRules = {};
    
    // Validate function
    function validate(inputElement, rule) {
        // value: inputElement.value
        // test function: rule.testFn

        // var errorMessage = rule.testFn(inputElement.value);
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

        // Get each rules from selector
        var rulesFn = selectorRules[rule.selector]
        
        // Loop each rule to check
        // If have any error => break
        for (var i = 0; i < rulesFn.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                    break;
                case 'checkbox':
                    errorMessage = rulesFn[i](
                        formElement.querySelector(`${rule.selector}:checked`)
                    );
                    break;
                default:
                    errorMessage = rulesFn[i](inputElement.value); // like function(value)
            }
            if (errorMessage) break
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }

        return !errorMessage
    }

    // Get element from form to validate
    var formElement = document.querySelector(options.form); // ==> OK
    if (formElement) {
        formElement.onsubmit = function(e) {
            e.preventDefault()

            var isFormValid = false;

            // Validate all when click submit
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector);
                
                var isValid = validate(inputElement, rule);
                if (isValid) {
                    isFormValid = true
                }
            })

            if (isFormValid) {
                console.log('Don\'t have any error');
                
                // Case: Submit with Javascript
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    var formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = 
                                    formElement.querySelector(`input[name="${input.name}"]:checked`).value;
                                break;

                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value)
                                break;

                            case 'file':
                                values[input.name] = input.files;
                                break;

                            default:
                                values[input.name] = input.value;
                                
                        }
                        return values;
                    }, {})

                    options.onSubmit(formValues)
                }
                // Case: Sumbit with event default
                else {
                    formElement.submit()
                }
            } else {
                console.log('Error!');
            }
        }

        // Loop each rule to handle (eventListener: onblur, oninput)
        options.rules.forEach(rule => {

            // Save all rules for each input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.testFn)
            } else {
                selectorRules[rule.selector] = [rule.testFn]
            }
            
            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(inputElement => {
                var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                // Handle situation when blur our of input box
                inputElement.onblur = function() {
                    validate(inputElement, rule)
                }
                
                // Handle situation when user input
                inputElement.oninput = function() {
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            })
        })
    }

    console.log(selectorRules)

}

/** My rule
 *  - When have error (invalid) => output error message
 *  - When valid => return undefined
 */
// Define rules
Validator.isRequired = function(selector, message) {
    return {
        selector: selector,
        testFn: function(inpValue) {
            return inpValue ? undefined : message || 'Please input this box'
        }
    };
}

Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        testFn: function(inpValue) {
            var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            // var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(inpValue) ? undefined : message || 'Please input correct email'
        }
    };
}

Validator.minLength = function(selector, min, message) {
    return {
        selector: selector,
        testFn: function(inpValue) {
            return inpValue.length >= min ? undefined : message || `Please input at least ${min} characters`
        }
    };
}

Validator.isConfirmed = function(selector, confirmedValue, message) {
    return {
        selector: selector,
        testFn: function(inpValue) {
            return inpValue === confirmedValue() ? undefined : message || 'This value is not correct'
        }
    };
}