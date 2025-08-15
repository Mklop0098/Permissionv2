import { IRoute } from "@core/interfaces";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import errorMiddleware from "@core/middleware/error.middleware";
import Logger from "@core/utils/logger";
import path from "path";
const multer = require('multer');
import database from "@core/config/database";
import * as fs from 'fs';
import * as https from 'https';

class App {
    public app: express.Application
    public port: number | string
    public environment: string

    constructor(routes: IRoute[]) {
        this.environment = this.envConfig();
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.connectMySql();
        this.initialMiddlewares()
        this.initialRoutes(routes)
        this.initialErrorMidlleware()
    }
    private async initialRoutes(routes: IRoute[]) {
        routes.forEach(route => {
            this.app.use(process.env.API_VERSION!, route.router)
        })
    }
    public listen() {
        if (this.environment === 'production') {
            // config sv SSL

            // const privateKey = fs.readFileSync('/etc/yopos.yomart.com.vn/certs/privkey.pem');
            // const certificate = fs.readFileSync('/etc/yopos.yomart.com.vn/certs/fullchain.pem');

            const privateKey = fs.readFileSync('/var/www/ymsv.myoptech.net/certs/privkey.pem');
            const certificate = fs.readFileSync('/var/www/ymsv.myoptech.net/certs/fullchain.pem');

            const credentials = { key: privateKey, cert: certificate };

            const httpsServer = https.createServer(credentials, this.app);
            httpsServer.listen(this.port, () => Logger.info(`Server is running on port ${this.port}`));
        } else {
            this.app.listen(this.port, () => {
                Logger.info(`Server is running on port ${this.port}`)
            })
        }
    }
    private initialMiddlewares() {
        if (this.environment === 'production') {
            this.app.use(morgan('combined'))
            this.app.use(cors({ origin: true, credentials: true }))
            this.app.use(helmet({
                crossOriginResourcePolicy: false,
            }))
            this.app.use(hpp())
        } else {
            this.app.use(morgan('dev'))
            this.app.use(cors({ origin: true, credentials: true }))
        }
        // const swaggerDocument = YAML.load(path.resolve('./src/core/swagger/yomart-swagger.yaml'));
        // const swaggerDocument = YAML.load(path.resolve('./yomart-swagger.yaml'));
        // this.app.use('/yomart/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        this.app.use(express.json({ limit: '50mb' }))
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }))
        this.app.use('/uploads', express.static(path.resolve('uploads/')));
        // this.app.use('/uploads', express.static(path.join(__dirname, 'uploads/')));
    }
    private initialErrorMidlleware() {
        this.app.use(errorMiddleware);
        // this.app.use(multer().single('file'));
    }
    private connectMySql() {
        database.connectDB();
    }
    private envConfig() {
        const env = process.env.NODE_ENV || 'development';
        require('dotenv').config({ path: path.resolve(`.env_${env}`) });
        return env;
    }
}

export default App;