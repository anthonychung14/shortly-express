var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({secret:'jrrtoken'}));

var sess;



// app.get('/', 
// function(req, res) {
//   console.log(req.session);
//   res.render('signup');
// });

app.get('/',
  function(req, res) {
    if (sess.username) {
      //redirect to link page
    } else {
      res.redirect('login');
    }
  });

app.post('/login', 
  function(req, res) {
    sess = req.body.username;


  });
// app.get('/create', 
// function(req, res) {
//   res.render('index');
// });

// app.get('/links', 
// function(req, res) {
//   Links.reset().fetch().then(function(links) {
//     res.send(200, links.models);
//   });
// });

// app.post('/links', 
// function(req, res) {
//   var uri = req.body.url;

//   if (!util.isValidUrl(uri)) {
//     console.log('Not a valid url: ', uri);
//     return res.send(404);
//   }

//   new Link({ url: uri }).fetch().then(function(found) {
//     if (found) {
//       res.send(200, found.attributes);
//     } else {
//       util.getUrlTitle(uri, function(err, title) {
//         if (err) {
//           console.log('Error reading URL heading: ', err);
//           return res.send(404);
//         }

//         Links.create({
//           url: uri,
//           title: title,
//           base_url: req.headers.origin
//         })
//         .then(function(newLink) {
//           res.send(200, newLink);
//         });
//       });
//     }
//   });
// });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', 
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Users.create({
      username: username,
      password: password,          
    })
    .then(function(newLink) {
      req.session.username = username;
      console.log(req.session);
      res.redirect('/links');
    })
    .catch(function (err) {
      console.log('Choose a new username', err);
    });
});

//upon login, generate session "cookie"/secret

//every redirect will have that cookie/secret

//if cookie, 

//localhost/links/ => bob's urls after session is created

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

//hi git