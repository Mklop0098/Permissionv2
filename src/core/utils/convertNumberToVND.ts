const docso = require('docso');

export const convertNumberToVND = (number: number): string => {
    let text = docso(number);
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return `${text} đồng`;
}


export const convertNumberToVNDDot = (amount: number): string => {
    return amount.toLocaleString('vi-VN') + ' VND';
}