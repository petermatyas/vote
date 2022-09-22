const express = require('express')
const path = require('path')
//const mysql = require('mysql2')
const sqlite3 = require('sqlite3')
const dotenv = require('dotenv');
dotenv.config();

const bodyParser=require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');


//const con = new sqlite3.Database('app_db.db');
const con = new sqlite3.Database('app_db.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to SQlite database.');
  });

const os = require("os");
const hostname = os.hostname();


//let ip = "192.168.1.28"
const ip = hostname
let validSum = 10
const port = 8080

console.log('hostname', hostname)




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

/*function isVoteTime() {
    let sql = "SELECT * FROM votestart";
    con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        return queryRes[0].ontime
    })
}*/

function isVoteTimePromise() {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM votestart";
        
        con.all(sql, function(err, queryRes) {
            resolve(queryRes[0].ontime)
        });

    })
}

function isIdNotExistPromise(new_id_qr) {
    return new Promise(function (resolve,reject) {
        let sql = "SELECT id_qr FROM votes";
        con.all(sql, function(err, queryRes) {
            if (err) {return reject(err)}
            for (var i=0; i<queryRes.length; i++) {
                if (queryRes[i].id_qr == new_id_qr) {
                    resolve(false)
                }
            }
            resolve(true)
        });

        /*con.query(sql, (err, queryRes) => {
            //if (err) throw (err);
            if (err) {return reject(err)}
            for (var i=0; i<queryRes.length; i++) {
                if (queryRes[i].id_qr == new_id_qr) {
                    resolve(false)
                }
            }
            resolve(true)
        })*/
    });
  }

function insertVoteToDbPromise(id_qr, selected) {
    return new Promise(function (resolve, reject) {
        const time = new Date()
        let sql = "INSERT INTO votes(id_qr, time, vote_to) VALUES(?, ?, ?)";
        let values = [id_qr, time, selected]
        con.run(sql, values, function(err, queryRes) {
            if (err) {return reject(err)} 
            resolve()
        });
    })
}

function updateStartStop(updateTo) {
    return new Promise(function (resolve, reject) {
        //post = {id:0, ontime:updateTo}
        let sql = "UPDATE votestart SET ontime = ? WHERE id = 0";
        values = [updateTo]
        con.run(sql, values, function(err, queryRes) {
            if (err) {return reject(err)}
        });

        /*con.query(sql, post, (err, result) => {
            if (err) throw (err);
            
        })*/
    })
}


app.get('/', (req, res) => {
    const time = new Date()
    const url = req.url
    const method = req.method
    const query = req.query
    console.log(time, method, url, query)
    //id_qr = req.query.id



    if (!req.query.id) {
        return res.sendFile(path.resolve(__dirname, './views/wrongid.html'))
    } else {
        if (validId(req.query.id, validSum)) {
            isVoteTimePromise().then((result) => {
                
                if (result == 1) {
                    return isIdNotExistPromise(req.query.id).then((result) => {
                        if (result) {
                            console.log({qr_id:req.query.id, ip:ip, port:port})
                            res.render('index', {qr_id:req.query.id, ip:ip, port:port});
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

    isVoteTimePromise().then((result) => {
        
        if (result == 1) {
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
        } else {
            startstopBtnText = 'Vége'
        }
        res.render('admin', {startstopBtn:startstopBtnText, ip:ip, port:port});
    })
    


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
            res.render('admin', {startstopBtn:'Vége', ip:ip, port:port});
        } else {
            updateStartStop(0).then((result) => {})
            res.render('admin', {startstopBtn:'Kezdődjön', ip:ip, port:port});
        }
    })
    

})



app.get('/api/participants', (req, res) => {
    let sql = "SELECT id, name FROM participants WHERE participants.visible > 0";
    con.all(sql, function(err, queryRes) {
        if (err) throw (err);
        res.status(200).json({data:queryRes})
    });
    
    /*con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        res.status(200).json({data:queryRes})
    });*/

})

app.get('/api/summary', (req, res) => {
    //let sql = "SELECT * FROM votes";
    let sql = `SELECT participants.name, COUNT(participants.name) AS votes
                FROM votes 
                INNER JOIN participants ON participants.id=votes.vote_to
                WHERE participants.visible > 0
                GROUP BY participants.name     
                `
    con.all(sql, function(err, queryRes) {
        if (err) throw (err);
        queryRes.sort(function(a, b){
            return b.votes - a.votes;
        });
        res.status(200).json(queryRes)
    });

    /*con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        //console.log(queryRes)
        queryRes.sort(function(a, b){
            return b.votes - a.votes;
        });

        res.status(200).json(queryRes)
    });*/
})

app.get('/api/votetime', (req, res) => {
    let sql = "SELECT * FROM votestart";

    con.all(sql, function(err, queryRes) {
        if (err) throw (err);
        res.status(200).json(queryRes[0].ontime)
    });
    /*con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        res.status(200).json(queryRes[0].ontime)
    });*/

})


app.listen(8080, () => {
    console.log('server lisening on port 8080')
})