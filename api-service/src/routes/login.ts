import bcrypt from "bcryptjs";
import DataBaseHandler from '../models/DataBaseHandler'
import {Connection} from "mysql2";
import jwt from "jsonwebtoken";

const express = require('express').Router({mergeParams: true})
const app = module.exports = express
const connection: Connection = DataBaseHandler.getConnection()

interface registerResponse {
    token: String,
    hero: JSON,
    heroId: number
}

app.post('/', (req, res) => {
    if (req.body === undefined || req.body.email === undefined || req.body.password === undefined)
        return res.status(400).send({type: "error", message: "Missing Data"})
    const email: string = req.body.email
    const password: string = req.body.password
    getPasswordFromDB(email).then(
        (result: String) => {
            if (result === "no_email") {
                return res.status(401).send({type: "error", message: "Email/Password is invalid"})
            } else {
                const passwordIsValid = bcrypt.compareSync(password, result)
                if (!passwordIsValid)
                    return res.status(401).send({type: "error", message: "Email/Password is invalid"})
                const token = jwt.sign({id: email}, process.env.JWT_SECRET, {
                    expiresIn: 24 * 60 * 60
                });
                res.status(200).send({auth: true, token: token});
            }
        }).catch(err => {
        console.error(err)
        res.status(500).send({type: "error"})
    })
})

function getPasswordFromDB(email: String) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT Pass
                          FROM Users
                          WHERE Email = ? LIMIT 1 `, [email], function (err, result) {
            if (err) {
                reject(err)
            } else {
                if (Object.keys(result).length > 0) {
                    resolve(result[0].Pass)
                } else {
                    resolve("no_email")
                }

            }
        })
    })
}
