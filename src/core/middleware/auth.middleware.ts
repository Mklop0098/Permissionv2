import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendResponse } from '@core/utils';
import { checkExist } from '@core/utils/checkExist';
import errorMessages from '@core/config/constants';
import { getUrlAction } from '@core/utils/getUrlAction';
import axios from 'axios';
class AuthMiddleware {
    // public static authorization(isCheckPermission = false) {
    //     if (isCheckPermission == false) {
    //         return this.authorizationWithPermissionCheck(false);
    //     } else {
    //         return this.authorizationWithPermissionCheck(true);
    //     }
    // }
    public static authorization = (isCheckPermission = false) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            console.log(req.header('Authorization'));
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                next()
            }
            else {
                let { url, action } = getUrlAction(req);
                if (req.header('url')) {
                    url = req.header('url') as string;
                }
                if (req.header('action')) {
                    action = req.header('url') as string;
                }
                const body = isCheckPermission ? {
                    url: url,
                    action: action,
                    token: token
                } : {
                    token: token
                }
                try {
                    const response = await axios.post(`${process.env.SERVER_AUTH_URL}/api/v1/auth/check-token`, body)
                    if (response.status === 200) {
                        req.id = response.data.data.id;
                        req.seller_id = response.data.data.seller_id;
                        req.ref_id = response.data.data.ref_id;
                        req.type = response.data.data.type;
                    }
                    next();
                } catch (error) {
                    return sendResponse(res, 400, error instanceof Error ? error.message : 'Xác thực token thất bại');
                }

            }
        };
    };

    public static authorizationStrict = (isCheckPermission: boolean = false) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return sendResponse(res, 400, 'Vui lòng đăng nhập');
            }
            else {
                let { url, action } = getUrlAction(req);
                if (req.header('url')) {
                    url = req.header('url') as string;
                }
                if (req.header('action')) {
                    action = req.header('url') as string;
                }
                const body = isCheckPermission ? {
                    url: url,
                    action: action,
                    token: token
                } : {
                    token: token
                }
                try {
                    const response = await axios.post(`${process.env.SERVER_AUTH_URL}/api/v1/auth/check-token`, body)
                    console.log(response.data);
                    if (response.status === 200) {
                        req.id = response.data.data.id;
                        req.seller_id = response.data.data.seller_id;
                        req.ref_id = response.data.data.ref_id;
                        req.type = response.data.data.type;
                        req.role_id = response.data.data.role_id;
                    }
                    next();
                } catch (error) {
                    return sendResponse(res, 400, error instanceof Error ? error.message : 'Xác thực token thất bại');
                }

            }
        };
    };

}

export default AuthMiddleware;
