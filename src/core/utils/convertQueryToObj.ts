export namespace ConvertToObj {
    export function convertUpdateQueryToObj(query: string, params: any[]): Record<string, any> {
        query = query.toLowerCase();
        if (!query || (!params && !query.includes('update'))) {
            return {}
        }
        const regex = /update\s+`?([a-zA-Z0-9-_]+)`?\s+set\s+(.+)\s+where/i;
        const match = query.match(regex);
        if (!match) {
            return {};
        }
    
        const setPart = match[2].trim();
        const setAssignments = setPart.split(',').map(item => item.trim());
        const updateObj: Record<string, any> = {};
    
        setAssignments.forEach((assignment, index) => {
            const [key, value] = assignment.split('=').map(item => item.trim());
            updateObj[key] = params[index];
        });

        const wherePart = query.split('where')[1].trim();
        const [idKey] = wherePart.split('=').map(item => item.trim());
        const idValue = params[params.length - 1];
        updateObj[idKey.toLowerCase()] = idValue;
    
        return updateObj;
    }
    
    export function convertCreateQueryToObject(query: string, params: any[]): Record<string, any> {
        query = query.toLowerCase();
        if (!query || (!params && !query.includes('insert'))) {
            return {};
        }
        const regex = /insert into\s+`?([a-zA-Z0-9-_]+)`?\s*\(([^)]+)\)/i;
        const match = query.match(regex);
        if (!match) {
            return {};
        }
        const columns = match[2].split(',').map(col => col.trim());
        ////console.log("columns", columns);
    
        if (columns.length !== params.length) {
            return {};
        }
    
        const result: Record<string, any> = {};
        for (let i = 0; i < columns.length; i++) {
            result[columns[i]] = params[i];
        }
        ////console.log("result", result);
        return result;
    }
    
    export function convertDeleteQueryToObject(query: string, params?: any[]): Record<string, any> {
        query = query.toLowerCase();
        if (!query || !query.includes('delete') || !query.includes('where') || !params) {
            return {};
        }

        const tableNameRegex = /delete from\s+`?([a-zA-Z0-9-_]+)`?\s+/i;
        const idValueRegex = /where\s+id\s*=\s*(\d+)/i;
    
        const tableNameMatch = query.match(tableNameRegex);
        const idValueMatch = query.match(idValueRegex);
    
        if (!tableNameMatch) {
            return {};
        }
    
        const tableName = tableNameMatch[1];
        const result: Record<string, any> = { tableName: `\`${tableName}\`` };
    
        if (params.length > 0 && params[0]) {
            result['id'] = params[0];
        } else if (idValueMatch) {
            result['id'] = idValueMatch[1];
        } else {
            return {};
        }
    
        return result;
    }

    export function convertUpdateStatusQueryToObject(query: string, params?: any[]): Record<string, any> {
        query = query.toLowerCase();
        if (!query || !query.includes('update') || !query.includes('set') || !query.includes('where')) {
            return {};
        }
        const tableNameRegex = /update\s+`?([a-zA-Z0-9-_]+)`?\s+set\s+(.+?)\s+where/i;
        const idValueRegex = /where\s+id\s*=\s*(\d+)/i;
    
        const tableNameMatch = query.match(tableNameRegex);
        const setFieldsMatch = query.match(tableNameRegex);
        const idValueMatch = query.match(idValueRegex);
    
        if (!tableNameMatch || !setFieldsMatch) {
            return {};
        }
    
        const tableName = tableNameMatch[1];
        const setFields = setFieldsMatch[2].split(',').map(field => field.trim());
        const result: Record<string, any> = { tableName: `\`${tableName}\`` };
    
        setFields.forEach((field, index) => {
            const [key] = field.split('=').map(part => part.trim());
            result[key] = (params ?? [])[index] !== undefined ? (params ?? [])[index] : null;
        });
    
        if (params && params.length > 0 && params[params.length - 1]) {
            result['id'] = params[params.length - 1];
        } else if (idValueMatch) {
            result['id'] = idValueMatch[1];
        } else {
            return {};
        }
    
        return result;
    }
    
    
}
