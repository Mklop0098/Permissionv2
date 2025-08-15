export const addCollate = async (query: string) => {
    return query.replace(/(s\.\w+)/g, (match) => `${match} COLLATE utf8mb4_general_ci`);
}
