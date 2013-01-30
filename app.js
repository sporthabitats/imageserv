
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');
 
var spawn = require('child_process').spawn;
var config = require('./config');
var s3 =require('knox').createClient(config.s3);
var StreamCache = require('stream-cache');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



var caches = {};
app.get('/',function(req,res,next){
   if(caches[req.url])
    {
        caches[req.url].pipe(res);
        return;
    }
   
    s3.get('/'+req.query.url).on('response',function(s3Res){
        var size = req.query.size;
        
        var args = ['-',"-resize",size+"x"+size+"^","-gravity", "center","-crop",size+"x"+size+"+0+0","+repage",'-'];
        
        var convert = spawn('convert',args);
    

        s3Res.pipe(convert.stdin);
        
        convert.stdout.pipe(res);
        convert.stderr.pipe(process.stderr);
        
        
        var cache = new StreamCache();
        convert.stdout.pipe(cache);

        caches[req.url]=cache;
    }).end();  
});


/*


http.createServer(function(req,res){
    
    
    
    var parts = req.url.split('/');
    console.dir(parts);
    
    s3.get('/'+parts[1]).on('response',function(s3Res){
        var args = ['-','-resize',parts[2],'-'];
        var convert = spawn('convert',args);
    

        s3Res.pipe(convert.stdin);
        
        convert.stdout.pipe(res);
        convert.stderr.pipe(process.stderr);
        
        
        var cache = new StreamCache();
        convert.stdout.pipe(cache);
        caches[req.url]=cache;
    }).end();
}).listen(8080);

*/



http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
