import bcrypt from "bcryptjs";
import DataBaseHandler from '../models/DataBaseHandler'
import {Connection} from "mysql2";
import jwt from "jsonwebtoken";
import request from "request";

const {verifyToken} = require("../tools.js")

const express = require('express').Router({mergeParams: true})
const app = module.exports = express
const connection: Connection = DataBaseHandler.getConnection()

interface registerResponse {
    token: String,
    hero: JSON,
    heroId: number
}


app.get('/', verifyToken, (req, res) => {
    const email: string = req.email
    getHeroId(email).then(
        (heroId: number) => {
            getFilmUrls(heroId).then((films: Array<string>) => {
                const filmPromises = []
                films.forEach(film => {
                    filmPromises.push(new Promise((resolve, reject) => {
                        request(film, (err, response, body) => {
                            if (err) {
                                reject(err)
                            }
                            resolve(body)
                        })
                    }))
                })
                Promise.all(filmPromises).then(results => {
                    const films: Array<JSON> = []
                    results.forEach(result => films.push(JSON.parse(result)))
                    res.status(200).send({type: "films", films: films})
                }).catch(err => {
                    console.error(err)
                    res.status(500).send({type: "error"})
                })
            }).catch(err => {
                console.error(err)
                res.status(500).send({type: "error"})
            })
        }).catch(err => {
        console.error(err)
        res.status(500).send({type: "error"})
    })

})
app.get('/:filmId', verifyToken, (req, res) => {
    const email: string = req.email
    const filmId: number = parseInt(req.params.filmId)
    getHeroId(email).then(
        (heroId: number) => {
            getFilmUrls(heroId).then((films: Array<string>) => {
                const regex = new RegExp(`films\\/${filmId}\\/$`)
                const filmUrl: String = films.filter(film => regex.test(film)).join();
                if (filmUrl === "")
                    return res.status(403).send({type: "error", message: "You dont have permissions"});
                request(filmUrl, (err, response, body) => {
                    if (err) {
                        res.status(500).send({type: "error"})
                    }
                    res.status(200).send({type: "films", films: [JSON.parse(body)]})
                })
            }).catch(err => {
                console.error(err)
                res.status(500).send({type: "error"})
            })
        }).catch(err => {
        console.error(err)
        res.status(500).send({type: "error"})
    })

})

function getHeroId(email: string) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT ha.HeroId
                          FROM HeroAssignments AS ha
                                   JOIN Users as u ON ha.UserId = u.UserId
                          WHERE u.Email = ? LIMIT 1 `, [email], function (err, result) {
            if (err) {
                reject(err)
            } else {
                if (Object.keys(result).length > 0) {
                    resolve(result[0].HeroId)
                } else {
                    reject("No heroId in DB")
                }

            }
        })
    })
}

function getFilmUrls(heroId: number) {
    return new Promise((resolve, reject) => {
        request("https://swapi.dev/api/people/" + heroId, (err, response, body) => {
            if (err) {
                reject(err)
            }
            resolve(<Array<string>>JSON.parse(body).films)
        })
    })
}
