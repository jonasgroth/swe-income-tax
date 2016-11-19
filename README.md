# Swedish income tax calculator
Calculates Swedish income tax.

##Install
    npm install swe-income-tax
##Usage
```js
    > var sweTax = require('swe-income-tax')
    > sweTax.taxDetails(300000, 0.326, 2016, 1980)
    { 
      inkomst: 300000,
      grundavdrag: 17900,
      pensionsavgift: 21000,
      jobbskatteavdrag: 23180,
      kommunalskatt: 91965,
      statligskatt: 0,
      totalskatt: 68785 
    }
```
# API
## sweTax.taxDetails(yearlyIncome, taxRate, year, birthYear)

- @param {number} yearlyIncome The taxable income
- @param {number} taxRate Tax rate for the municipality 
- @param {number} year Year for when money was earned
- @param {number} birthYear Year of birth of the tax payer
- @return {object}

Returns an object with all deductions and taxes for the given income.

## sweTax.yearlyTax(yearlyIncome, taxRate, year, birthYear)

- @param {number} yearlyIncome The taxable income
- @param {number} taxRate Tax rate for the municipality 
- @param {number} year Year for when money was earned
- @param {number} birthYear Year of birth of the tax payer
- @return {number}

Returns the total tax to be paid for the entire year.

## sweTax.monthlyTax(monthlyIncome, taxRate, year, birthYear)

- @param {number} yearlyIncome The taxable income
- @param {number} taxRate Tax rate for the municipality 
- @param {number} year Year for when money was earned
- @param {number} birthYear Year of birth of the tax payer
- @return {number}

Returns tax to be paid per month for a monthly income.
