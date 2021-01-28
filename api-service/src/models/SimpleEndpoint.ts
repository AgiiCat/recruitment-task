import {Connection} from "mysql2";
import request from "request";

export default class SimpleEndpoint {
    private connection: Connection
    private readonly itemName: string

    constructor(connection: Connection, itemName: string) {
        this.connection = connection
        this.itemName = itemName
    }

    public getAll(email: string, req, res) {
        this.getHeroId(email).then(
            (heroId: number) => {
                this.getItemsUrls(heroId).then((items: Array<string>) => {
                    const itemsPromises = []
                    items.forEach(item => {
                        itemsPromises.push(new Promise((resolve, reject) => {
                            request(item, (err, response, body) => {
                                if (err) {
                                    reject(err)
                                }
                                resolve(body)
                            })
                        }))
                    })
                    Promise.all(itemsPromises).then(results => {
                        const items: Array<JSON> = []
                        results.forEach(result => items.push(JSON.parse(result)))
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
                this.getItemsUrls(heroId).then((items: Array<string>) => {
                    const regex = new RegExp(`${this.itemName}\\/${itemId}\\/$`)
                    const itemUrl: String = items.filter(item => regex.test(item)).join();
                    if (itemUrl === "")
                        return res.status(403).send({type: "error", message: "You dont have permissions"});
                    request(itemUrl, (err, response, body) => {
                        if (err) {
                            res.status(500).send({type: "error"})
                        }
                        res.status(200).send({type: this.itemName, items: [JSON.parse(body)]})
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
        return new Promise((resolve, reject) => {
            request("https://swapi.dev/api/people/" + heroId, (err, response, body) => {
                if (err) {
                    reject(err)
                }
                const data = JSON.parse(body)
                if (Array.isArray(data[this.itemName]))
                    resolve(data[this.itemName])
                else
                    resolve([data[this.itemName]])
            })
        })
    }

}
