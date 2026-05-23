require('dotenv').config();
const { JSEncrypt } = require('jsencrypt');
const crypto = require('crypto');
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyd2UMPL8blglJo5Bifv0
hLIP50pki7ujRkQf3NEgba2HtA4nC4yzR2qC7+/DwfgMNWnDDIIyfGC9wZ8IZHL6
3L1nsoncPE8klToykvEfWlz0QYW9pX9zD7QxRPtLY0tqQzNr7UWgMBy70GFjE60R
MNdL6XPir3ghGym0HEEqbgC7zSz1mfWoQOK3jUyDHwKR7r7QbDVrysKe8ebsK5n/
BDnKHRfp8gEqZPFs7pcgPLY2o1lgchLfphVgoaWwOsBObGR3qtPyQ7PALvSQqIwe
XdeRvElGFTiEJrpbgK3X7w79cRdOXODeuM/WzNPaUb/dS6n6hOBlaY7iILgkZdBW
UwIDAQAB
-----END PUBLIC KEY-----`;
const enc = new JSEncrypt();
enc.setPublicKey(publicKey);
const ciphertext = enc.encrypt('665lkjmr');
console.log('ciphertext', ciphertext);
const privateKey = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
const decrypted = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(ciphertext, 'base64'));
console.log('decrypted', decrypted.toString());
