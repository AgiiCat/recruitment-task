import bcrypt from "bcryptjs";
import DataBaseHandler from '../models/DataBaseHandler'
import {Connection} from "mysql2";
import jwt from "jsonwebtoken";
import request from "request";

const {validateEmail, validatePasswordRequirements} = require("../tools.js")
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
    if (!validateEmail(email) || !validatePasswordRequirements(password))
        return res.status(400).send({type: "error", message: "Invalid Data"})
    const hashedPassword: string = bcrypt.hashSync(password, 8);
    checkUniqueEmail(email).then(
        (result: String) => {
            if (result === "busy")
                res.status(400).send({type: "error", message: "Email busy"})
            else
                createNewUser(email, hashedPassword)
                    .then((result: registerResponse) => res.status(200).send({type: "auth", token: result.token, hero: result.hero, heroId: result.heroId}))
                    .catch(err => {
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
    let newUserPromise = new Promise((resolve, reject) => {
        connection.query(`INSERT INTO Users (Email, Pass)
                          VALUES (?, ?)`, [email, hashedPassword], function (err, result) {
                if (err) {
                    reject(err)
                } else if ("insertId" in result) {
                    resolve(result.insertId)
                } else {
                    reject("No insertId")
                }
            }
        )
    })
    const heroId = Math.floor(Math.random() * 83) + 1;
    let heroPromise = new Promise((resolve, reject) => {
        request("https://swapi.dev/api/people/" + heroId, (err, response, body) => {
            if (err) {
                reject(err)
            }
            resolve(body)
        })
    })
    return new Promise((resolve, reject) => {
        Promise.all([newUserPromise, heroPromise]).then(async function (results) {
            const userId = <number>results[0]
            const heroObject: JSON = JSON.parse(<string>results[1])
            const token = jwt.sign({id: email}, process.env.JWT_SECRET, {
                expiresIn: 24 * 60 * 60 // expires in 24 hours
            });
            await assignHero(userId, heroId, token, heroObject)
            const registerResponse: registerResponse = {token: token, hero: heroObject, heroId: heroId}
            resolve(registerResponse)
        }).catch(err => reject(err))
    })
}

function assignHero(userId: Number, heroId: Number, token: String, hero: JSON) {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO HeroAssignments (UserId, HeroId)
                          VALUES (?, ?)`, [userId, heroId], function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(0)
                }
            }
        )
    })
}
