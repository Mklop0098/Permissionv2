import { cleanEnv, str, port, num } from "envalid"

const validateEnv = () => {
    cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port(),
        DB_HOST: str(),
        DB_USER: str(),
        DB_PASSWORD: str(),
        DB_NAME: str(),
        DB_CONNECTION_LIMIT: str(),
        JWT_SECRET: str(),
        REFRESH_TOKEN_SECRET: str()
    })
}

export default validateEnv;