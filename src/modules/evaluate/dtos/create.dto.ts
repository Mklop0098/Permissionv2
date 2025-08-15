import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Evaluate } from "./evaluate.dto";
import { Type } from "class-transformer";

export class Create {
    @IsString()
    @IsNotEmpty({ message: 'Không tìm thấy đơn hàng' })
    order_id?: number;

    @IsNotEmpty({ message: 'Vui lòng nhập đánh giá' })
    detail_rating?: string

    @IsNumber()
    @IsOptional()
    customer_id?: number;

    source?: string

    constructor(order_id: number, source?: string, detail_rating?: string, customer_id?: number) {
        this.order_id = order_id;
        this.source = source;
        this.detail_rating = detail_rating;
        this.customer_id = customer_id;
    }
}
