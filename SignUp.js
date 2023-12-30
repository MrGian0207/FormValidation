const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Đối tượng `Validator`
function Validator(options) {
    
    function getParent(element, selector) {
        while (element.parentElement) { 
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Function show error
    function showError(inputElement, rule) {
        // var errorElement = getParent(inputElement, '.form-group')
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;

        // Lấy ra các rules của selector
        // Xảy ra lỗi => dừng 
        var rules = selectorRules[rule.selector];

        //Lặp qua tất cả các rule
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) { 
                case 'checkbox': 
                case 'radio': 
                    errorMessage = rules[i](
                         formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default: 
                    errorMessage = rules[i](inputElement.value);
            }
            if(errorMessage) break;
        }

        if (errorMessage) { 
            errorElement.innerText = errorMessage;
        } 

        return !errorMessage;

    }


    // Function hide error
    function hideError(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage = rule.test(inputElement.value);
        if (!errorMessage) { 
            errorElement.innerText = '';
        } 
    }
    

    //Lấy element của form cần validate
    var formElement = $(options.form);

    if (formElement) {
        
        // Khi submit form
        formElement.onsubmit = (e) => {
            e.preventDefault();

            var isFormValid = true;

            // Lặp qua từng rule và validate
            options.rules.forEach( (rule) => {
                var inputElements = formElement.querySelectorAll(rule.selector);
                Array.from(inputElements).forEach((inputElement) => {
                    var isValid = showError(inputElement, rule);
                    if (!isValid) {
                        isFormValid = false;
                    }
                })
            });

            if (isFormValid) {
                if(typeof options.onSubmit === 'function'){
                    var enableInputs = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(enableInputs).reduce((values, input) => {
                        
                        switch(input.type) {
                            case 'radio': 
                                values[input.name] = formElement.querySelector('input[name="'+ input.name +'"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                };

                                if (!Array.isArray(values[input.name])){
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file': 
                                values[input.name] = input.files;
                                break; 
                            default: 
                                values[input.name] = input.value;
                        }                        
                        return values;
                    }, {});

                    options.onSubmit(formValues)
                } 
                // Submit với hành vi mặc định
                else {
                    formElement.submit();
                }
                 
            } 
        }

        //Lặp qua mỗi rule và xử lý
        options.rules.forEach( (rule) => {

            // Save all rule be looped 
            if (Array.isArray(selectorRules[rule.selector])) {

                selectorRules[rule.selector].push(rule.test);

            } else { 
            
                selectorRules[rule.selector] = [rule.test];

            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach((inputElement) => { 
                        if (inputElement) {
                            // Xử lý trường hợp blur khỏi input
                            inputElement.onblur = () => {
                                showError(inputElement, rule);
                            }
            
                            // Xử lý mỗi khi người dùng nhập vào input 
                            inputElement.oninput = () => {
                                hideError(inputElement, rule);
                            }
                }
            })
        });
    }
}

// Định nghĩa rules 
// Nguyên tắc của các rules: 
// 1. Khi có lỗi => message lỗi
// 2. Khi hợp lệ => Không trả về gì (undefined) 
Validator.isRequired = (selector, message) => {
    return {
        selector,
        test: (value) => {
            return value ? undefined : message || 'Vui lòng nhập trường này!';
        }
    };
}

Validator.isEmail = (selector, message) => {
    return {
        selector,
        test: (value) => {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email!';
        }
    };
}

Validator.minLength = (selector, min, message) => {
    return {
        selector,
        test: (value) => {
            return (value.length >= min) ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự`;
        }
    };
}

Validator.isConfirmed = (selector, getConfirmValue, message) => {
    return {
        selector, 
        test: (value) => {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'; 
        }
    }
} 
