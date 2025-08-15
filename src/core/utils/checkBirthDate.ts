import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function IsBeforeToday(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isBeforeToday',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!value) return true;
                    const date = new Date(value);
                    const now = new Date();
                    return date < now;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} phải nhỏ hơn ngày hiện tại`;
                },
            },
        });
    };
}
