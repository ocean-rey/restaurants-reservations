declare global {
    namespace NodeJS{
        interface ProcessEnv{
            JWT_ACCESS_SECRET: string;
        }
    }
}
export {}