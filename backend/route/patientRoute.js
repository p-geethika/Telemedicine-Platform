const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const patientRoute = express.Router();
const moment = require("moment");
const fs = require("fs");
require("dotenv").config();

const { PatientModel } = require("../model/PatientModel");
const { authorise } = require("../authorize");

patientRoute.use(express.json());

// to register patient and then hashing password using Bcrypt
patientRoute.post("/signup", async (req, res) => {
    const { name, email, password, role, image } = req.body;
    const patientFound = await PatientModel.findOne({ email });
    if (patientFound) {
        return res.status(409).send({ "message": "Patient already registered with this email", email });
    }
    try {
        let dateFormat = moment().format('D-MM-YYYY');
        bcrypt.hash(password, 5, async (err, hash) => {
            if (err) {
                return res.status(500).send({ "error": "Error hashing password" });
            }
            const data = new PatientModel({ name, email, password: hash, image, registeredDate: dateFormat, role });
            await data.save();
            res.status(201).send({ "message": "Patient Registered" });
        });
    } catch (err) {
        res.status(500).send({ "error": "Internal server error" });
    }
});

// to let patient login and then create and send token as response
patientRoute.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let data = await PatientModel.findOne({ email });
    if (!data) {
        return res.status(404).send({ "message": "No user found" });
    }
    try {
        bcrypt.compare(password, data.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ patientID: data._id }, process.env.key);
                const refreshtoken = jwt.sign({ patientID: data._id }, process.env.key, { expiresIn: '1m' });
                res.status(200).send({
                    "message": "Login successful",
                    "token": token,
                    "refresh": refreshtoken,
                    "name": data.name,
                    "id": data._id
                });
            } else {
                res.status(401).send({ "message": "INVALID credentials" });
            }
        });
    } catch (err) {
        res.status(500).send({ "error": "Internal server error" });
    }
});

// Other routes...

module.exports = {
    patientRoute
};
