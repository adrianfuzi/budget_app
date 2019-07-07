//! BUDGET CONTROLLER ! //

var budgetController = (function() {

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calculatePercentages = function(totalIncome) {

        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }

    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    function calculateTotal(type) {
        var sum = 0;

        data.allItems[type].forEach(function(current) {
            sum += current.value;
        });

        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            // The names are the same as the input values 'exp' 'inc'
            exp: [],
            inc: [],
        },

        totals: {
            exp: 0,
            inc: 0
        },

        totalBudget: 0,
        percentage: -1 // -1 means "non existent"
    };


    return {
        addItem: function(addType, addDes, addValue) {
            var newItem, newId;

            // Create new id (newId = last newId + 1)
            if (data.allItems[addType].length > 0) {
                newId = data.allItems[addType][data.allItems[addType].length - 1].id + 1;
            } else {
                newId = 0;
            }
            
            // Create new item based on 'inc' or 'exp' type
            if (addType === 'exp') {
                newItem = new Expense(newId, addDes, addValue);
            } else {
                newItem = new Income(newId, addDes, addValue);
            }

            // Push it into our data structure
            data.allItems[addType].push(newItem);

            // Return the new item
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            ids = data.allItems[type].map(function(currentElement) {
                return currentElement.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) { // if it is not in the array (-1)
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {

            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate budget: income - expenses
            data.totalBudget = data.totals.inc - data.totals.exp;

            // Calculate percentage of the income that we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {

            data.allItems.exp.forEach(function(current) {
                current.calculatePercentages(data.totals.inc);
            });
        },

        getPercentage: function() {
            var allPercentages = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            });
            return allPercentages;
        },

        getBudget: function() {
            return {
                budget: data.totalBudget,
                totalIncome: data.totals.inc,
                totalExpenses: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function() {
            console.log(data);
        }
    };

}());


//! UI CONTROLLER ! //

var UIController = (function() {

    var DOMstrings = {
        inputType: '.add-type',
        inputDescription: '.add-description',
        inputValue: '.add-value',
        inputButton: '.add-btn',
        incomeList: '.income-list',
        expensesList: '.expenses-list',
        budgetLabel: '.budget-value',
        incomeLabel: '.income-total',
        expensesLabel: '.expenses-total',
        percentageLabel: '.expenses-percentage',
        listContainer: '.list-container',
        itemPercentage: '.item-percentage',
        dateLabel: '.date',
        budgetChart: '.budgetChart'
    };

    function formatNumber(number, type) {

        var numberSplit, intiger, decimal;
        
        number = Math.abs(number);
        number = number.toFixed(2);

        numberSplit = number.split('.');

        intiger = numberSplit[0];
        if (intiger.length > 3) {
            for (var i = 3; i < intiger.length; i += 4) {
                intiger = intiger.substr(0, intiger.length - i) + ',' + intiger.substr(intiger.length - i, i);
            }
        }

        decimal = numberSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + intiger + '.' + decimal;

    };

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value) // Has to be converted to a number (parseFloat)
            };
        },

        addListItem: function(listObj, listType) {
            var html, newHtml, element;

            // Create HTML string with placeholder text
            if (listType === 'inc') {
                element = DOMstrings.incomeList;
                
                html = '<li class="d-flex justify-content-between list-group-item  bg-dark" id="inc-%id%"><div class="description text-light mt-auto mb-auto">%description%</div><div class="d-flex"><div class="text-info mt-auto mb-auto">%value%</div><button type="button" class="btn btn-outline-danger ml-3">&#10005;</button></div></li>'
            } else if (listType === 'exp') {
                element = DOMstrings.expensesList;
                
                html = '<li class="d-flex justify-content-between list-group-item bg-dark" id="exp-%id%"><div class="description text-light mt-auto mb-auto">%description%</div><div class="d-flex"><div class="text-danger-2 mt-auto mb-auto">%value%</div><div class="item-percentage percentage text-light ml-2 mt-auto mb-auto">5%</div><button type="button" class="delete-item btn btn-outline-danger ml-3">&#10005;</button></div></li>';
            };

            // Replace the placeholder text with actual data
            newHtml = html.replace('%id%', listObj.id);
            newHtml = newHtml.replace('%description%', listObj.description);
            newHtml = newHtml.replace('%value%', formatNumber(listObj.value, listType));

            // Insert HTML to the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function(selectorID) {

            var selectedElement = document.getElementById(selectorID);
            selectedElement.parentNode.removeChild(selectedElement);

        },

        clearFields: function() {
            var fields, fieldsArray;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue); // Returns a list

            // "fields" is a list, therefore we need to convert it to an array.
            fieldsArray = Array.prototype.slice.call(fields);

            fieldsArray.forEach(function(current) {
                current.value = '';
            });

            fieldsArray[0].focus();
        },

        displayBudget: function(displayObj) {
            
            var type;
            
            displayObj.budget > 0 ? type = 'inc' : type = 'exp';

            if (displayObj.budget !== 0) {
                document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(displayObj.budget, type);
            } else {
                document.querySelector(DOMstrings.budgetLabel).textContent = '0.00';
            }

            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(displayObj.totalIncome, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(displayObj.totalExpenses, 'exp');

            if (displayObj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = displayObj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }

        },

        displayChart: function(displayObj) {

            var colors = ['#dc3545', '#17a2b8'];
            var income = displayObj.totalIncome;
            var expenses = displayObj.totalExpenses;

            var chartOptions = {
                cutoutPercentage: 80, 
                legend: {display: false},
            };

            var chartData = {
                labels: ['Expenses', 'Income'],
                datasets: [
                    {
                        backgroundColor: colors.slice(0, 2),
                        hoverBackgroundColor: colors,
                        borderWidth: 0,
                        data: [expenses, income]
                    }
                ]
            };

            var chart = document.querySelector(DOMstrings.budgetChart);
            if (chart) {
                new Chart(chart, {
                    type: 'pie',
                    data: chartData,
                    options: chartOptions
                });
            }

        },

        displayPercentages: function(percentages) {

            var fields = document.querySelectorAll(DOMstrings.itemPercentage);

            nodeListForEach(fields, function(current, index) {

                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });

        },

        displayDate: function() {
            var now, year, month, months;

            now = new Date();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth()

            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function() {

            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);

            nodeListForEach(fields, function(current) {
                current.classList.toggle('form-control-red');
            });

            document.querySelector(DOMstrings.inputButton).classList.toggle('btn-outline-danger');

        },

        getDOMstrings: function() {
            return DOMstrings;
        }
    }

}());


//! APP CONTROLLER ! //

var appController = (function(connectBudgetCtrl, connectUICtrl) {

    var setUpEventListeners = function() {
        var DOMstringsInAppCtrl = connectUICtrl.getDOMstrings;

        document.querySelector(DOMstringsInAppCtrl().inputButton).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOMstringsInAppCtrl().listContainer).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOMstringsInAppCtrl().inputType).addEventListener('change', connectUICtrl.changedType);

    };

    function updateBudget() {
        // 1. Calculate the budget
        connectBudgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = connectBudgetCtrl.getBudget();

        // 2. Display budget on the UI
        console.log(budget);
        connectUICtrl.displayBudget(budget);
        connectUICtrl.displayChart(budget);

    };

    var updatePercentages = function() {

        // 1 Calculate percentages
        connectBudgetCtrl.calculatePercentages();

        // 2. Read the percentages
        var percentages = connectBudgetCtrl.getPercentage();

        // 3. Update the UI with the new percentages
        connectUICtrl.displayPercentages(percentages);

    };

    function ctrlAddItem() {
        var input, newItem, addUiItem;

        // 1. Get the field input data
        input = connectUICtrl.getInput();

        //? Cannot be empty, NaN and must be greater than 0 ?//
        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            // 2. Add item to budget controller
            newItem = connectBudgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add item to the UI
            connectUICtrl.addListItem(newItem, input.type);

            // 4. Clear the fields
            connectUICtrl.clearFields();

            // 5. Calculate and update budget
            updateBudget();

            // 6. Calculate and call the percentages
            updatePercentages();
        }
    };

    function ctrlDeleteItem(event) {
        var itemID, splitID, type, id;

        itemID = event.target.parentNode.parentNode.id;

        if (itemID) {

            // inc-1
            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]); // it's a string therefore it needs to be converted to a number (parseInt)

            // 1. Delete item from the data structure
            budgetController.deleteItem(type, id);

            // 2. Delete the item from the UI
            connectUICtrl.deleteListItem(itemID);

            // 3. Update and show the new budget
            updateBudget();

            // 4. Calculate and call the percentages
            updatePercentages();

        }

    };

    return {
        init: function() {
            console.log('App is running');
            connectUICtrl.displayDate();
            connectUICtrl.displayBudget({
                budget: 0,
                totalIncome: 0,
                totalExpenses: 0,
                percentage: -1
            });
            setUpEventListeners();
        }
    }

}(budgetController, UIController));

appController.init();