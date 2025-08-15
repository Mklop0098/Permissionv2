import errorMessages from "@core/config/constants";
import { HttpException } from "@core/exceptions";
import path from 'path';
import fs from 'fs';
import axios from "axios";
import { withTransaction } from "./withTransaction";
import { PoolConnection } from "mysql2/promise";
export const createFolder = async (
    folder_name: string,
    file_name: string,
    source: string,
    file: Express.Multer.File,
    type: string,
    order_id: string,
    parent_id?: string,
    conn?: PoolConnection
) => {
    try {
        return await withTransaction(async (connection) => {
            const basePath = path.resolve(__dirname, '../../../uploads');
            const sourcePath = path.join(basePath, source, type);
            const targetPath = path.join(sourcePath, folder_name);

            // Tạo thư mục nếu chưa tồn tại
            if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });

            const ext = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
            let baseName = file_name;
            let finalFileName = `${baseName}${ext}`;
            let counter = 1;

            // Nếu file tồn tại, tăng số thứ tự
            while (fs.existsSync(path.join(targetPath, finalFileName))) {
                finalFileName = `${baseName}_${counter}${ext}`;
                counter++;
            }

            const uploadPath = path.join(targetPath, finalFileName);

            // Ghi file & thumbnail
            fs.writeFileSync(uploadPath, file.buffer);

            // Gọi upload
            const fileBuffer = fs.readFileSync(uploadPath);
            const blob = new Blob([fileBuffer], { type: file.mimetype });
            const uploadResult = await upload(
                [blob],         // gửi 1 file
                type,
                folder_name,
                path.parse(finalFileName).name,  // không có đuôi
                source,
                order_id,
                '0', // width
                '0', // height
                parent_id,
                connection
            );

            // Xoá file sau khi upload thành công
            fs.unlinkSync(uploadPath);

            // Xoá toàn bộ folder gốc (bao gồm thumbnails)
            fs.rmSync(targetPath, { recursive: true, force: true });

            return uploadResult;

        }, conn)


    } catch (error) {
        console.error('Create folder error:', error);
        return new HttpException(400, errorMessages.UPLOAD_FAILED);
    }
};

export const upload = async (files: Blob[], type: string, folder_name: string, file_name: string, source: string, order_id: string, width: string, height: string, parent_id?: string, conn?: PoolConnection) => {
    return await withTransaction(async (connection) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        })
        formData.append('type', type);
        formData.append('folder_name', folder_name);
        formData.append('file_name', file_name);
        formData.append('source', source);
        formData.append('width', width);
        formData.append('height', height);
        formData.append('order_id', order_id);
        if (parent_id) {
            formData.append('parent_id', parent_id);
        }
        const response = await axios.post(process.env.UPLOAD_SERVICE_URL as string, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data
    }, conn)
}

export const getImage = async (id: string, source: string, type: string) => {
    if (!id || !source || !type) return []
    try {
        const response = await axios.get(`${process.env.UPLOAD_SERVICE_URL}?folder=${id}&type=${type}&source=${source}`);
        if (response.data.statusCode === 200) {
            return response.data.data
        }
        return []
    } catch (error) {
        return []
    }
}

export const deleteOneImage = async (id: string, conn?: PoolConnection) => {
    return await withTransaction(async (connection) => {
        if (!id) return []
        const response = await axios.delete(`${process.env.UPLOAD_SERVICE_URL}/delete/${id}`);
        return response.data
    }, conn)
}

export const deleteAllImage = async (id: string, source: string, type: string) => {
    if (!id) return []
    try {
        const response = await axios.delete(`${process.env.UPLOAD_SERVICE_URL}/delete-all/${id}?source=${source}&type=${type}`);
        if (response.data.statusCode === 200) {
            return response.data.data
        }
        return []
    } catch (error) {
        return new HttpException(400, errorMessages.DELETE_FAILED)
    }
}

export const updateImageSubProduct = async (
    folder_name: string,
    file_name: string,
    source: string,
    type: string,
    id: string,
    parent_id?: string) => {
    console.log(folder_name, file_name, source, type, id, parent_id)
    try {
        const response = await axios.put(`${process.env.UPLOAD_SERVICE_URL}/update-sub-product/${id}`, {
            folder_name,
            file_name,
            source,
            type,
            parent_id
        });
        return response.data
    } catch (error) {
        return new HttpException(400, errorMessages.UPDATE_FAILED)
    }
}

export const updateEvaluateImage = async (folder_name: string[], order_id: string, new_folder_name: string, conn?: PoolConnection) => {
    return withTransaction(async (connection) => {
        const response = await axios.put(`${process.env.UPLOAD_SERVICE_URL}/update-evaluate-image`, {
            order_id,
            folder_name,
            new_folder_name
        });
        if (response.data.statusCode !== 200) {
            throw new HttpException(400, response.data.message || 'Server CDN không phản hồi')
        }
        return response.data
    }, conn)
}