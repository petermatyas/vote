const express = require('express')
const path = require('path')
const mysql = require('mysql2')
const dotenv = require('dotenv');
dotenv.config();

const bodyParser=require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


let validSum = parseInt(process.env.VALID)

console.log('NODE_ENV:', process.env.NODE_ENV)

/*con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    //password: '+M}3OEDa5(&9GG^(',
    database: process.env.DATABASE,
    //socketPath: 'szhely2030:europe-central2:szhely2030'
})*/

/*const con = mysql.createPool({    // WEBES!!!!!!!!!!!!!!!
    user: process.env.USER,
    password: '+M}3OEDa5(&9GG^(',
    database: process.env.DATABASE,
    socketPath: '/cloudsql/szhely2030:europe-central2:szhely2030'
})*/



const con = mysql.createPool({    // WEBES!!!!!!!!!!!!!!!
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        socketPath: process.env.SOCKET_PATH,
    })



if (process.env.NODE_ENV == 'developement') {
    con = mysql.createConnection({
        host: '192.168.1.82',
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        //socketPath : process.env.SOCKET_PATH
    })

    con.connect(function (err) {
        if (err) throw err;
        //console.log("Connected!");
    });





function isNumeric(value) {
    return /^\d+$/.test(value);
}

function validId(id, valid) {
    var sum = 0;
    for (var i = 0; i < id.length; i++) {
        if (isNumeric(id[i])) {
            sum = sum + parseInt(id[i])
        }
    }
    if (sum === valid) {
        return true
    } else {
        return false
    }

}


function isVoteTimePromise() {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM votestart";
        con.query(sql, (err, queryRes) => {
            //if (err) throw (err);
            if (err) {return reject(err)}
            resolve(queryRes[0].ontime)
        })
    })
}

function isIdNotExistPromise(new_id_qr) {
    return new Promise(function (resolve,reject) {
        let sql = "SELECT id_qr FROM votes";
        con.query(sql, (err, queryRes) => {
            //if (err) throw (err);
            if (err) {return reject(err)}
            for (var i=0; i<queryRes.length; i++) {
                if (queryRes[i].id_qr == new_id_qr) {
                    resolve(false)
                }
            }
            resolve(true)
        })
    });
  }

function insertVoteToDbPromise(id_qr, selected) {
    return new Promise(function (resolve, reject) {
        const time = new Date()
        post = {id_qr:id_qr, time:time, vote_to:selected}
        let sql = "INSERT INTO votes SET ?";
        con.query(sql, post, (err, result) => {
            if (err) throw (err);
            resolve()
        })
    })
}

function updateStartStop(updateTo) {
    return new Promise(function (resolve, reject) {
        post = {id:0, ontime:updateTo}
        let sql = "UPDATE votestart SET ?";
        con.query(sql, post, (err, result) => {
            if (err) throw (err);
            //res.sendFile(path.resolve(__dirname, './views/thanks.html'));
            //res.redirect('/admin');
            /*if (isVoteTime() == 0) {
                res.render('admin', {startstopBtn:'Kezdődjön', ip:ip});
            } else {
                res.render('admin', {startstopBtn:'Vége', ip:ip});
            }*/
        })
    })
}


app.get('/', (req, res) => {
    const time = new Date()
    const url = req.url
    const method = req.method
    const query = req.query
    //console.log(time, method, url, query)
    //id_qr = req.query.id



    if (!req.query.id) {
        return res.sendFile(path.resolve(__dirname, './views/wrongid.html'))
    } else {
        if (validId(req.query.id, validSum)) {
            isVoteTimePromise().then((result) => {
                if (result == 1) {
                    return isIdNotExistPromise(req.query.id).then((result) => {
                        if (result) {
                            res.render('index', {qr_id:req.query.id});
                        } else {
                            res.sendFile(path.resolve(__dirname, './views/alreadyvoted.html'));
                        } 
                    })
                } else {
                    res.sendFile(path.resolve(__dirname, './views/novotingtime.html'));
                }
            })
            
        } else {
            return res.sendFile(path.resolve(__dirname, './views/wrongid.html'))
        }
    }
})


app.post('/', (req, res) => {

    selected = req.body.selected
    id_qr = req.body.id_qr
    console.log('selected', selected, '  id_qr', id_qr)

    isVoteTimePromise().then((result) => {
        
        if (result == 1) {
            //console.log('-->', selected, id_qr)
            if (typeof selected !== 'undefined') {
                return isIdNotExistPromise(id_qr).then((result) => {
                    //console.log('result', result)
                    if (result) {
                        return insertVoteToDbPromise(id_qr, selected).then((result) => {
                            res.sendFile(path.resolve(__dirname, './views/thanks.html'));
                        })
                    } else {
                        res.sendFile(path.resolve(__dirname, './views/alreadyvoted.html'));
                    }
                })
            } else {
                res.sendFile(path.resolve(__dirname, './views/notselected.html'));
            }
        } else {
            res.sendFile(path.resolve(__dirname, './views/novotingtime.html'));
        }
    })
    

})



app.get('/admin', (req, res) => {
    startstopBtnText = 'valamiGet'
    isVoteTimePromise().then((result) => {
        if (result == 0) {  
            startstopBtnText = 'Kezdődjön'
            //res.render('admin', {startstopBtn:'Kezdődjön', ip:ip});
        } else {
            startstopBtnText = 'Vége'
            //res.render('admin', {startstopBtn:'Vége', ip:ip});
        }
        res.render('admin', {startstopBtn:startstopBtnText});
    })
    
    //res.render('admin', {startstopBtn:'Kezdődjön', ip:ip});


    /*let sql = "SELECT * FROM votestart";
    con.query(sql, (err, queryRes) => {
        if (err) throw (err);
       
        if (isVoteTime() == 0) {
            res.render('admin', {startstopBtn:'Kezdődjön', ip:ip});
        } else {
            res.render('admin', {startstopBtn:'Vége', ip:ip});
        }
        
    })*/

})

app.post('/admin', (req, res) => {
    isVoteTimePromise().then((result) => {
        //('isVoteTimePromise result', result)
        if (result == 0) {
            updateStartStop(1).then((result) => {})
            res.render('admin', {startstopBtn:'Vége'});
        } else {
            updateStartStop(0).then((result) => {})
            res.render('admin', {startstopBtn:'Kezdődjön'});
        }
    })
    

})



app.get('/api/participants', (req, res) => {
    let sql = "SELECT id, name FROM participants WHERE participants.visible > 0";
    con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        res.status(200).json({data:queryRes})
    });

})

app.get('/api/summary', (req, res) => {
    //let sql = "SELECT * FROM votes";
    let sql = `SELECT participants.name, COUNT(participants.name) AS votes
                FROM votes 
                INNER JOIN participants ON participants.id=votes.vote_to
                WHERE participants.visible > 0
                GROUP BY participants.name     
                `

    con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        //console.log(queryRes)
        queryRes.sort(function(a, b){
            return b.votes - a.votes;
        });

        res.status(200).json(queryRes)
    });
})

app.get('/api/votetime', (req, res) => {
    let sql = "SELECT * FROM votestart";
    con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        res.status(200).json(queryRes[0].ontime)
    });

})

if (process.env.NODE_ENV == 'developement') {
    app.listen(5000, () => {
        console.log('server lisening on port 5000')
    })
} else if (process.env.NODE_ENV == 'production') {
    app.listen(8080, () => {
        console.log('server lisening on port 8080')
    })
}
