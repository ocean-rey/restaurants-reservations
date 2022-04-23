declare global {
    namespace NodeJS{
        interface ProcessEnv{
            JWT_ACCESS_SECRET: string;
            JWT_REFRESH_SECRET: string;
            REDIS_URL: string;
        }
    } 
}
export {}