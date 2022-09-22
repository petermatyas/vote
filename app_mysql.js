const express = require('express')
const path = require('path')
const mysql = require('mysql2')
const dotenv = require('dotenv');
dotenv.config();

const bodyParser=require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

let con = null

console.log(process.env.APP_ENV)
if (process.env.APP_ENV == 'developement') {
    con = mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
    });
} else {
    con = mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        socketPath : process.env.SOCKET_PATH
    });
}



let ip = "192.168.1.28"
let validSum = 10


con.connect(function (err) {
    if (err) throw err;
    //console.log("Connected!");
});




app.get('/create_participants_table', (req, res) => {
    let sql = "CREATE TABLE IF NOT EXISTS `participants` ( \
        `id` int NOT NULL AUTO_INCREMENT, \
        `name` varchar(255) CHARACTER SET armscii8 COLLATE armscii8_bin DEFAULT NULL, \
        `visible` tinyint DEFAULT NULL, \
        `logo` varchar(255) CHARACTER SET armscii8 COLLATE armscii8_bin DEFAULT NULL, \
        PRIMARY KEY (`id`) USING BTREE \
      )";
    con.query(sql, (err, res) => {
        if (err) throw (err);
        //console.log(res)
        res.sendFile(path.resolve(__dirname, './views/thanks.html'))
    });
});

app.get('/create_votes_table', (req, res) => {
    let sql = "CREATE TABLE IF NOT EXISTS `votes` ( \
        `id` int NOT NULL DEFAULT '0', \
        `id_qr` datetime DEFAULT NULL, \
        `time` datetime DEFAULT NULL, \
        `vote_to` int DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      )";
    con.query(sql, (err, res) => {
        if (err) throw (err);
        //console.log(res)
        res.sendFile(path.resolve(__dirname, './views/thanks.html'))
    });
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
                            res.render('index', {qr_id:req.query.id, ip:ip});
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
        res.render('admin', {startstopBtn:startstopBtnText, ip:ip});
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
            res.render('admin', {startstopBtn:'Vége', ip:ip});
        } else {
            updateStartStop(0).then((result) => {})
            res.render('admin', {startstopBtn:'Kezdődjön', ip:ip});
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


app.listen(5000, () => {
    console.log('server lisening on port 5000')
})