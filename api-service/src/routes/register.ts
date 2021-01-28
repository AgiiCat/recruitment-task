import bcrypt from "bcryptjs";
import DataBaseHandler from '../models/DataBaseHandler'
import {Connection} from "mysql2";
import jwt from "jsonwebtoken";

const {validateEmail, validatePasswordRequirements} = require("../tools.js")
const express = require('express').Router({mergeParams: true})
const app = module.exports = express
const connection: Connection = DataBaseHandler.getConnection()

app.post('/', (req, res) => {
    if (req.body === undefined || req.body.email === undefined || req.body.password === undefined)
        return res.status(400).send({type: "error", message: "Missing Data"})
    const email: string = req.body.email
    const password: string = req.body.password
    if (!validateEmail(email) || !validatePasswordRequirements(password))
        return res.status(400).send({type: "error", message: "Invalid Data"})
    const hashedPassword: string = bcrypt.hashSync(password, 8);
    checkUniqueEmail(email).then(
        (result: String) => {
            if (result === "busy")
                res.status(400).send({type: "error", message: "Email busy"})
            else
                createNewUser(email, hashedPassword)
                    .then(token => res.status(200).send({type: "auth", token: token})).catch(err => {
                    console.error(err)
                    res.status(500).send({type: "error"})
                })
        }).catch(err => {
        console.error(err)
        res.status(500).send({type: "error"})
    })
})

function checkUniqueEmail(email: String) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT Email
                          FROM Users
                          WHERE Email = ?`, [email], function (err, result) {
            if (err) {
                reject(err)
            } else {
                if (Object.keys(result).length > 0) {
                    resolve("busy")
                } else {
                    resolve("ok")
                }

            }
        })
    })
}

function createNewUser(email: String, hashedPassword: String) {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO Users (Email, Pass)
                          VALUES (?, ?)`, [email, hashedPassword], function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    const token = jwt.sign({id: email}, process.env.JWT_SECRET, {
                        expiresIn: 24 * 60 * 60 // expires in 24 hours
                    });
                    resolve(token)
                }
            }
        )
    })
}
