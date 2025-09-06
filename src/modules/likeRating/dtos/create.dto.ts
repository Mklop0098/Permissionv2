import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class LikeRating {
    @IsNumber()
    @IsNotEmpty({ message: 'Không tìm thấy đánh giá' })
    evaluate_id?: number;

    customer_id?: number;    

    @IsNumber()
    @IsNotEmpty({ message: 'Không tìm thấy sản phẩm' })
    product_id?: number;
    source?: string;

    constructor(evaluate_id: number, customer_id: number, product_id: number, source?: string) {
        this.evaluate_id = evaluate_id;
        this.customer_id = customer_id;
        this.product_id = product_id;
        this.source = source;
    }
}
