import {Connection} from "mysql2";
import request from "request";

const redisClient = require('../redis-client')

export default class SimpleEndpoint {
    private connection: Connection
    private readonly itemName: string
    private readonly jsonItemName: string

    constructor(connection: Connection, itemName: string, jsonItemName?: string) {
        this.connection = connection
        this.itemName = itemName
        this.jsonItemName = jsonItemName ? jsonItemName : itemName
    }

    public getAll(email: string, req, res) {
        this.getHeroId(email).then(
            (heroId: number) => {
                this.getItemsUrls(heroId).then((items: Array<string>) => {
                    const itemsPromises = []
                    items.forEach(item => {
                        itemsPromises.push(new Promise(async (resolve, reject) => {
                            const cacheData = await redisClient.getAsync(item)
                            if (cacheData) {
                                resolve(JSON.parse(cacheData))
                            } else {
                                request(item, (err, response, body) => {
                                    if (err) {
                                        reject(err)
                                    }
                                    redisClient.setAsync(item, JSON.stringify(body), 'EX', redisClient.expireTime)
                                    resolve(body)
                                })
                            }
                        }))
                    })
                    Promise.all(itemsPromises).then(results => {
                        const items: Array<JSON> = []
                        results.forEach(result => {
                            try {
                                items.push(JSON.parse(result))
                            } catch (e) {
                            }
                        })
                        res.status(200).send({type: this.itemName, items: items})
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
    }

    public getItemById(email: string, itemId: number, req, res) {
        this.getHeroId(email).then(
            (heroId: number) => {
                this.getItemsUrls(heroId).then(async (items: Array<string>) => {
                    const regex = new RegExp(`${this.itemName}\\/${itemId}\\/$`)
                    const itemUrl: String = items.filter(item => regex.test(item)).join();
                    if (itemUrl === "")
                        return res.status(403).send({type: "error", message: "You dont have permissions"});
                    const cacheData = await redisClient.getAsync(itemUrl)
                    if (cacheData) {
                        res.status(200).send({type: this.itemName, items: [JSON.parse(cacheData)]})
                    } else {
                        request(itemUrl, (err, response, body) => {
                            if (err) {
                                res.status(500).send({type: "error"})
                            }
                            redisClient.setAsync(itemUrl, body, 'EX', redisClient.expireTime)
                            res.status(200).send({type: this.itemName, items: [JSON.parse(body)]})
                        })
                    }
                }).catch(err => {
                    console.error(err)
                    res.status(500).send({type: "error"})
                })
            }).catch(err => {
            console.error(err)
            res.status(500).send({type: "error"})
        })
    }


    private getHeroId(email: string) {
        return new Promise((resolve, reject) => {
            this.connection.query(`SELECT ha.HeroId
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

    private getItemsUrls(heroId: number) {
        const prepareResult = (input:string): Array<JSON> => {
            const data = JSON.parse(input)
            let resultData: Array<JSON>
            if (Array.isArray(data[this.jsonItemName]))
                resultData = data[this.jsonItemName]
            else
                resultData = [data[this.jsonItemName]]
            return resultData
        }
        return new Promise(async (resolve, reject) => {
            const url = "https://swapi.dev/api/people/" + heroId
            const cacheData = await redisClient.getAsync(url)
            if (cacheData) {
                resolve(prepareResult(cacheData))
            } else {
                request(url, (err, response, body) => {
                    if (err) {
                        reject(err)
                    }
                    redisClient.setAsync(url, body, 'EX', redisClient.expireTime)
                    resolve(prepareResult(body))
                })
            }
        })
    }

}
