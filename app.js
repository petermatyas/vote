const express = require('express')
const path = require('path')
const mysql = require('mysql2')

const bodyParser=require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

const con = mysql.createConnection({
    host: "192.168.1.82",
    user: "robot",
    password: "PrBQuLck",
    database: "szhely2030"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
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
        console.log(res)
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
        console.log(res)
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


app.get('/', (req, res) => {
    const time = new Date()
    const url = req.url
    const method = req.method
    const query = req.query
    console.log(time, method, url, query)




    if (!req.query.id) {
        return res.sendFile(path.resolve(__dirname, './views/wrongid.html'))
    } else {
        if (validId(req.query.id, 5)) {


            //return res.sendFile(path.resolve(__dirname, './views/index.html'), {qr_id:req.query.id})
            res.render('index', {qr_id:req.query.id});
        } else {
            return res.sendFile(path.resolve(__dirname, './views/wrongid.html'))
        }

        /*for (var i = 0; i < req.query.id.length; i++) {
            if (isNumeric(req.query.id[i])) {
            console.log(req.query.id[i]); 
            }
            
        }*/
    }


})


app.post('/', (req, res) => {
    console.log('--->', req.body);
    //res.sendFile(path.resolve(__dirname, './views/thanks.html'));
    const time = new Date()


    post = {id_qr:'asdd', time:time, vote_to:req.body.selected}


    let sql = "INSERT INTO votes SET ?";
    con.query(sql, post, (err, result) => {
        if (err) throw (err);
        res.sendFile(path.resolve(__dirname, './views/thanks.html'));
    })


})


app.get('/api/participants', (req, res) => {
    let sql = "SELECT id, name FROM participants WHERE participants.visible > 0";
    con.query(sql, (err, queryRes) => {
        if (err) throw (err);
        //console.log(queryRes)
        res.status(200).json({data:queryRes})
        //return res.sendFile(path.resolve(__dirname, './views/index.html'), {name:'peti'})
        //res.render(path.resolve(__dirname, './views/index.html'))
    });

})


app.listen(5000, () => {
    console.log('server lisening on port 5000')
})