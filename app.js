var pbbList = {2016: 44300, 2017: 44800, 2018: 45500} //Prisbasbelopp
var ibbList = {2016: 59300, 2017: 61500, 2018: 62500} //Inkomstbasbelopp
//Limits for state tax
var brytpunkt20List = {2016: 430200, 2017: 438900, 2018: 455300};
var brytpunkt25List = {2016: 625800, 2017: 638500, 2018: 662300};

module.exports = {
  //Tax given a yearly income.
  yearlyTax: function(yearlyIncome, taxRate, year, birthYear) {
    return getTax(yearlyIncome, taxRate, year, birthYear).totalskatt;
  },
  //Tax given a monthly income.
  monthlyTax: function(monthlyIncome, taxRate, year, birthYear) {
    return Math.round(getTax(monthlyIncome*12, taxRate, year, birthYear).totalskatt/12);
  },
  //Details on all dedcutions and taxes given a yearly income.
  taxDetails: function(yearlyIncome, taxRate, year, birthYear) {
    return getTax(yearlyIncome, taxRate, year, birthYear);
  }
}

function getTax(income, taxRate, year, birthYear){
  this.income = Math.floor(income/100)*100
  this.taxRate = taxRate || 0.32;
  if(year < 2016 || year >2017 || year == undefined){
    year = new Date().getFullYear();
  }
  this.pbb = pbbList[year];
  this.ibb = ibbList[year];
  this.brytpunkt20 = brytpunkt20List[year];
  this.brytpunkt25 = brytpunkt25List[year];
  this.birthYear = birthYear || 0;
  var age = new Date().getFullYear() - birthYear;
  var grund = grundavdrag(income, age);
  var pension = pensionsAvgift(income);
  if(income > grund){
    if(age >= 65)
      var jobb = 0;
    else
      var jobb = jobbskatteavdrag(income, grund, pension);
    var kommunal= kommunalSkatt(income, grund);
  } else {
    var jobb = kommunal = 0;
  }
  var statlig = statligSkatt(income, grund);
  var totalTax = Math.round(statlig + kommunal - jobb);
  return {
    inkomst: income,
    grundavdrag: grund,
    pensionsavgift: pension,
    jobbskatteavdrag: jobb,
    kommunalskatt: kommunal,
    statligskatt: statlig,
    totalskatt: totalTax
  }
}

//https://www4.skatteverket.se/rattsligvagledning/27071.html?date=2016-01-01#section63-3

function grundavdrag(income, age){
  var percentPBB = income/pbb;
  var extraAvdrag = 0;
  var basePBB = 0;
  if(percentPBB <= 0.99){
    basePBB = 0.423
  } else if(percentPBB <= 2.72){
    extraAvdrag = (income-0.99*pbb)*0.2;
    basePBB = 0.423;
  } else if (percentPBB <= 3.11) {
    basePBB = 0.77;
  } else if (percentPBB <= 7.88) {
    extraAvdrag = -(income-3.11*pbb)*0.1;
    basePBB = 0.77;
  } else {
    basePBB = 0.293
  }
  var pensionAdjustment = 0;
  if(age > 65){
    if(percentPBB <= 0.99){
      pensionAdjustment = 0.682*pbb;
    } else if(percentPBB <= 1.11){
      pensionAdjustment = 0.885*pbb-0.2*income;
    }else if(percentPBB <= 2.72){
      pensionAdjustment = 0.609*pbb+0.049*income;
    } else if (percentPBB <= 3.11) {
      pensionAdjustment = 0.741*pbb;
    } else if (percentPBB <= 3.77) {
      pensionAdjustment = -0.430*pbb+0.1*income;
    } else if (percentPBB <= 5.4) {
      pensionAdjustment = 0.807*pbb
    } else if (percentPBB <= 7.88) {
      pensionAdjustment = 0.753*pbb+0.01*income;
    } else if (percentPBB <= 12.43) {
      pensionAdjustment = 1.541*pbb-0.09*income;
    } else {
      pensionAdjustment = 0.422*pbb;
    }
  }
  return Math.ceil((basePBB*pbb+extraAvdrag+pensionAdjustment)/100)*100;
}

//kommunalSkatt is kommunal- och landstingskatt.
function kommunalSkatt(income, grundavdrag){
  var baseTax = (income - grundavdrag)*taxRate;
  return Math.round(baseTax);
}

//Get "jobbskatteavdrag".
function jobbskatteavdrag(income, grundavdrag, pensionsAvgift){
  var percentPBB = income/pbb;
  var jobReduction = 0;
  if (percentPBB <= 0.91) {
      jobReduction = (income - grundavdrag)*taxRate;
  } else if (percentPBB <= 2.94) {
      jobReduction = (0.91*pbb+0.332*(income-0.91*pbb)-grundavdrag)*taxRate;
  } else if (percentPBB <= 8.08) {
      jobReduction = (1.584*pbb+0.111*(income-2.94*pbb)-grundavdrag)*taxRate;
  } else if (percentPBB <= 13.54) {
      jobReduction = (2.155*pbb - grundavdrag)*taxRate;
  } else {
      jobReduction = (2.155*pbb - grundavdrag)*taxRate-(income-13.54*pbb)*0.03;
  }
  //Total reductions can not exceed total tax.
  if(jobReduction + pensionsAvgift > taxRate*(income-grundavdrag)){
    jobReduction = taxRate*(income-grundavdrag) - pensionsAvgift;
  }
  return Math.floor(jobReduction/10)*10;
}

//Calculates state tax, given income and grundavdrag.
function statligSkatt(income, grundavdrag){
  var statligSkatt_res = 0;
  var taxableIncome = income - grundavdrag;
  if(taxableIncome > brytpunkt20){
    statligSkatt_res = (taxableIncome - brytpunkt20)*0.2;
    if (taxableIncome > brytpunkt25) {
      statligSkatt_res += (taxableIncome - brytpunkt25)*0.05;
    }
  }
  return statligSkatt_res;
}

/*
  Calculates "Allmän pensionsavgift" for a given income.
  The whole fee is deducted and thus have no direct impact on the total tax,
  it does however count as a deduction and thus limits other deductions.
  https://www4.skatteverket.se/rattsligvagledning/edition/2014.1/1348.html
*/
function pensionsAvgift(income){
  if(income > 8.07*ibb){
    return roundDownFrom50To100(0.07*8.07*ibb);
  } else {
    return roundDownFrom50To100(0.07*income);
  }
}

function roundDownFrom50To100(num){
  if(num / 10 > 50){
    return Math.round(num/100)*100;
  } else {
    return Math.floor(num/100)*100;
  }
}
