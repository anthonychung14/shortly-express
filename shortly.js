var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


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


app.post('/',
  function(req, res) {
    req.session.destroy(function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect('/');
    }
    });
  });

app.get('/',
  function(req, res) {
    sess = req.session;
    if (sess.username) {
      res.render('index');

    } else {
      res.render('signup');
    }
  });

app.get('/login',
  function(req, res) {
    res.render('login');
  });

app.post('/signup', 
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Users.create({
      username: username,
      password: password,          
    })
    .then(function(newLink) {
      res.redirect('/login');
    })
    .catch(function (err) {
      console.log('Choose a new username', err);
    });
});


app.post('/login', 
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    new User ({ username: username}).fetch()
    .then(function(model) {
      if (model) {

        bcrypt.compare(password, model.get('password'), function(err, resp) {
          if (resp) {
            console.log('THIS IS THE MODEL', model, model.get('id'));
            sess = req.session;
            sess.username = username;
            sess.user_id = model.get('id');
            console.log('WE HAVE A MATCH');
            res.redirect('/');
          } else {
            console.log('WRONG PASSWORD!');
            res.redirect('/signup');
          }
        });
      } else {
        console.log('username not found');
      }
    });
  });


app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    //TODO filter out links using sess.user_id
    var filteredModels = links.where({ user_id: sess.user_id});

    //TODO: When we input filtered models, we cannot add or update any new urls.
    res.send(200, filteredModels);
  });
});

app.post('/links', 
function(req, res) {
  sess = req.session;
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          user_id: sess.user_id,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

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
