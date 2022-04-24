import express from 'express'
import bodyParser from 'body-parser'
import auth from "./routes/auth"
import table from "./routes/table"
import reservation from "./routes/reservation"
import { createUser, findUserByempNumber } from './lib/user'

const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


const router = express.Router()
router.use("/auth", auth)
router.use("/table", table)
router.use("/reservation", reservation)
app.use(router)

app.listen(port, async () => {
    const user = await findUserByempNumber("0000");
    if (!user) {
        console.log("Creating default admin..")
        await createUser({ empNumber: "0000", password: "admin0", role: "Admin" })
        console.log("Default credentials:")
        console.table({ empNumber: "0000", password: "admin0" })
    }
})


app.get('/', (req, res) => {
    console.log(req)
    console.log(res)
    res.send('Hello World!')
})
