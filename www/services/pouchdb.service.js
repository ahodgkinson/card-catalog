// pouchdb.service.js

(function() {

  'use strict';

  angular.
    module('cardCatalog.pouchdbService', ['ngResource']).
    service('pouchdbService', pouchdbService );

  pouchdbService.$inject = [
    '$q',
    '$ionicPlatform',
    'prefsService',
    'pouchDB',
    'util',
    'log'
  ];

  function pouchdbService(
    $q,
    $ionicPlatform,
    prefsService,
    pouchDB,
    util,
    log)
  {
    log.log("pouchdbService: start");

    var config = {
      dbName: 		'books',
      dbOpts:		{adapter: 'idb', timeout: 12000, iosDatabaseLocation: 'default'},

      hexKeyLength:	16,	// Number of hex digits to append to new keys

      uploadOpts:	{}, // For tuning uploads (unused)
      downloadOpts:	{}, // For tuning download (unused)
    };

    var db = null;
    var service = {
      put: 		put,
      get: 		get,

      // getWithConflicts: getWithConflicts,
      remove: 		remove,

      getByViewKey:      getByViewKey,		// Used for realtime validation

      getRecordCounts:   getRecordCounts,
      count: 		count,

      purge: 		purge,
      upload: 		upload,
      download: 	download,

      createFieldView: createFieldView
    };

    activate();

    function activate() {
      log.log("pouchdbService.activate: start");

      create();

      createSearchViews().then(function(res) {
        log.log("pouchdbService.activate: createSearchViews: OK");
      }, function(err) {
        log.log("pouchdbService.activate: createSearchViews: ERROR: "+JSON.stringify(err));
      });
    }

    // -- Setup PouchDB Database

    function create() { // No return value
      log.log("pouchdbService.create: dbName: " + config.dbName);
      db = new pouchDB(config.dbName, config.dbOpts);
      db.info().then( console.log.bind(console));
      log.log("pouchdbService.create: return");
    }

    function getCouchDBUrl() {
      var url = prefsService.getServer();
      if (prefsService.getServerAuth()) {
        // Couchdb user_name = user name + database name
        url = url.replace("//",
          "//" + prefsService.getUserName().replace("@","%40") + // HTML escape @ in email address
          "-"  + url.match(/[^/]+[/]*$/)[0].replace("/","") +     // extract database name from url
          ":"  + prefsService.getPassword() +"@");
      }
      return url;
    }

    // -- Upload: Returns promise that resolves to the number of records transferred

    function upload() {
      var dst = getCouchDBUrl();
      var deferred = $q.defer();

      log.log("pouchdbService.upload: server: "+dst);
      log.log("pouchdbService.upload: uploadOpts: "+JSON.stringify(config.uploadOpts));

      db.replicate.to(dst, config.uploadOpts).then( function(res) {
        if (res.ok) {
          log.log("pouchdbService.upload: success: docs_read:    "+res.docs_read);
          log.log("pouchdbService.upload: success: docs_written: "+res.docs_written);
          deferred.resolve(res.docs_written);
        } else {
          log.toast("Upload server error: "+res.errors[0].message);
          deferred.reject(res.errors[0]);
        }
      }, function(err) {
        log.toast("Upload error: "+err.message);
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Download: Returns promise that resolves to the number of records transferred

    function download() {
      var dst = getCouchDBUrl();
      var deferred = $q.defer();

      log.log("pouchdbService.download: server: "+dst);
      log.log("pouchdbService.download: downloadOpts: "+JSON.stringify(config.downloadOpts));

      db.replicate.from(dst, config.downloadOpts).then( function(res) {
        if (res.ok) {
          log.log("pouchdbService.download: success: docs_read:    "+res.docs_read);
          log.log("pouchdbService.download: success: docs_written: "+res.docs_written);
          deferred.resolve(res.docs_written);
        } else {
          log.toast("Download server error: : "+res.errors[0].message);
          deferred.reject(res.errors[0]);
        }
      }, function(err) {
        log.toast("Download error: : "+err.message);
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Purge: Destroy & re-create the DB. Does not affect the server

    function purge() {
      log.log("pouchdbService.purge:");
      var deferred = $q.defer();

      db.destroy().then(function (result) {
        log.log("pouchdbService.purge: success");
        log.log("pouchdbService.purge: calling create");
        create();
        log.log("pouchdbService.purge: calling createSearchViews");
        createSearchViews().then( function() {
          log.log("pouchdbService.purge: success: resolving promise");
          deferred.resolve("ok");
        }, function(err) {
          log.error("pouchdbService.purge: ERROR (createSearchViews): "+JSON.stringify(err));
          deferred.reject(err);
        });
      },function (err) {
        log.error("pouchdbService.purge: ERROR (db.destroy): "+JSON.stringify(err));
        deferred.reject(err);
      });

      log.log("pouchdbService.purge: return");
      return deferred.promise;
    }

    // -- Get record count, by record type
    //
    // Example response:
    //   res =  {"rows":[{"value":92,"key":"file"},{"value":66,"key":"scan"},{"value":61,"key":"tag"}]}

    function getRecordCounts(with_conflicts) {
      log.log("pouchdbService.getRecordCounts");

      var view = with_conflicts ? "stats/conflicts" : "stats/counts";
      var opts = {include_docs: false, group: true, group_level: 1};

      log.log("pouchdbService.getRecordCounts: start: view=\""+view+"\", opts="+JSON.stringify(opts));

      var deferred = $q.defer();
      db.query(view, opts).then( function(res) {
        log.log("pouchdbService.getRecordCounts: success: res: "+JSON.stringify(res));

        var counts = {};
        res.rows.forEach( function(row) {
          counts[row.key] = row.value;
        });
        deferred.resolve(counts);
      }, function(err) {
        log.error("pouchdbService.getRecordCounts: ERROR: "+JSON.stringify(err));
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Get total number of PouchDB records

    function count() {
      log.log("pouchdbService.count: start");
      var deferred = $q.defer();

      db.allDocs().then(function (res) {
        log.log("pouchdbService.count: length: "+res.rows.length);
        deferred.resolve(res.rows.length);
      },function (err) {
        log.error("pouchdbService.count: ERROR: "+JSON.stringify(err));
        deferred.reject(err);
      });
      log.log("pouchdbService.count: return");
      return deferred.promise;
    }

    // -- Get an array records based on view name and an optional key value

    function getByViewKey(view, key, options) {
      log.log("pouchdbService.getByViewKey: start: view=\""+view+"\" key=\""+key+"\" options="+JSON.stringify(options));
      var deferred = $q.defer();
      if (util.empty(options)) {
        options = {};
      }
      if (!util.empty(key)) {
        options['key'] = key;
      }
      if (options['include_docs'] === undefined) {
        options['include_docs'] = true;
      }

      log.log("pouchdbService.getByViewKey: options: "+JSON.stringify(options));

      db.query(view, options).then( function(res) {
        log.log("pouchdbService.getByViewKey: success: rows: "+res.rows.length);
        var recs = [];
        res.rows.forEach( function(rec) {
          if (options.reduce) {
            recs.push(rec.value);   // There is only one record
          } else {
            recs.push(rec.doc);
          }
        });
        deferred.resolve(recs);
      }, function(err) {
        log.error("pouchdbService.getByViewKey: ERROR: "+JSON.stringify(err));
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Get a record indexed by key

    function get(key, options) {
      if (options === undefined) { options = {}; }
      log.log("pouchdbService.get: start: key="+key+" options="+JSON.stringify(options));

      var deferred = $q.defer();
      db.get(key, options).then( function(res) {
        log.log("pouchdbService.get: success: " + key);
        deferred.resolve(res);
      }, function(err) {
        if (err.status >= 500) {
          log.error("pouchdbService.get: ERROR: key: "+key+": err: "+JSON.stringify(err));
        } else {
          log.warn("pouchdbService.get: WARNING: key: "+key+": warn: "+JSON.stringify(err));
        }
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Get Records with conflict
    //
    // Returns a promise with an object of revisions indexed by _rev in resolve

    function getWithConflicts(key) {
      log.log("pouchdbService.getWithConflicts: start: key="+key);

      var revisions;
      var deferred = $q.defer();
      db.get(key, {'conflicts': true}).then( function(res) {
        revisions = {};
        revisions[res._rev] = res;
        getConflicts(res, revisions).then(function() {
          log.log("pouchdbService.getWithConflicts: getConflicts success");
          deferred.resolve(revisions);
        }, function(err) {
          log.error("pouchdbService.getWithConflicts: getConflicts error"+JSON.stringify(err));
          deferred.reject(err);
        });
      }, function(err) {
        if (err.status >= 500) {
          log.error("pouchdbService.getWithConflicts get: ERROR: key: "+key+": err: "+JSON.stringify(err));
        } else {
          log.warn("pouchdbService.getWithConflicts get: WARNING: key: "+key+": warn: "+JSON.stringify(err));
        }
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // Fills up the revision object with the conflicted revisions of record
    // Return a promise
    function getConflicts(record, revisions) {
      log.log("pouchdbService.getRevisions: start: key="+record._id+" revs="+JSON.stringify(record._conflicts));

      var tasks = [];
      angular.forEach(record._conflicts, function(rev_id) {
        tasks.push( function() {
          return db.get(record._id, {'rev': rev_id}).then( function(revision) {
            revisions[revision._rev] = revision;
          });
        });
      });
      return $q.serial(tasks);
    }

    // -- Write a record

    function put(type, rec) {
      log.log("pouchdbService.put: rec: _id: "+rec._id);
      log.log("pouchdbService.put:   type: "+type);
      log.log("pouchdbService.put:   rec:  "+JSON.stringify(rec));

      if ( type ) {

        // -- Setup created_by & updated_by

        rec.updated_by = prefsService.getUserName();
        if ( util.empty(rec.created_by)) {
          rec.created_by = rec.updated_by;
        }

        // -- Setup created_at & updated_at

        rec.updated_at = util.now();
        if ( util.empty(rec._id)) {
          rec.created_at = rec.updated_at;
          rec._id = newId(type, rec);
        }

      } else {
        log.log("pouchdbService.put: rec: design or misc. document: _id: "+rec._id);
      }

      if ( db == null ) {
        throw("pouchdbService.put: ERROR: DB is null");
      }

      var deferred = $q.defer();
      db.put(rec).then( function(res) {
        deferred.resolve(res);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Delete a record

    function remove(rec) {
      log.log("pouchdbService.remove: _id="+rec._id+", _rev="+rec._rev);

      var deferred = $q.defer();
      db.remove(rec).then( function(res) {
        log.log("pouchdbService.remove: success: res: "+JSON.stringify(res));
        deferred.resolve(res);
      }, function(err) {
        log.toast("Delete error: "+JSON.stringify(err));
        deferred.reject(err);
      });
      return deferred.promise;
    }

    // -- Get/Create (design) doc
    //
    // Create pouchDB document if it does not exist, always pass the document in resolve on success

    function getCreateDoc(id, value) {
      var deferred = $q.defer();

      get(id).then(
        function(res) {
          log.log("pouchdbService.getCreateDoc: get success: id: " + id);
          deferred.resolve(res);
        }, function(err) {
          if (err.status == 404) {// not found
            put(null,value).then(
              function(res) {
                log.log("pouchdbService.getCreateDoc: put success: " + id);
                value._id = res.id;
                value._rev = res.rev;
                deferred.resolve(value);
              }, function(err) {
                log.error("pouchdbService.getCreateDoc: put ERROR: id: " + id + ": " + JSON.stringify(err));
                deferred.reject(err);
              }
            );
          } else {
            log.error("pouchdbService.getCreateDoc: get ERROR: id: " + id + ": "  + JSON.stringify(err));
            deferred.reject(err);
          }
        }
      );
      return deferred.promise;
    }

    // Creates view if it does not exist, return the view path in result on success

    function getCreateView(ddocName, viewName, viewValue) {
      var ddocId = "_design/"+ddocName;
      var ddocValue = {
        "_id": ddocId,
        "language" : "javascript"
      };
      var viewPath = ddocName+"/"+viewName;

      log.log("pouchdbService.getCreateView: start: ddocId="+ddocId+" viewName="+viewName);
      var deferred = $q.defer();

      getCreateDoc(ddocId, ddocValue).then(
        function(ddoc) {
          if (ddoc.views === undefined || ddoc.views[viewName] === undefined) {
            if (ddoc.views === undefined) {
              ddoc.views = {};
            }
            ddoc.views[viewName] = viewValue;
            put(null,ddoc).then(
              function(res) {
                log.log("pouchdbService.getCreateView: view created: " + viewPath);
                deferred.resolve(viewPath);
              }, function(err) {
                log.error("pouchdbService.getCreateView: put ERROR: " + viewPath + ": "+ JSON.stringify(err));
                deferred.reject(err);
              }
            );
          } else {
            log.log("pouchdbService.getCreateView: view already exists: " + viewPath);
            deferred.resolve(viewPath);
          }
        }, function(err) {
          log.error("pouchdbService.getCreateView: getCreateDoc ERROR: " + viewPath + ": " + JSON.stringify(err));
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }

    function createSearchViews() {
      log.log("pouchdbService.createSearchViews: ddocName: start");

      var views = [ {
          "ddocName":  "stats",
          "viewName":  "counts",
          "viewValue": { "map": "function(doc) { emit(doc._id.replace(/-.*/, '')); }", "reduce": "_count" }
        }, {
          "ddocName":  "stats",
          "viewName":  "conflicts",
          "viewValue": { "map": "function(doc) { if (doc._conflicts) { emit(doc._id.replace(/-.*/, '')); } }", "reduce": "_count" }
        }
      ];

      var promises = $q.when();
      views.forEach( function(ddoc) {
        log.log( "pouchdbService.createSearchViews: ddocName: "+ddoc["ddocName"]);
        promises = promises.then( createSearchViewFactory(ddoc) );
      });

      function createSearchViewFactory(ddoc) {
        return function() {
          log.log( "pouchdbService.createSearchViewFactory: start: ddocName: "+ddoc["ddocName"]);
          return getCreateView(ddoc["ddocName"], ddoc["viewName"], ddoc["viewValue"]);
        };
      }

      return promises;
    }

    // -- Create view by a field filtered with the table name

    function createFieldView(table, fields, emitUndef, conflicts) {
      log.log("pouchdbService.createFieldView: start: table="+table+" fields="+fields.join());
      log.log("pouchdbService.createFieldView: start:   emitUndef: "+(emitUndef?"true":"false"));
      log.log("pouchdbService.createFieldView: start:   conflicts: "+(conflicts?"true":"false"));

      var viewName = "by_"+fields.join('_');
      var fieldMap = fields.map(function(field) { return 'doc.'+field; }).join("+'-'+");
      var undef = "";
      if (!emitUndef) {
        undef = fields.map(function(field) { return ' && doc.'+field+' !== undefined'; }).join("");
      }
      var conflict_if = "";
      if (conflicts) {
        viewName = "conflicts_" + viewName;
        conflict_if = " && doc._conflicts";
      }
      var mapFunc = "function(doc) { if (doc._id.match(/^"+table+"-/)"+undef+conflict_if+") { emit("+fieldMap+", null); } }";
      var viewValue = { "map": mapFunc };

      log.log("pouchdbService.createFieldView: viewName: " +viewName);
      log.log("pouchdbService.createFieldView: viewValue: " +viewValue);

      return getCreateView(table, viewName, viewValue);
    }

    // -- Create a new record ID

    function newId(type, rec) {
      var id;
      if (type == "book") { // Key: "book-{isbn}-{user}"
        id = "book-" + rec["isbn"] + "-" + prefsService.getUserName()
      } else {
        var message = "Internal error: pouchdbService.newId: type = "+type;
        alert(message);
        throw message;
      }
      log.log("pouchdbService.newId: id: "+id);
      return id;
    }

    return service;
  }

})();

