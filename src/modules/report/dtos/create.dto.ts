import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class Report {
    @IsNumber()
    @IsNotEmpty({ message: 'Không tìm thấy đánh giá' })
    evaluate_id?: number;

    repoter_id?: number;    

    @IsNumber()
    @IsNotEmpty({ message: 'Không tìm thấy lý do' })
    reason_id?: number;

    detail?: string;

    constructor(evaluate_id: number, repoter_id: number, reason_id: number, detail?: string) {
        this.evaluate_id = evaluate_id;
        this.repoter_id = repoter_id;
        this.reason_id = reason_id;
        this.detail = detail;
    }
}
