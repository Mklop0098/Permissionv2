
export class Search {
    page?: number;
    limit?: number;
    rating?: number;
    has_comment?: boolean;
    has_photo?: boolean;
    customer_id?: number;
    constructor(page?: number, limit?: number, rating?: number, has_comment?: boolean, has_photo?: boolean) {
        this.page = page;
        this.limit = limit;
        this.rating = rating;
        this.has_comment = has_comment;
        this.has_photo = has_photo;
    }
}
