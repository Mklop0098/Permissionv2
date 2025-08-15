import { HttpException } from "@core/exceptions";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import axios from "axios";
import errorMessages from "@core/config/constants";

export namespace UploadImage {
    let files: Blob[] = []

    export const upload = async(type: string, folder_name: string, file_name: string, source: string, width: string, height: string, parent_id?: string) => {
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
        if (parent_id) {
            formData.append('parent_id', parent_id);
        }
        const response = await axios.post(process.env.UPLOAD_SERVICE_URL as string, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data
    }
    export const createFolderIfNotExist = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    export const deleteFileIfExist = (filePath: string) => {
        //console.log(filePath)
        try {
            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                //console.log(`Xóa file thành công: ${filePath}`);
            }
        } catch (error) {
            console.error(`Lỗi khi xóa file ${filePath}:`, error);
        }
    };

    export const uploadImage = async (file: Express.Multer.File, file_name: string, type: string) => {
        let userDir: string;
        switch (type) {
            case 'product':
                userDir = path.join(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH as string);
                break;
            case 'category':
                userDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string);
                break;
            default:
                return new HttpException(400, errorMessages.INVALID_FILE);
        }
        const thumbailDir = path.join(userDir, 'thumbnails');

        let fileExtension: string;
        switch (file.mimetype) {
            case 'image/jpeg':
                fileExtension = '.jpeg';
                break;
            case 'image/jpg':
                fileExtension = '.jpg';
                break;
            case 'image/png':
                fileExtension = '.png';
                break;
            default:
                return new HttpException(400, errorMessages.INVALID_FILE);
        }
        UploadImage.createFolderIfNotExist(userDir)
        UploadImage.createFolderIfNotExist(thumbailDir)
        
        const uploadPath = path.join(userDir, `${file_name}${fileExtension}`)
        const thumbailPath = path.join(thumbailDir, `${file_name}${fileExtension}`)
        console.log(uploadPath)
        console.log(thumbailPath)

        //check 
        const metadata = await sharp(file.buffer)
            .rotate().metadata();
        const upload = await sharp(file.buffer).toFile(uploadPath)
        if (upload) {
            files = []
            await sharp(file.buffer)
                .withMetadata()
                .rotate()
                .toFile(uploadPath);
            await sharp(file.buffer).
                resize(350, 350)
                .rotate()
                .toFile(path.join(thumbailDir, `${file_name}${fileExtension}`));

            const fileBuffer = fs.readFileSync(uploadPath);
            const fileBlob = new Blob([fileBuffer], { type: file.mimetype });
            files.push(fileBlob)
            UploadImage.deleteFileIfExist(uploadPath)
            UploadImage.deleteFileIfExist(thumbailPath)
        }
        return new HttpException(400, errorMessages.UPLOAD_FAILED);
    }
    export const removeVietnameseAccents = (str: string) => {
        const vietnameseAccents = 'àáạảãâấầẩẫậăắằẳẵặèéẹẻẽêếềểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳýỵỷỹđ';
        const replacement = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiiooooooooooooouuuuuuuuuuuyyyyyd';
        return str
            .split('')
            .map(char => {
                const index = vietnameseAccents.indexOf(char);
                return index !== -1 ? replacement[index] : char;
            })
            .join('')
    }
    export const convertToImageName = (name: string, listImage: any, num?: number) => {
        const generateRandomString = () => {
            return [...Array(32)]
                .map(() => Math.floor(Math.random() * 16).toString(16))
                .join('');
        };
    
        const imageNames = listImage.map(() => {
            return generateRandomString();
        });
    
        return imageNames;
    };
    export const awaitUploadImage = async (listImage: any, imageNames: string[], type: string, folder_name: string, file_name: string, source: string, width: string, height: string, parent_id?: string) => {
        // type: product, category
        const awaitUploadImage = listImage.map(async (file: any, index: number) => {
            const upload = await UploadImage.uploadImage(file, imageNames[index] as string, type);
            return upload
        })
        await Promise.all(awaitUploadImage)
        return await UploadImage.upload(type, folder_name, file_name, source, width || '350', height || '350', parent_id)
    }
    
    export const getImage = async (module_id: string, module_code: string) => {
        const response = await axios.get(`${process.env.UPLOAD_SERVICE_URL}/find-by-moduleId/${module_id}`)
        return response.data
    }      
    export const deleteImage = async (module_id: string | number, module_code: string | number) => {
        const response = await axios.delete(`${process.env.UPLOAD_SERVICE_URL}/delete-by-moduleid/${module_id}`)
        return response.data
    }

    export const runWithLimit = async <T>(
        tasks: (() => Promise<T>)[],
        limit: number
    ): Promise<T[]> => {
        const results: T[] = [];
        let i = 0;
    
        async function worker() {
            while (i < tasks.length) {
                const currentIndex = i++;
                results[currentIndex] = await tasks[currentIndex]();
            }
        }
    
        const workers = Array.from({ length: limit }, () => worker());
        await Promise.all(workers);
        return results;
    }

    export const deleteOneImage = async (id: number, module_code: string) => {
        const response = await axios.delete(`${process.env.UPLOAD_SERVICE_URL}/delete/${id}`)
        return response.data
    }

    export const uploadFile = async(fileInput: any, type: string, folder_name: string, file_name: string, source: string, width: string, height: string, parent_id?: string) => {
        const formData = new FormData();
        fileInput.forEach((file: any) => {
            formData.append('files', file);
        })
        formData.append('type', type);
        formData.append('folder_name', folder_name);
        formData.append('file_name', file_name);
        formData.append('source', source);
        formData.append('width', width);
        formData.append('height', height);
        if (parent_id) {
            formData.append('parent_id', parent_id);
        }
        const response = await axios.post(process.env.UPLOAD_SERVICE_URL as string, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data

    }
}

