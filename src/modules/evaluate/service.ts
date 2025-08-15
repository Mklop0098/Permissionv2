import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Create } from "./dtos/create.dto";
import EventStorageService from "@modules/event_storage/service";
import { withTransaction } from "@core/utils/withTransaction";

import { HttpException } from "@core/exceptions";
import errorMessages from "@core/config/constants";
import { createFolder, getImage, deleteOneImage } from "@core/utils/upload.imageCDN";
import { UploadImage } from "@core/utils/upload.image";
import { generateRandomCode16 } from "@core/utils/gennerate.code";
import { checkExistOrder, checkToxic, getProduct } from "./ultils";
import { Search } from "./dtos/search.dto";
import { caculatePagination } from "@core/utils/caculatePagination";
import LikeRatingServices from "@modules/likeRating/service";
import { Update } from "./dtos/update.dto";
class EvaluateServices {
    private tableName = 'evaluate';
    private eventStorageService = new EventStorageService();
    public likeRatingServices = new LikeRatingServices();
    public create = async (model: Create, listImageObject: any, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const order = await checkExistOrder(model.order_id!, model.customer_id!);
            const { seller_id } = order.data;
            const detail_rating: any[] = model.detail_rating ? JSON.parse(model.detail_rating) : [];
            const listImage = listImageObject?.files ?? listImageObject;
            if (detail_rating && detail_rating.length > 0) {
                await Promise.all(
                    detail_rating.map(async detail => {
                        const { product_id, rating, comment, photos } = detail;
                        const isToxic = await this.checkToxic(comment);
                        if (isToxic) {
                            throw new HttpException(400, "Comment is toxic", 'comment');
                        }
                        const query = `
                            INSERT INTO ${this.tableName} 
                            (order_id, customer_id, seller_id, source, product_id, rating, comment, has_photo) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        const [result] = await connection.execute<ResultSetHeader>(query, [
                            model.order_id,
                            model.customer_id,
                            seller_id,
                            process.env.SOURCE,
                            product_id,
                            rating,
                            comment || null,
                            (Array.isArray(listImage) && listImage.length > 0) ? 1 : 0
                        ]);
                        if (result.insertId && Array.isArray(listImage) && listImage.length > 0 && Array.isArray(photos) && photos.length > 0) {
                            listImage.map((img: any) => {
                                console.log(img.originalname?.trim())
                            })
                            const selectedImages = listImage.filter((img: any) =>
                                photos.some((p: string) => img.originalname?.trim() === p.trim())
                            );

                            if (selectedImages.length > 0) {
                                await this.upload(model.order_id!, selectedImages, result.insertId, connection);
                            }
                        }
                        return result;
                    })
                );
            }
        }, conn);
    };

    public upload = async (order_id: number, listImageObject: any, cmtId: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const folder_name = cmtId ? cmtId.toString() : generateRandomCode16();
            let listImage = listImageObject?.files ?? listImageObject;
            if (listImage !== undefined && listImage.length > 10)
                throw new HttpException(400, errorMessages.INVALID_FILE_QUANTITY, 'files');
            let imageNames;
            if (Array.isArray(listImage) && listImage.length > 0) {
                const maxFileSize = process.env.PRODUCT_UPLOAD_IMAGE_SIZE! as any as number;
                const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
                const isAllowedMimeType = listImage.every((file: any) => allowedMimeTypes.includes(file.mimetype));
                if (!isAllowedMimeType)
                    throw new HttpException(400, errorMessages.INVALID_FILE)
                if (listImage.some((file: any) => file.size > maxFileSize))
                    throw new HttpException(400, errorMessages.INVALID_FILE_SIZE)
                else imageNames = UploadImage.convertToImageName(generateRandomCode16(), listImage)
            }
            let result = [];
            if (Array.isArray(listImage) && listImage.length > 0) {
                for (let i = 0; i < listImage.length; i++) {
                    const res = await createFolder(folder_name, imageNames[i], process.env.SOURCE!, listImage[i], "evaluate", order_id.toString(), undefined, connection)
                    result.push(...res.data)
                }
            }
            return {
                folder_name: folder_name,
                files_name: result || []
            }
        }, conn);
    }

    public findByOrderId = async (order_id: number, customer_id: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            await checkExistOrder(order_id, customer_id);
            const query = `
                SELECT 
                    e.id,
                    e.product_id,
                    e.rating,
                    e.comment
                FROM ${this.tableName} e
                WHERE e.order_id = ?
            `;
            const [result] = await connection.execute<RowDataPacket[]>(query, [order_id]);
            if (result.length > 0) {
                await Promise.all(
                    result.map(async (item) => {
                        const photos = await getImage(item.id.toString(), process.env.SOURCE!, 'evaluate');
                        item.product = await getProduct(item.product_id);
                        if (photos && photos.photos.length > 0) {
                            item.photos = photos.photos
                        } else {
                            item.photos = [];
                        }
                    })
                );
            }
            return {
                data: result
            };
        }, conn);
    }

    public findAllByProductId = async (product_id: number, model: Search, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            let query = `
                SELECT
                    e.id,
                    e.product_id,
                    e.customer_id,
                    e.rating,
                    e.comment,
                    e.created_at,
                    e.usefull,
                    e.seller_reply
                FROM ${this.tableName} e
                WHERE e.product_id = ? 
                ${model.has_comment ? ' AND e.comment IS NOT NULL' : ''}  
                ${model.rating ? ` AND e.rating = ${model.rating}` : ''}
                ${model.has_photo ? ' AND e.has_photo = 1' : ''}
            `;
            const [count] = await connection.execute<RowDataPacket[]>(query, [product_id]);

            if (model.page && model.limit) {
                query += ` LIMIT ${model.limit} OFFSET ${(model.page - 1) * model.limit}`;
            }

            const [result] = await connection.execute<RowDataPacket[]>(query, [product_id]);
            if (result.length > 0) {
                await Promise.all(
                    result.map(async (item) => {
                        const { total_likes, user_liked } = await this.likeRatingServices.checkAlreadyLike(item.id, model.customer_id!, item.product_id);
                        const photos = await getImage(item.id.toString(), process.env.SOURCE!, 'evaluate')
                        item.total_likes = Number(total_likes);
                        item.user_liked = Number(user_liked);
                        item.photos = photos && photos.photos.length > 0 ? photos.photos : [];
                    })
                );
            }
            const finalData = model.has_photo
                ? result.filter(item => item.photos.length > 0)
                : result;

            return {
                data: finalData,
                pagination: caculatePagination(count.length, model.page!, model.limit!)
            };
        }, conn);
    }

    public update = async (model: Update, listImageObject: any, conn?: PoolConnection) => {
        // uploads/yomart/evaluate/1/cd9fd4d17c2c43ce49221ab13a4290c5.jpeg
        console.log(model, 'model')
        return await withTransaction(async (connection) => {
            const order = await checkExistOrder(model.order_id!, model.customer_id!);
            const detail_rating: any[] = model.detail_rating ? JSON.parse(model.detail_rating) : [];
            const listImage = listImageObject?.files ?? listImageObject;
            if (detail_rating && detail_rating.length > 0) {
                await Promise.all(
                    detail_rating.map(async detail => {
                        const { rating, comment, photos } = detail;
                        const isToxic = await this.checkToxic(comment);
                        if (isToxic) {
                            throw new HttpException(400, "Comment is toxic", 'comment');
                        }
                        const query = `
                            UPDATE ${this.tableName} 
                            SET rating = ?, comment = ?
                            WHERE id = ?
                        `;
                        console.log(query, 'query', rating, comment, detail.id)
                        const [result] = await connection.execute<ResultSetHeader>(query, [
                            rating,
                            comment,
                            detail.id
                        ]);
                        if (result.affectedRows > 0 && Array.isArray(listImage) && listImage.length > 0 && Array.isArray(photos) && photos.length > 0) {
                            const selectedImages = listImage.filter((img: any) =>
                                photos.some((p: string) => img.originalname?.trim() === p.trim())
                            );

                            if (selectedImages.length > 0) {
                                await this.upload(model.order_id!, selectedImages, detail.id, connection);
                            }
                        }
                        return result;
                    })
                );
            }
        }, conn);
    }

    public deleteOneImage = async (id: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            await deleteOneImage(id.toString(), connection);
        }, conn);
    }

    public deleteComment = async (id: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const query = `
                DELETE FROM ${this.tableName} 
                WHERE id = ?
            `;
            const [result] = await connection.execute<ResultSetHeader>(query, [id]);
            return result;
        }, conn);
    }

    public checkToxic = async (text: string, conn?: PoolConnection) => {
        try {

            if (!text || typeof text !== 'string') {
                throw new HttpException(400, "Invalid input. 'text' field is required and must be a string.", 'text');
            }

            const result = await checkToxic(text);
            console.log(result, 'result')
            return {
                isToxic: result
            };

        } catch (error) {
            console.error('Error checking toxicity:', error);

            throw new HttpException(500, "Error checking toxicity: " + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
    }
}

export default EvaluateServices;

