class HttpException extends Error {
    public status: number;
    public message: string;
    public field?: string

    constructor(status: number, message: string, field?: string) {
        super(message);
        this.status = status;
        this.message = message;
        this.field = field;
        Object.setPrototypeOf(this, HttpException.prototype);
    }

    public getResponse() {
        return {
            status: this.status,
            error: {
                field: this.field,
                message: this.message
            }
        }
    }
}
export default HttpException;