export default interface Ilog {
    action: string;
    user_id: number;
    module_id: number;
    des?: any,
    reference_id?: number,
    reason?: string,
    seller_id?: number
}