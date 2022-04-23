import express from 'express'
import bodyParser from 'body-parser'
import auth from "./routes/auth"
import table from "./routes/table"
import reservation from "./routes/reservation"

const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


const router = express.Router()
router.use("/auth", auth)
router.use("/table", table)
router.use("/reservation", reservation)
app.use(router)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})


app.get('/', (req, res) => {
    console.log(req)
    console.log(res)
    res.send('Hello World!')
})
