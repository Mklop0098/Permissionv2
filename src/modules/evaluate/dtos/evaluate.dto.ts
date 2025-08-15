import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class Evaluate {
    @IsNumber()
    @IsNotEmpty({ message: 'Không tìm thấy sản phẩm' })
    product_id?: number;

    @IsNumber()
    @IsNotEmpty({ message: 'Đánh giá không được để trống' })
    rating?: number;

    @IsString()
    @IsOptional()
    comment?: string;    

    photos?: string[];

    constructor(product_id: number, rating: number, comment: string, photos?: string[]) {
        this.product_id = product_id;
        this.rating = rating;
        this.comment = comment;
        this.photos = photos;
    }
}
