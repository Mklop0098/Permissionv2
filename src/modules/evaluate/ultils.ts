import { getCityMap, getWardMap } from "@core/utils/getAddress";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import moment from "moment";
import { HttpException } from "@core/exceptions";
import { checkExistConn } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import axios from "axios";
import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';

const threshold = 0.9;

const labels: any[] = [
    'identity_attack',
    'insult',
    'obscene',
    'severe_toxicity',
    'sexual_explicit',
    'threat',
    'toxicity'
  ];
  

export const checkToxic = async (text: string) => {
    const model = await toxicity.load(threshold, labels);
    const predictions = await model.classify([text]);
  
    // Log kết quả
    predictions.forEach((prediction) => {
      console.log(prediction.results[0].match);
    });

    const isToxic = predictions.some(
        (prediction) => prediction.results[0].match
    );
  
    return isToxic;
}

export const enrichCustomerAddresses = async (customers: any[]) => {
    // Gom tất cả địa chỉ từ nhiều customer
    const allAddresses = customers.flatMap((item: any) =>
        JSON.parse(item.customer_address || '[]')
    );

    const cityIds = [...new Set(allAddresses.map((a: any) => a.city_id))];
    const wardIds = [...new Set(allAddresses.map((a: any) => a.ward_id))];

    const [cityMap, wardMap] = await Promise.all([
        getCityMap(cityIds),
        getWardMap(wardIds),
    ]);

    return customers.map((item: any) => {
        const customerAddress = JSON.parse(item.customer_address || '[]');
        const address = customerAddress.map((addr: any) => ({
            ...addr,
            city_name: cityMap.get(addr.city_id) || null,
            ward_name: wardMap.get(addr.ward_id) || null,
        }));
        return {
            ...item,
            birthdate: item.birthdate ? moment(item.birthdate).format('YYYY-MM-DD') : null,
            customer_address: address,
        };
    });
};

export const checkExistInput = async (conn: PoolConnection, phone: string, email: string, name: string) => {
    try {
        const error: { field: string, message: string }[] = []
        if (!name) {
            error.push({ field: 'name', message: 'Tên khách hàng không được để trống' });
        }
        if (!phone) {
            error.push({ field: 'phone', message: 'Số điện thoại không được để trống' });
        }
        if (!email) {
            error.push({ field: 'email', message: 'Email không được để trống' });
        }
        const existPhone = await checkExistConn(conn, 'customers', 'phone', phone);
        if (existPhone) {
            error.push({ field: 'phone', message: 'Số điện thoại đã tồn tại' });
        }
        const existEmail = await checkExistConn(conn, 'customers', 'email', email);
        if (existEmail) {
            error.push({ field: 'email', message: 'Email đã tồn tại' });
        }
        if (error.length > 0) {
            throw new HttpException(400, JSON.stringify(error));
        }
    } catch (error: any) {
        throw new HttpException(400, error.message, error.field);
    }
}

export const checkExistProfile = async (conn: PoolConnection, seller_id: number, created_id: number, phone: string, email: string) => {
    try {
        const errors: any[] = []
        const [checkPhone] = await conn.query<RowDataPacket[]>(`
                SELECT id FROM customers
                WHERE phone = ? 
                ${seller_id ? `and seller_id = ?` : 'and seller_id is null'}
                ${created_id ? `and created_id = ?` : 'and created_id is null'}
            `, [phone, seller_id, created_id]);
        if (checkPhone.length > 0) {
            errors.push({ field: 'phone', message: errorMessages.PHONE_EXISTED });
        }
        if (email != undefined) {
            const [checkEmail] = await conn.query<RowDataPacket[]>(`SELECT id FROM customers WHERE email = ? 
                ${seller_id ? `and seller_id = ?` : 'and seller_id is null'}
                ${created_id ? `and created_id = ?` : 'and created_id is null'}
                `, [email, seller_id, created_id]);
            if (checkEmail.length > 0) {
                errors.push({ field: 'email', message: errorMessages.EMAIL_EXISTED });
            }
        }
        if (errors.length > 0) {
            return errors
        }
    } catch (error: any) {
        throw new HttpException(400, error.message, error.field);
    }
}

export const checkExistOrder = async (order_id: number, customer_id: number) => {
    try {
        const checkOrder = await axios.get(`${process.env.ORDER_URL}/orders/${order_id}`);
        if (checkOrder.data.length === 0) {
            throw new HttpException(400, 'Không tìm thấy đơn hàng');
        }

        // if (checkOrder.data.customer_id !== customer_id) {
        //     throw new HttpException(400, 'Khách hàng không được đánh giá đơn hàng này');
        // }

        if (checkOrder.data.status === 6) {
            throw new HttpException(400, 'Đơn hàng đã bị hủy không thể đánh giá');
        }
        return checkOrder.data;
    } catch (error: any) {
        console.log(error)
        throw new HttpException(400, error.message);
    }
}

export const getProduct = async (product_id: number) => {
    try {
        const product = await axios.get(`${process.env.PRODUCT_URL}/products/evaluate-get-product/${product_id}`);
        return product.data.data;
    } catch (error: any) {
        throw new HttpException(400, "Không tìm thấy sản phẩm trong đơn hàng, Vui lòng thử lại");
    }
}


