import Logger from "@core/utils/logger"
import { Response } from "express"
import { IErrors } from "@core/interfaces"
import { ValidationError } from "class-validator"

function flattenValidationErrors(errors: ValidationError[], parentPath = '', seen = new Set<string>()): { field: string; message: string }[] {
    const result: { field: string; message: string }[] = [];

    for (const error of errors) {
        const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

        // Nếu chưa có lỗi nào cho field này
        if (error.constraints && !seen.has(fieldPath)) {
            const firstMessage = error.constraints[Object.keys(error.constraints)[0]];
            result.push({ field: fieldPath, message: firstMessage });
            seen.add(fieldPath);
        }

        if (error.children && error.children.length > 0) {
            result.push(...flattenValidationErrors(error.children, fieldPath, seen));
        }
    }

    return result;
}

export default function sendResponse<T>(res: Response, statusCode: number, message: string, data?: T, field?: string | ValidationError[], errors?: IErrors | null) {
    Logger.info(message)
    if ((statusCode == 404 || statusCode == 400 || statusCode == 403) && !field && !errors) {
        return res.status(200).json({
            statusCode,
            message,
            ...data
        })
    }
    if ((data || statusCode == 200 || 201) && !field && !errors) {
        return res.status(statusCode).json({
            statusCode,
            message,
            ...data,
        })
    }
    if (field && Array.isArray(field) && field.length > 0) {
        const flattened = flattenValidationErrors(field);
        return res.status(200).json({
            statusCode,
            errors: flattened
        });
    }
    if (field) {
        return res.status(200).json({
            statusCode,
            errors: [{
                field,
                message
            }]
        })
    }
    if (errors) {
        return res.status(200).json({
            statusCode,
            errors
        })
    }
}