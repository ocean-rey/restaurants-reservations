import { Tedis } from "redis-typescript";
const cache = new Tedis({host: "redis", port: 6379})

export default cache