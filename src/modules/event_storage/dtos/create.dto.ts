import { IsBoolean, IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class Create {
    table_name?: string;
    event_type?: string;
    data?: any;
    transaction_code?: string;

    constructor(
        table_name: string,
        event_type: string,
        data: any,
        transaction_code: string,
    ) {
        this.table_name = table_name;
        this.event_type = event_type;
        this.data = data;
        this.transaction_code = transaction_code;
    }

}