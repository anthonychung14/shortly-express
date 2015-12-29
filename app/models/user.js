var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName : 'users',
  links: function () {
    return this.hasMany(Link);
  },
  initialize:function() {

    this.on('creating', function(model, attrs, options) {

      //promises ROCK!
      return new Promise(function (resolve, reject) {

        bcrypt.hash(model.get('password'), null, null, function(err, hash) {
          if (err) { reject(err); }

          resolve(hash);

        }); 
      })
      .then(function (hash) {
        model.set('password', hash);
      })
      .catch(function (err) {
        console.log('ERROR!', err);
      });
      
  });
  }
});

module.exports = User;