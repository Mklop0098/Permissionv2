import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, "../../../optech-yapo-d8dbbd10e546.json");

class Notification {
    public messaging: admin.messaging.Messaging;

    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath)
        });
        this.messaging = admin.messaging();
    }

    public async sendNotification(token: string, title: string, body: string, data: any) {
        const message = {
            notification: {
                title: title,
                body: body
            },
            token: token,
            data: { data }
        };
        try {
            const response = await this.messaging.send(message as any);
            ////console.log('send succsess', response);
            return response;
        } catch (error) {
            console.error('error sending message:', error);
            throw error;
        }
    }
}

export default new Notification();
