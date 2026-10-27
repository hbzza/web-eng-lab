
const display = document.getElementById("display");
const menuButton = document.getElementById("menu-button");
const submenu = document.getElementById("submenu");

let currentValue = "0";
let storedValue = null;
let operator = null;
let waitingForNumber = false;
let scientificMode = false;

// ---------- MENU NAVIGATION ----------

menuButton.addEventListener("click", () => {
    submenu.hidden = !submenu.hidden;
    menuButton.setAttribute("aria-expanded", String(!submenu.hidden));
});

document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
        const mode = button.dataset.mode;

        document.getElementById("calculator-panel").hidden =
            mode === "unit" || mode === "currency";

        document.getElementById("unit-panel").hidden = mode !== "unit";
        document.getElementById("currency-panel").hidden =
            mode !== "currency";

        scientificMode = mode === "scientific";
        document.getElementById("scientific-keys").hidden =
            !scientificMode;

        const labels = {
            standard: "Standard Mode",
            scientific: "Scientific Mode",
            unit: "Unit Conversion",
            currency: "Currency Conversion"
        };

        document.getElementById("mode-label").textContent = labels[mode];
        submenu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
    });
});

// ---------- BASIC CALCULATOR ----------

function updateDisplay() {
    display.value = currentValue;
}

function clearCalculator() {
    currentValue = "0";
    storedValue = null;
    operator = null;
    waitingForNumber = false;
    updateDisplay();
}

function enterNumber(number) {
    if (waitingForNumber) {
        currentValue = number;
        waitingForNumber = false;
    } else {
        currentValue = currentValue === "0"
            ? number
            : currentValue + number;
    }

    updateDisplay();
}

function enterDecimal() {
    if (waitingForNumber) {
        currentValue = "0.";
        waitingForNumber = false;
    } else if (!currentValue.includes(".")) {
        currentValue += ".";
    }

    updateDisplay();
}

function calculate(a, b, op) {
    switch (op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/":
            if (b === 0) throw new Error("Cannot divide by zero");
            return a / b;
        case "^": return Math.pow(a, b);
        default: return b;
    }
}

function formatResult(number) {
    if (!Number.isFinite(number)) {
        throw new Error("Result is outside the supported range");
    }

    return String(Number(number.toPrecision(12)));
}

function chooseOperator(nextOperator) {
    const inputValue = Number(currentValue);

    if (!Number.isFinite(inputValue)) {
        clearCalculator();
        return;
    }

    if (operator && !waitingForNumber) {
        try {
            currentValue = formatResult(
                calculate(storedValue, inputValue, operator)
            );
            updateDisplay();
        } catch (error) {
            display.value = error.message;
            currentValue = "0";
            storedValue = null;
            operator = null;
            waitingForNumber = true;
            return;
        }
    } else {
        storedValue = inputValue;
    }

    operator = nextOperator;
    waitingForNumber = true;
}

function showResult() {
    if (operator === null || waitingForNumber) return;

    try {
        currentValue = formatResult(
            calculate(storedValue, Number(currentValue), operator)
        );
        storedValue = null;
        operator = null;
        waitingForNumber = true;
        updateDisplay();
    } catch (error) {
        display.value = error.message;
        currentValue = "0";
        storedValue = null;
        operator = null;
        waitingForNumber = true;
    }
}

document.querySelectorAll("[data-number]").forEach(button => {
    button.addEventListener("click", () => {
        enterNumber(button.dataset.number);
    });
});

document.querySelectorAll("[data-operator]").forEach(button => {
    button.addEventListener("click", () => {
        chooseOperator(button.dataset.operator);
    });
});

document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        if (action === "clear") clearCalculator();
        if (action === "equals") showResult();

        if (action === "decimal") enterDecimal();

        if (action === "delete") {
            if (!waitingForNumber) {
                currentValue = currentValue.slice(0, -1) || "0";
                updateDisplay();
            }
        }

        if (action === "sign") {
            if (Number(currentValue) !== 0) {
                currentValue = String(-Number(currentValue));
                updateDisplay();
            }
        }
    });
});

// ---------- SCIENTIFIC CALCULATOR ----------

document.querySelectorAll("[data-function]").forEach(button => {
    button.addEventListener("click", () => {
        const number = Number(currentValue);
        const fn = button.dataset.function;
        let result;

        switch (fn) {
            case "sqrt":
                if (number < 0) {
                    alert("Square root of a negative number is not real.");
                    return;
                }
                result = Math.sqrt(number);
                break;

            case "square":
                result = number * number;
                break;

            case "sin":
                result = Math.sin(number * Math.PI / 180);
                break;

            case "cos":
                result = Math.cos(number * Math.PI / 180);
                break;

            case "tan":
                if (Math.abs(Math.cos(number * Math.PI / 180)) < 1e-12) {
                    alert("Tangent is undefined at this angle.");
                    return;
                }
                result = Math.tan(number * Math.PI / 180);
                break;
        }

        try {
            currentValue = formatResult(result);
            waitingForNumber = true;
            updateDisplay();
        } catch (error) {
            alert(error.message);
        }
    });
});

// ---------- UNIT CONVERSION ----------

const unitDefinitions = {
    length: {
        m: ["Meters", 1],
        km: ["Kilometers", 1000],
        cm: ["Centimeters", 0.01],
        mm: ["Millimeters", 0.001],
        mi: ["Miles", 1609.344],
        ft: ["Feet", 0.3048],
        in: ["Inches", 0.0254]
    },

    weight: {
        kg: ["Kilograms", 1],
        g: ["Grams", 0.001],
        mg: ["Milligrams", 0.000001],
        lb: ["Pounds", 0.45359237],
        oz: ["Ounces", 0.028349523125]
    },

    temperature: {
        C: ["Celsius"],
        F: ["Fahrenheit"],
        K: ["Kelvin"]
    }
};

const categorySelect = document.getElementById("unit-category");
const fromSelect = document.getElementById("unit-from");
const toSelect = document.getElementById("unit-to");

function populateUnits() {
    const units = unitDefinitions[categorySelect.value];

    fromSelect.replaceChildren();
    toSelect.replaceChildren();

    Object.entries(units).forEach(([key, details]) => {
        fromSelect.add(new Option(details[0], key));
        toSelect.add(new Option(details[0], key));
    });

    if (toSelect.options.length > 1) {
        toSelect.selectedIndex = 1;
    }
}

categorySelect.addEventListener("change", populateUnits);

function convertTemperature(value, from, to) {
    let celsius;

    if (from === "C") celsius = value;
    if (from === "F") celsius = (value - 32) * 5 / 9;
    if (from === "K") celsius = value - 273.15;

    if (to === "C") return celsius;
    if (to === "F") return celsius * 9 / 5 + 32;
    if (to === "K") return celsius + 273.15;
}

document.getElementById("unit-convert").addEventListener("click", () => {
    const value = Number(document.getElementById("unit-value").value);
    const category = categorySelect.value;
    const from = fromSelect.value;
    const to = toSelect.value;
    const resultElement = document.getElementById("unit-result");

    if (document.getElementById("unit-value").value.trim() === "" ||
        !Number.isFinite(value)) {
        resultElement.textContent = "Please enter a valid number.";
        return;
    }

    let result;

    if (category === "temperature") {
        result = convertTemperature(value, from, to);

        if (from === "K" && value < 0) {
            resultElement.textContent = "Kelvin cannot be below zero.";
            return;
        }

        if (to === "K" && result < 0) {
            resultElement.textContent =
                "The result is below absolute zero.";
            return;
        }
    } else {
        const units = unitDefinitions[category];
        result = value * units[from][1] / units[to][1];
    }

    resultElement.textContent =
        `${value} ${from} = ${Number(result.toPrecision(10))} ${to}`;
});

populateUnits();

// ---------- CURRENCY CONVERSION ----------

const currencyFrom = document.getElementById("currency-from");
const currencyTo = document.getElementById("currency-to");
const rateInput = document.getElementById("exchange-rate");

function resetCurrencyRate() {
    rateInput.value = "";
    rateInput.placeholder =
        `Enter ${currencyTo.value} per 1 ${currencyFrom.value}`;
}

currencyFrom.addEventListener("change", resetCurrencyRate);
currencyTo.addEventListener("change", resetCurrencyRate);

document.getElementById("currency-convert").addEventListener("click", () => {
    const amountInput = document.getElementById("currency-amount");
    const amount = Number(amountInput.value);
    const rate = Number(rateInput.value);
    const resultElement = document.getElementById("currency-result");

    if (amountInput.value.trim() === "" ||
        !Number.isFinite(amount) || amount < 0) {
        resultElement.textContent = "Enter a valid non-negative amount.";
        return;
    }

    if (rateInput.value.trim() === "" ||
        !Number.isFinite(rate) || rate <= 0) {
        resultElement.textContent =
            "Enter a valid, positive exchange rate.";
        return;
    }

    const result = amount * rate;

    resultElement.textContent =
        `${amount} ${currencyFrom.value} = ` +
        `${result.toLocaleString(undefined, {
            maximumFractionDigits: 4
        })} ${currencyTo.value}`;
});

// Initial display
updateDisplay();
