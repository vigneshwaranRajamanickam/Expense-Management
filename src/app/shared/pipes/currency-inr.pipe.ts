import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyInr',
  standalone: true
})
export class CurrencyInrPipe implements PipeTransform {
  transform(value: number | null | undefined, showDecimals: boolean = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '₹0' + (showDecimals ? '.00' : '');
    }

    const isNegative = value < 0;
    const absVal = Math.abs(value);
    
    // Format to 2 decimal places
    const fixed = absVal.toFixed(2);
    const [integerPart, decimalPart] = fixed.split('.');

    // Indian Numbering System formatting logic
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    const decimalStr = showDecimals ? `.${decimalPart}` : '';
    const sign = isNegative ? '-' : '';

    return `${sign}₹${formattedInteger}${decimalStr}`;
  }
}
