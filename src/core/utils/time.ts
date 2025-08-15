import dayjs from 'dayjs';
export class Time {
    public static addTimeIfMissing = (dateString: string, time: string) => {
        const date = dayjs(dateString, ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'], true)
        // if (dateString.length === 10) {
        //     return date.format('YYYY-MM-DD') + ' ' + time
        // }
        // ////console.log("dsds",date.format('YYYY-MM-DD HH:mm:ss'));
        
        // return date.format('YYYY-MM-DD HH:mm:ss')
        return date.format('YYYY-MM-DD') + ' ' + time
    }
}