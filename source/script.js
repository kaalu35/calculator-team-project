class SmartCalculator {
    constructor() {
        this.currentInput = "0";
        this.previousInput = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.lastCalculation = "";
        this.error = null;
        this.history = this.loadHistory();

        this.displayElement = document.getElementById("calculator-display");
        this.previousOperationElement = document.getElementById("previous-operation");
        this.errorElement = document.getElementById("error-message");
        this.historyListElement = document.getElementById("history-list");

        this.initializeEvents();
        this.render();
        this.renderHistory();
    }

    initializeEvents() {
        const numberButtons = document.querySelectorAll("[data-number]");
        const operatorButtons = document.querySelectorAll("[data-operator]");
        const actionButtons = document.querySelectorAll("[data-action]");

        numberButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.inputNumber(button.dataset.number);
            });
        });

        operatorButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.inputOperator(button.dataset.operator);
            });
        });

        actionButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.handleAction(button.dataset.action);
            });
        });

        document.getElementById("clear-history-button").addEventListener("click", () => {
            this.clearHistory();
        });

        document.addEventListener("keydown", (event) => {
            this.handleKeyboardInput(event);
        });
    }

    inputNumber(value) {
        this.clearError();

        if (value === ".") {
            this.inputDecimal();
            return;
        }

        if (this.waitingForOperand) {
            this.currentInput = value;
            this.waitingForOperand = false;
        } else if (this.currentInput === "0") {
            this.currentInput = value;
        } else {
            this.currentInput += value;
        }

        this.limitInputLength();
        this.render();
    }

    inputDecimal() {
        this.clearError();

        if (this.waitingForOperand) {
            this.currentInput = "0.";
            this.waitingForOperand = false;
            this.render();
            return;
        }

        if (!this.currentInput.includes(".")) {
            this.currentInput += ".";
        }

        this.render();
    }

    inputOperator(nextOperator) {
        this.clearError();
        const inputValue = Number(this.currentInput);

        if (!Number.isFinite(inputValue)) {
            this.showError("Invalid number.");
            return;
        }

        if (this.operator !== null && this.waitingForOperand) {
            this.operator = nextOperator;
            this.render();
            return;
        }

        if (this.previousInput === null) {
            this.previousInput = inputValue;
        } else if (this.operator !== null) {
            const result = this.performCalculation(this.previousInput, inputValue, this.operator);
            if (result === null) {
                return;
            }
            this.currentInput = this.formatNumber(result);
            this.previousInput = result;
        }

        this.operator = nextOperator;
        this.waitingForOperand = true;
        this.render();
    }

    calculate() {
        this.clearError();

        if (this.operator === null || this.previousInput === null || this.waitingForOperand) {
            return;
        }

        const secondOperand = Number(this.currentInput);
        const firstOperand = this.previousInput;
        const selectedOperator = this.operator;
        const result = this.performCalculation(firstOperand, secondOperand, selectedOperator);

        if (result === null) {
            return;
        }

        const expression = `${this.formatNumber(firstOperand)} ${this.getOperatorSymbol(selectedOperator)} ${this.formatNumber(secondOperand)}`;
        this.currentInput = this.formatNumber(result);
        this.lastCalculation = `${expression} = ${this.currentInput}`;
        this.addHistory(expression, this.currentInput);
        this.previousInput = null;
        this.operator = null;
        this.waitingForOperand = true;
        this.render();
    }

    performCalculation(firstOperand, secondOperand, operator) {
        let result;

        switch (operator) {
            case "+":
                result = firstOperand + secondOperand;
                break;
            case "-":
                result = firstOperand - secondOperand;
                break;
            case "*":
                result = firstOperand * secondOperand;
                break;
            case "/":
                if (secondOperand === 0) {
                    this.showError("Cannot divide by zero.");
                    return null;
                }
                result = firstOperand / secondOperand;
                break;
            default:
                this.showError("Unsupported operation.");
                return null;
        }

        if (!Number.isFinite(result)) {
            this.showError("Result is outside the supported range.");
            return null;
        }

        return result;
    }

    percentage() {
        this.clearError();
        const value = Number(this.currentInput);

        if (!Number.isFinite(value)) {
            this.showError("Invalid number.");
            return;
        }

        this.currentInput = this.formatNumber(value / 100);
        this.waitingForOperand = false;
        this.render();
    }

    deleteLastCharacter() {
        this.clearError();

        if (this.waitingForOperand) {
            return;
        }

        if (this.currentInput.length <= 1 || (this.currentInput.length === 2 && this.currentInput.startsWith("-"))) {
            this.currentInput = "0";
        } else {
            this.currentInput = this.currentInput.slice(0, -1);
        }

        this.render();
    }

    clearCalculator() {
        this.currentInput = "0";
        this.previousInput = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.lastCalculation = "";
        this.clearError();
        this.render();
    }

    handleAction(action) {
        switch (action) {
            case "clear":
                this.clearCalculator();
                break;
            case "delete":
                this.deleteLastCharacter();
                break;
            case "percentage":
                this.percentage();
                break;
            case "calculate":
                this.calculate();
                break;
            default:
                break;
        }
    }

    handleKeyboardInput(event) {
        const key = event.key;

        if (/^[0-9]$/.test(key)) {
            event.preventDefault();
            this.inputNumber(key);
            return;
        }

        if (key === ".") {
            event.preventDefault();
            this.inputNumber(".");
            return;
        }

        if (["+", "-", "*", "/"].includes(key)) {
            event.preventDefault();
            this.inputOperator(key);
            return;
        }

        if (key === "Enter" || key === "=") {
            event.preventDefault();
            this.calculate();
            return;
        }

        if (key === "Backspace") {
            event.preventDefault();
            this.deleteLastCharacter();
            return;
        }

        if (key === "Escape") {
            event.preventDefault();
            this.clearCalculator();
            return;
        }

        if (key === "%") {
            event.preventDefault();
            this.percentage();
        }
    }

    addHistory(expression, result) {
        const historyItem = {
            id: Date.now(),
            expression,
            result,
            createdAt: new Date().toISOString()
        };

        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 20);
        this.saveHistory();
        this.renderHistory();
    }

    loadHistory() {
        try {
            const savedHistory = localStorage.getItem("smartCalculatorHistory");
            if (!savedHistory) {
                return [];
            }
            const parsedHistory = JSON.parse(savedHistory);
            return Array.isArray(parsedHistory) ? parsedHistory : [];
        } catch (error) {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem("smartCalculatorHistory", JSON.stringify(this.history));
        } catch (error) {
            this.showError("Unable to save calculation history.");
        }
    }

    clearHistory() {
        this.history = [];
        try {
            localStorage.removeItem("smartCalculatorHistory");
        } catch (error) {
            this.showError("Unable to clear calculation history.");
        }
        this.renderHistory();
    }

    reuseHistoryResult(result) {
        this.clearError();
        this.currentInput = String(result);
        this.previousInput = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.render();
    }

    renderHistory() {
        this.historyListElement.innerHTML = "";

        if (this.history.length === 0) {
            const emptyElement = document.createElement("p");
            emptyElement.className = "empty-history";
            emptyElement.textContent = "No calculations yet.";
            this.historyListElement.appendChild(emptyElement);
            return;
        }

        this.history.forEach((item) => {
            const itemElement = document.createElement("div");
            itemElement.className = "history-item";
            itemElement.tabIndex = 0;

            const expressionElement = document.createElement("div");
            expressionElement.className = "history-expression";
            expressionElement.textContent = item.expression;

            const resultElement = document.createElement("div");
            resultElement.className = "history-result";
            resultElement.textContent = `= ${item.result}`;

            itemElement.appendChild(expressionElement);
            itemElement.appendChild(resultElement);

            itemElement.addEventListener("click", () => {
                this.reuseHistoryResult(item.result);
            });

            itemElement.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.reuseHistoryResult(item.result);
                }
            });

            this.historyListElement.appendChild(itemElement);
        });
    }

    render() {
        this.displayElement.textContent = this.currentInput;

        if (this.previousInput !== null && this.operator !== null) {
            this.previousOperationElement.textContent = `${this.formatNumber(this.previousInput)} ${this.getOperatorSymbol(this.operator)}`;
        } else if (this.lastCalculation) {
            this.previousOperationElement.textContent = this.lastCalculation;
        } else {
            this.previousOperationElement.textContent = "";
        }
    }

    showError(message) {
        this.error = message;
        this.errorElement.textContent = message;
    }

    clearError() {
        this.error = null;
        this.errorElement.textContent = "";
    }

    getOperatorSymbol(operator) {
        const symbols = {
            "+": "+",
            "-": "−",
            "*": "×",
            "/": "÷"
        };
        return symbols[operator] || operator;
    }

    formatNumber(number) {
        if (!Number.isFinite(number)) {
            return "0";
        }
        const rounded = Math.round((number + Number.EPSILON) * 10000000000) / 10000000000;
        return String(rounded);
    }

    limitInputLength() {
        const maximumLength = 16;
        if (this.currentInput.length > maximumLength) {
            this.currentInput = this.currentInput.slice(0, maximumLength);
            this.showError(`Maximum ${maximumLength} characters allowed.`);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new SmartCalculator();
});
