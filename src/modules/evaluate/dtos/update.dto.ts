import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class Update {
    order_id?: number;

    @IsNotEmpty({ message: 'Vui lòng nhập đánh giá' })
    detail_rating?: string

    customer_id?: number;

    source?: string

    constructor(order_id: number, source?: string, detail_rating?: string, customer_id?: number) {
        this.order_id = order_id;
        this.source = source;
        this.detail_rating = detail_rating;
        this.customer_id = customer_id;
    }
}
