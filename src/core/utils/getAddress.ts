import axios from "axios";

export const getCityMap = async (cityIds: number[]) => {
    try {
        const result = await axios.get(`${process.env.CITY_URL}?ids=${cityIds.join(',')}`);
        const map = new Map<number, string>();
        result.data.data.forEach((city: any) => {
            map.set(city.id, city.name);
        });
        return map;
    } catch (error) {
        return new Map();
    }
};

export const getWardMap = async (wardIds: number[]) => {
    try {
        const result = await axios.get(`${process.env.WARD_URL}?ids=${wardIds.join(',')}`);
        const map = new Map<number, string>();
        result.data.data.forEach((ward: any) => {
            map.set(ward.id, ward.name);
        });
        return map;
    } catch (error) {
        return new Map();
    }
};
