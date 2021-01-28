import express from 'express'

import bodyParser from "body-parser";

const app = express()
const port = 8080
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE') // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token') // If needed
    // res.setHeader('Access-Control-Allow-Credentials', true); // If needed
    // console.log(req.body);
    next();
})
app.get('/', (req, res) => {
    res.send('Test')
})
app.use("/register", require('./routes/register'))

app.listen(port, () => console.log(`Server is listening on ${port}`))

