declare global {
    namespace Express {
        interface Request {
            role: "Admin" | "Employee" | false
        }
    }
}
export{}
