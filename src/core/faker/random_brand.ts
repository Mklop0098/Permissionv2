import { faker } from '@faker-js/faker';

export async function gennerRandomData(count: number) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            name: faker.name.firstName(),
        });
    }
    return data;
}
