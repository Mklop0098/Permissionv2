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
        if (checkOrder.data.statusCode !== 200) {
            throw new HttpException(400, 'Không tìm thấy đơn hàng');
        }
        if (checkOrder.data.data.customer_id !== customer_id) {
            throw new HttpException(400, 'Khách hàng không được đánh giá đơn hàng này');
        }
        if (checkOrder.data.data.status !== 5 && checkOrder.data.data.status !== 6) {
            throw new HttpException(400, 'Đơn hàng chưa hoàn thành không thể đánh giá');
        }
        if (checkOrder.data.data.status === 6) {
            throw new HttpException(400, 'Đơn hàng đã bị hủy không thể đánh giá');
        }
        return checkOrder.data.data;
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

export const getCustomer = async (customer_id: number) => {
    try {
        const customer = await axios.get(`${process.env.ORDER_URL}/users/get-user-by-id/${customer_id}`);
        return customer.data.data;
    } catch (error: any) {
        throw new HttpException(400, "Không tìm thấy khách hàng");
    }
}


export const toxic_words = [
    "buồi",
    "buoi",
    "dau buoi",
    "daubuoi",
    "caidaubuoi",
    "nhucaidaubuoi",
    "dau boi",
    "bòi",
    "dauboi",
    "caidauboi",
    "đầu bòy",
    "đầu bùi",
    "dau boy",
    "dauboy",
    "caidauboy",
    "b`",
    "cặc",
    "cak",
    "kak",
    "kac",
    "cac",
    "concak",
    "nungcak",
    "bucak",
    "caiconcac",
    "caiconcak",
    "cu",
    "cặk",
    "cak",
    "dái",
    "giái",
    "zái",
    "kiu",
    "cứt",
    "cuccut",
    "cutcut",
    "cứk",
    "cuk",
    "cười ỉa",
    "cười ẻ",
    "đéo",
    "đếch",
    "đếk",
    "dek",
    "đết",
    "đệt",
    "đách",
    "dech",
    "đ'",
    "deo",
    "d'",
    "đel",
    "đél",
    "del",
    "dell ngửi",
    "dell ngui",
    "dell chịu",
    "dell chiu",
    "dell hiểu",
    "dell hieu",
    "dellhieukieugi",
    "dell nói",
    "dell noi",
    "dellnoinhieu",
    "dell biết",
    "dell biet",
    "dell nghe",
    "dell ăn",
    "dell an",
    "dell được",
    "dell duoc",
    "dell làm",
    "dell lam",
    "dell đi",
    "dell di",
    "dell chạy",
    "dell chay",
    "deohieukieugi",
    "địt",
    "đm",
    "dm",
    "đmm",
    "dmm",
    "đmmm",
    "dmmm",
    "đmmmm",
    "dmmmm",
    "đmmmmm",
    "dmmmmm",
    "đcm",
    "dcm",
    "đcmm",
    "dcmm",
    "đcmmm",
    "dcmmm",
    "đcmmmm",
    "dcmmmm",
    "đệch",
    "đệt",
    "dit",
    "dis",
    "diz",
    "đjt",
    "djt",
    "địt mẹ",
    "địt mịe",
    "địt má",
    "địt mía",
    "địt ba",
    "địt bà",
    "địt cha",
    "địt con",
    "địt bố",
    "địt cụ",
    "dis me",
    "disme",
    "dismje",
    "dismia",
    "dis mia",
    "dis mie",
    "đis mịa",
    "đis mịe",
    "ditmemayconcho",
    "ditmemay",
    "ditmethangoccho",
    "ditmeconcho",
    "dmconcho",
    "dmcs",
    "ditmecondi",
    "ditmecondicho",
    "đụ",
    "đụ mẹ",
    "đụ mịa",
    "đụ mịe",
    "đụ má",
    "đụ cha",
    "đụ bà",
    "đú cha",
    "đú con mẹ",
    "đú má",
    "đú mẹ",
    "đù cha",
    "đù má",
    "đù mẹ",
    "đù mịe",
    "đù mịa",
    "đủ cha",
    "đủ má",
    "đủ mẹ",
    "đủ mé",
    "đủ mía",
    "đủ mịa",
    "đủ mịe",
    "đủ mie",
    "đủ mia",
    "đìu",
    "đờ mờ",
    "đê mờ",
    "đờ ma ma",
    "đờ mama",
    "đê mama",
    "đề mama",
    "đê ma ma",
    "đề ma ma",
    "dou",
    "doma",
    "duoma",
    "dou má",
    "duo má",
    "dou ma",
    "đou má",
    "đìu má",
    "á đù",
    "á đìu",
    "đậu mẹ",
    "đậu má",
    "đĩ",
    "di~",
    "đuỹ",
    "điếm",
    "cđĩ",
    "cdi~",
    "đilol",
    "điloz",
    "đilon",
    "diloz",
    "dilol",
    "dilon",
    "condi",
    "condi~",
    "dime",
    "di me",
    "dimemay",
    "condime",
    "condimemay",
    "con di cho",
    "con di cho'",
    "condicho",
    "bitch",
    "biz",
    "bít chi",
    "con bích",
    "con bic",
    "con bíc",
    "con bít",
    "phò",
    "4`",
    "lồn",
    "l`",
    "loz",
    "lìn",
    "nulo",
    "ml",
    "matlon",
    "cailon",
    "matlol",
    "matloz",
    "thml",
    "thangmatlon",
    "thangml",
    "đỗn lì",
    "tml",
    "thml",
    "diml",
    "dml",
    "hãm",
    "xàm lol",
    "xam lol",
    "xạo lol",
    "xao lol",
    "con lol",
    "ăn lol",
    "an lol",
    "mát lol",
    "mat lol",
    "cái lol",
    "cai lol",
    "lòi lol",
    "loi lol",
    "ham lol",
    "củ lol",
    "cu lol",
    "ngu lol",
    "tuổi lol",
    "tuoi lol",
    "mõm lol",
    "mồm lol",
    "mom lol",
    "như lol",
    "nhu lol",
    "nứng lol",
    "nung lol",
    "nug lol",
    "nuglol",
    "rảnh lol",
    "ranh lol",
    "đách lol",
    "dach lol",
    "mu lol",
    "banh lol",
    "tét lol",
    "tet lol",
    "vạch lol",
    "vach lol",
    "cào lol",
    "cao lol",
    "tung lol",
    "mặt lol",
    "mát lol",
    "mat lol",
    "xàm lon",
    "xam lon",
    "xạo lon",
    "xao lon",
    "con lon",
    "ăn lon",
    "an lon",
    "mát lon",
    "mat lon",
    "cái lon",
    "cai lon",
    "lòi lon",
    "loi lon",
    "ham lon",
    "củ lon",
    "cu lon",
    "ngu lon",
    "tuổi lon",
    "tuoi lon",
    "mõm lon",
    "mồm lon",
    "mom lon",
    "như lon",
    "nhu lon",
    "nứng lon",
    "nung lon",
    "nug lon",
    "nuglon",
    "rảnh lon",
    "ranh lon",
    "đách lon",
    "dach lon",
    "mu lon",
    "banh lon",
    "tét lon",
    "tet lon",
    "vạch lon",
    "vach lon",
    "cào lon",
    "cao lon",
    "tung lon",
    "mặt lon",
    "mát lon",
    "mat lon",
    "cái lờ",
    "cl",
    "clgt",
    "cờ lờ gờ tờ",
    "cái lề gì thốn",
    "đốn cửa lòng",
    "sml",
    "sapmatlol",
    "sapmatlon",
    "sapmatloz",
    "sấp mặt",
    "sap mat",
    "vlon",
    "vloz",
    "vlol",
    "vailon",
    "vai lon",
    "vai lol",
    "vailol",
    "nốn lừng",
    "vcl",
    "vl",
    "vleu",
    "chịch",
    "chich",
    "vãi",
    "v~",
    "đụ",
    "nứng",
    "nug",
    "đút đít",
    "chổng mông",
    "banh háng",
    "xéo háng",
    "xhct",
    "xephinh",
    "la liếm",
    "đổ vỏ",
    "xoạc",
    "xoac",
    "chich choac",
    "húp sò",
    "fuck",
    "fck",
    "đụ",
    "bỏ bú",
    "buscu",
    "ngu",
    "óc chó",
    "occho",
    "lao cho",
    "láo chó",
    "bố láo",
    "chó má",
    "cờ hó",
    "sảng",
    "thằng chó",
    "thang cho'",
    "thang cho",
    "chó điên",
    "thằng điên",
    "thang dien",
    "đồ điên",
    "sủa bậy",
    "sủa tiếp",
    "sủa đi",
    "sủa càn",
    "mẹ bà",
    "mẹ cha mày",
    "mẹ mày",
    "cha mày",
    "lò",
    "me cha may",
    "mẹ cha anh",
    "mẹ cha nhà anh",
    "mẹ cha nhà mày",
    "me cha nha may",
    "mả cha mày",
    "mả cha nhà mày",
    "ma cha may",
    "ma cha nha may",
    "mả mẹ",
    "mả cha",
    "kệ mẹ",
    "kệ mịe",
    "kệ mịa",
    "kệ mje",
    "kệ mja",
    "ke me",
    "ke mie",
    "ke mia",
    "ke mje",
    "ke mja",
    "bỏ mẹ",
    "bỏ mịa",
    "bỏ mịe",
    "bỏ mja",
    "bỏ mje",
    "bo me",
    "bo mia",
    "bo mie",
    "bo mje",
    "bo mja",
    "chetme",
    "chet me",
    "chết mẹ",
    "chết mịa",
    "chết mja",
    "chết mịe",
    "chết mie",
    "chet mia",
    "chet mje",
    "chet mja",
    "thấy mẹ",
    "thấy mịe",
    "thấy mịa",
    "thay me",
    "thay mie",
    "thay mia",
    "tổ cha",
    "bà cha mày",
    "cmn",
    "cmnl",
    "tiên sư nhà mày",
    "tiên sư bố",
    "tổ sư"
]