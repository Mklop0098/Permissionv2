import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Create } from "./dtos/create.dto";
import EventStorageService from "@modules/event_storage/service";
import { withTransaction } from "@core/utils/withTransaction";

import { HttpException } from "@core/exceptions";
import errorMessages from "@core/config/constants";
import { createFolder, getImage, deleteOneImage } from "@core/utils/upload.imageCDN";
import { UploadImage } from "@core/utils/upload.image";
import { generateRandomCode16 } from "@core/utils/gennerate.code";
import { checkExistOrder, checkToxic, getCustomer, getProduct, toxic_words } from "./ultils";
import { Search } from "./dtos/search.dto";
import { caculatePagination } from "@core/utils/caculatePagination";
import LikeRatingServices from "@modules/likeRating/service";
import { Update } from "./dtos/update.dto";
class EvaluateServices {
    private tableName = 'evaluate';
    public likeRatingServices = new LikeRatingServices();
    public create = async (model: Create, listImageObject: any, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const order = await checkExistOrder(model.order_id!, model.customer_id!);
            const evaluated = await this.checkEvaluated(model.customer_id!, model.order_id!);
            if (evaluated.isEvaluated) {
                throw new HttpException(400, "Bạn đã đánh giá sản phẩm này");
            }
            const { seller_id } = order;
            const detail_rating: any[] = model.detail_rating ? JSON.parse(model.detail_rating) : [];
            const listImage = listImageObject?.files ?? listImageObject;
            if (detail_rating && detail_rating.length > 0) {
                await Promise.all(
                    detail_rating.map(async detail => {
                        const { product_id, rating, comment, photos } = detail;
                        const isToxic = toxic_words.some((word: string) => comment.toLowerCase().includes(word));
                        if (isToxic) {
                            throw new HttpException(400, "Bình luận chứa từ ngữ tiêu cực");
                        }
                        const query = `
                            INSERT INTO ${this.tableName} 
                            (order_id, customer_id, seller_id, source, product_id, rating, comment) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `;
                        const [result] = await connection.execute<ResultSetHeader>(query, [
                            model.order_id,
                            model.customer_id,
                            seller_id,
                            process.env.SOURCE,
                            product_id,
                            rating,
                            comment || null
                        ]);
                        if (result.insertId && Array.isArray(listImage) && listImage.length > 0 && Array.isArray(photos) && photos.length > 0) {
                            listImage.map((img: any) => {
                                console.log(img.originalname?.trim())
                            })
                            const selectedImages = listImage.filter((img: any) =>
                                photos.some((p: string) => img.originalname?.trim() === p.trim())
                            );

                            if (selectedImages.length > 0) {
                                console.log(process.env.UPLOAD_SERVICE_URL, 'process.env.UPLOAD_SERVICE_URL')
                                try {
                                    await this.upload(model.order_id!, selectedImages, result.insertId);
                                } catch (error: any) {
                                    throw new HttpException(400, "Upload ảnh thất bại, " + error.message)
                                }
                                await connection.execute<ResultSetHeader>(`UPDATE ${this.tableName} SET has_photo = 1 WHERE id = ?`, [result.insertId]);
                            }
                        }
                        return result;
                    })
                );
            }
        }, conn);
    };

    public upload = async (order_id: number, listImageObject: any, cmtId: number) => {
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
                const res = await createFolder(folder_name, imageNames[i], process.env.SOURCE!, listImage[i], "evaluate", order_id.toString(), undefined) as any
                if (res.statusCode === 200) {
                    result.push(...res.data)
                }
                else {
                    throw new HttpException(400, res.message)
                }
            }
        }
        return {
            folder_name: folder_name,
            files_name: result || []
        }
    }

    public findByOrderId = async (order_id: number, customer_id: number, conn?: PoolConnection) => {
        console.log(order_id, customer_id, 'order_id, customer_id')
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
                        console.log(item.id.toString(), process.env.SOURCE!, 'evaluate', 'photos')
                        item.product = await getProduct(item.product_id);
                        if (photos && photos.photos && photos.photos.length > 0) {
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
            const [seller_id] = await connection.execute<RowDataPacket[]>(`SELECT seller_id FROM ${this.tableName} WHERE product_id = ?`, [product_id]);
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

            const analyzeQuery = `
                SELECT 
                    COUNT(comment) AS total_comments,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS rate_1,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS rate_2,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS rate_3,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS rate_4,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS rate_5,
                    ROUND(AVG(NULLIF(rating,0)), 1) AS avg_rate
                FROM ${this.tableName}
                WHERE product_id = ?;
            `;

            const [analyzeResult] = await connection.execute<RowDataPacket[]>(analyzeQuery, [product_id]);

            const [result] = await connection.execute<RowDataPacket[]>(query, [product_id]);
            if (result.length > 0) {
                await Promise.all(
                    result.map(async (item) => {
                        const { total_likes, user_liked } = await this.likeRatingServices.checkAlreadyLike(item.id, model.customer_id!, item.product_id);
                        const photos = await getImage(item.id.toString(), process.env.SOURCE!, 'evaluate')
                        const customer = await getCustomer(item.customer_id);
                        item.total_likes = Number(total_likes);
                        item.user_liked = Number(user_liked);
                        item.photos = photos && photos.photos.length > 0 ? photos.photos : [];
                        item.customer = customer.name
                    })
                );
            }
            const finalData = model.has_photo
                ? result.filter(item => item.photos.length > 0)
                : result;

            const sellerEvaluate = await this.getSellerEvaluate(seller_id[0].seller_id);

            return {
                data: finalData,
                pagination: caculatePagination(count.length, model.page!, model.limit!),
                analyze: {
                    avg_rate: Number(analyzeResult[0].avg_rate) || 0,
                    total_comments: Number(analyzeResult[0].total_comments) || 0,
                    rate: {
                        rate_1: Number(analyzeResult[0].rate_1) || 0,
                        rate_2: Number(analyzeResult[0].rate_2) || 0,
                        rate_3: Number(analyzeResult[0].rate_3) || 0,
                        rate_4: Number(analyzeResult[0].rate_4) || 0,
                        rate_5: Number(analyzeResult[0].rate_5) || 0
                    }
                }
            };
        }, conn);
    }

    public update = async (model: Update, listImageObject: any, conn?: PoolConnection) => {
        console.log(model, 'model')
        return await withTransaction(async (connection) => {
            const order = await checkExistOrder(model.order_id!, model.customer_id!);
            const evaluated = await this.checkEvaluated(model.customer_id!, model.order_id!);
            if (evaluated.isEvaluated) {
                throw new HttpException(400, "Bạn đã đánh giá sản phẩm này");
            }
            const detail_rating: any[] = model.detail_rating ? JSON.parse(model.detail_rating) : [];
            const listImage = listImageObject?.files ?? listImageObject;
            if (detail_rating && detail_rating.length > 0) {
                await Promise.all(
                    detail_rating.map(async detail => {
                        const { rating, comment, photos } = detail;
                        const isToxic = toxic_words.some((word: string) => comment.toLowerCase().includes(word));
                        if (isToxic) {
                            throw new HttpException(400, "Bình luận chứa từ ngữ tiêu cực");
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
                                try {
                                    await this.upload(model.order_id!, selectedImages, detail.id);
                                } catch (error) {
                                    throw new HttpException(400, "Upload ảnh thất bại nhé")
                                }
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

    public checkEvaluated = async (customer_id: number, order_id: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const query = `
                SELECT id FROM ${this.tableName} WHERE customer_id = ? AND order_id = ?
            `;
            console.log(query, 'query', customer_id, order_id)
            const [result] = await connection.execute<RowDataPacket[]>(query, [customer_id, order_id]);
            console.log(result, 'result')
            if (result.length > 0) {
                return {
                    isEvaluated: true
                }
            }
            return {
                isEvaluated: false
            }
        }, conn);
    }

    public getSellerEvaluate = async (seller_id: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const query = `
                SELECT 
                    COUNT(*) AS total_reviews,
                    ROUND(AVG(rating), 1) AS avg_rating
                FROM ${this.tableName}
                WHERE seller_id = ?;
            `;
            const [result] = await connection.execute<RowDataPacket[]>(query, [seller_id]);
            if (result.length > 0) {
                return result[0];
            }
            return {
                total_reviews: 0,
                avg_rating: 0
            };
        }, conn);
    }
}

export default EvaluateServices;

