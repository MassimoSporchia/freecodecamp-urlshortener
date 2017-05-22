var express = require('express');
var mongodb = require('mongodb');
var mongoclient = mongodb.MongoClient;
var app = express();

var username = process.env.username || 'username';
var password = process.env.password || 'password';

var MONGOLAB_URI = 'mongodb://' + username + ':' + password + '@ds149551.mlab.com:49551/shortener';

var dbUrl = process.env.MONGOLAB_URI || MONGOLAB_URI;

app.get('/new/*',function(req, res){
    
    mongoclient.connect(dbUrl, function(err, db){
        
        if ( err ){
            console.log('url: ' + dbUrl);
            res.send('error while connecting to DB' + err);
            return err;
        }
        var urlsCollection = db.collection('urls');
        
        console.log(req.params[0]);
        if (!/^(ftp|http|https):\/\/[^ "]+$/.test(req.params[0])){
            res.send({error: 'URL is not valid!'});
            return;
        }
        urlsCollection.find( { url: req.params[0]}).toArray(function(err, array){
            if (err ){
                console.log(err);
                res.send('Error while retrieving value');
                return err
            }
                
            console.log('found: ' + array);
            if ( array[0] != null){
                res.send(array[0]);
            }
            else{
                urlsCollection.find().sort({id:-1}).limit(1).toArray(function ( err, max){
                    if ( err ){
                        console.log('Error while finding max ' + err);
                        return err;
                    }
                var maxValue = -1;
                if ( max[0] == null)
                    maxValue = 1;
                else
                    maxValue = max[0].id;
                  
                console.log('max: ' + max[0].id);
                
                
                    var idVal = maxValue + 1;
                    urlsCollection.insert({id: +idVal, url: req.params[0]}, function(err, addedVal){
                        if ( err)
                        return err;

                        res.send({original_url : req.params[0] , short_url : 'https://' + req.headers['host'] + '/' + addedVal.ops[0].id});
                    });
                
                
                });
            }
        });
    })
});
app.get('/*',function(req, res){
    mongoclient.connect(dbUrl, function(err, db){
        if ( err )
            return err;
        var urlsCollection = db.collection('urls');
        console.log(req.params[0]);
        urlsCollection.find({id: +req.params[0]}).toArray(function(err, data){
           if ( err ) 
                return err;
            
           console.log('data: ' + data[0].url);
           if ( data[0] != null)
                res.redirect(301, data[0].url);
           else
                res.send('no urls');
           
        });
})});

var port = process.env.PORT || 80;
app.listen(port);