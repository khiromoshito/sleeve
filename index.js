const express = require('express');
const path = require('path');

const app = express();


app.use("/sleeve", express.static(__dirname + "/sleeve"));
app.use("/docs", express.static(__dirname + "/docs"));
app.use("/frags", express.static(__dirname + "/frags"));
app.use("/scripts", express.static(__dirname + "/scripts"));

app.listen(5000, ()=>console.log("We're now on the run, captain; at port 5000"));
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "index.html"));
    //res.send(__dirname);
});

app.get("/favicon.png", (req, res)=>{
    res.sendFile(path.join(__dirname, "favicon.png"));
    //res.send(__dirname);
});

app.get("/favicon_gray.png", (req, res)=>{
    res.sendFile(path.join(__dirname, "favicon_gray.png"));
    //res.send(__dirname);
});

