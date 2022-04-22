import express from 'express'
import bodyParser from 'body-parser'
import auth from "./routes/auth"

const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


const router = express.Router()
router.use("/auth", auth)
app.use(router)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})


app.get('/', (req, res) => {
    console.log(req)
    console.log(res)
    res.send('Hello World!')
})
