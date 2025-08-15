const actionDefault = {
    'GET': 'index',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
}

export const getUrlAction = (req: any) => {
    const method = req.method as keyof typeof actionDefault;
    const action = actionDefault[method];
    const cleanPath = req.path;
    const url = cleanPath.split('/').filter(Boolean)[0];
    return {
        action,
        url
    };
};
