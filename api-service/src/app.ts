import express from 'express'
import bodyParser from "body-parser";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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
app.use("/login", require('./routes/login'))
app.use("/films", require('./routes/films'))
app.use("/species", require('./routes/species'))
app.use("/vehicles", require('./routes/vehicles'))
app.use("/starships", require('./routes/starships'))
app.use("/planets", require('./routes/planets'))

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'SWApi with auth',
            version: '1.0.0',
        },
    },
    apis: ['src/schemas/*.yaml'],
};
const specs = swaggerJsdoc(swaggerOptions)
if(process.env.NODE_ENV === "development")
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs))

app.listen(port, () => console.log(`Server is listening on ${port}`))

