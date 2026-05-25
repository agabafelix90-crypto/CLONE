const functions = require('firebase-functions');
const express = require('express');

const loginClinic = require('../api/loginClinic');
const registerClinic = require('../api/registerClinic');
const proxyLogin = require('../api/proxy-login');
const proxyRegister = require('../api/proxy-register');

const app = express();

app.post('/loginClinic', express.json(), loginClinic);
app.post('/registerClinic', express.json(), registerClinic);
app.all('/proxy-login', proxyLogin);
app.all('/proxy-register', proxyRegister);

app.get('/', (req, res) => {
  res.status(200).send('Firebase API function is running.');
});

exports.api = functions.https.onRequest(app);
