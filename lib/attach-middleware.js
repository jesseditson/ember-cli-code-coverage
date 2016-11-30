'use strict';

var bodyParser = require('body-parser');
var Istanbul = require('istanbul');
var config = require('./config');
var path = require('path');
var fs = require('fs-extra');

function logError(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

module.exports = function(app, options) {
  app.post('/write-coverage',
    bodyParser.json({ limit: '50mb' }),
    function(req, res) {
      var collector = new Istanbul.Collector();
      var _config = config(options.root);
      var reporter = new Istanbul.Reporter(null, path.join(options.root, _config.coverageFolder));
      var sync = true;

      collector.add(req.body);

      if (_config.include) {
        _config.include.forEach(function(file) {
          var includeFile = path.join(options.root, file);
          if (fs.existsSync(includeFile)) {
            collector.add(fs.readJSONSync(includeFile));
          } else {
            console.warn('included test coverage file ' + includeFile + ' does not exist, and will not be included in the coverage report.');
          }
        });
      }

      if (_config.reporters.indexOf('json-summary') === -1) {
        _config.reporters.push('json-summary');
      }

      reporter.addAll(_config.reporters);
      reporter.write(collector, sync, function() {
        var summaryFilePath = path.join(options.root, _config.coverageFolder, 'coverage-summary.json');
        var results = fs.readJSONSync(summaryFilePath);
        res.send(results);
      });
    },
    logError);
};
