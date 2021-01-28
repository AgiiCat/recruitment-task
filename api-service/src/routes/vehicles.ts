import DataBaseHandler from '../models/DataBaseHandler'
import {Connection} from "mysql2";
import SimpleEndpoint from "../models/SimpleEndpoint";

const {verifyToken} = require("../tools.js")

const express = require('express').Router({mergeParams: true})
const app = module.exports = express
const connection: Connection = DataBaseHandler.getConnection()

const simpleEndpoint = new SimpleEndpoint(connection, "vehicles")
app.get('/', verifyToken, (req, res) => {
    const email: string = req.email
    return simpleEndpoint.getAll(email, req, res)
})
app.get('/:itemId', verifyToken, (req, res) => {
    const email: string = req.email
    const itemId: number = parseInt(req.params.itemId)
    return simpleEndpoint.getItemById(email, itemId, req, res)

})
