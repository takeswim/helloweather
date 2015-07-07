var request     = require('superagent');
var express     = require('express');
var express_errorHandler = require('errorhandler');
var http        = require('http');
var geohash     = require('ngeohash');
var redis       = require('redis').createClient();

var app = express();
process.setMaxListeners(0);
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    app.use(express_errorHandler({ dumpExceptions: true, showStack: true }));
}
app.set('port', 8080);

// route
app.get('/weather/:lat/:lon', function(req, res, next) {
   var ghash = geohash.encode(parseFloat(req.params.lat), parseFloat(req.params.lon));
   var ghash_6 = "helloweather::"+ghash.substr(0,6);
   redis.get(ghash_6, function(err, weather) {
       if(!weather) {
           request.get('http://api.openweathermap.org/data/2.5/weather')
               .query({lat:req.params.lat})
               .query({lon:req.params.lon})
               .end(function(err, result) {
                   var result_json = JSON.stringify(result.body);
                   redis.setex(ghash_6, 60, result_json);
                   console.log('##set 60sec '+result_json);
                   res.end(result_json);
               });
       } else {
           console.log('##cached');
           res.end(weather);
       }
   });
});
// end route

// start server
http.createServer(app).listen(app.get('port'), function(err) {
    console.log('start server '+app.get('port'));
});

// EOF
