const mysql = require('mysql2')


const con = mysql.createConnection({
    host: "192.168.1.82",
    user: "robot",
    password: "PrBQuLck",
    database: "szhely2030"
});






con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});







