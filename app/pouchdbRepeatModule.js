/* global angular */
var pouchdbRepeatService = function ($rootScope) {
    var self = this;
    self.collections = {};
    self.addCollection = function (collectionName, pouchdbInstance, defaultQuery) {
        self.collections[collectionName] = {
            db: pouchdbInstance,
            query: defaultQuery || {selector: {_id: {$gte: ''}}}
        };
    };
    self.activateEventsForCollection = function (collectionName) {
        var collection = self.collections[collectionName];
        if (collection.events && collection.events === true) {
            return false;
        }
        var changeOptions = {
            live: true,
            include_docs: true,
            since: 'now'
        };
        collection.events = true;
        collection.event = collection.db.changes(changeOptions).on('change', function (change) {
            $rootScope.$broadcast('pouchdb:'+collectionName+':change', change);
        });
    };
    self.deactivateEventsForCollection = function (collectionName) {
        var collection = self.collections[collectionName];
        if (!collection.events || collection.events === false) {
            return false;
        }
        collection.events = false;
        collection.event.cancel();
    };

    self.getCollection = function (collectionName) {
        if (self.collections.hasOwnProperty(collectionName)) {
            self.activateEventsForCollection(collectionName);
            return self.collections[collectionName];
        }
        throw new Error('Unregistered collection: "' + collectionName + '" requested.');
    };
};
var pouchdbRepeat = function (pouchdbRepeatService, $rootScope) {

    var pouchdbRepeatDirectiveLink = function (scope, element, attrs, controller, transcludeFn) {
        //keep track of domRows for scope destroy
        var domRows = [];
        var domWrapper = element.parent();
        var paramString = attrs.pouchdbRepeat;
        var params = paramString.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/);
        //@todo do some checking here to enforce the syntaxt docNamespace in collectionName
        var docNamespace = params[1];
        var collectionName = params[2];
        var collection = pouchdbRepeatService.getCollection(collectionName);
        //@todo get query and sort from directive and pass to find plugin
        $rootScope.$on('pouchdb:'+collectionName+':change', function(event, change){
            console.info('pouchdb:'+collectionName+':change', change);
            exec();
        });
        element.on('destroy', function(){
            blankslate();
            pouchdbRepeatService.deactivateEventsForCollection(collectionName);
        });
        var blankslate = function(){
            domWrapper.html('');
            angular.forEach(domRows, function(domRow){
                domRow.scope.$destroy();
            });
        };
        var exec = function(){
            blankslate();
            collection.db.find(collection.query).then(function (result) {
                return result.docs.map(function (doc) {
                    return doc;
                });
            }).then(function (docs) {
                docs.forEach(function (doc, domRowIndex) {
                    // create a new scope for every element in the collection.
                    var domRowScope = scope.$new(true);
                    // pass the current element of the collection into that scope
                    domRowScope[docNamespace] = doc;
                    transcludeFn(domRowScope, function (clone) {
                        // clone the transcluded element and add it to the dom
                        domWrapper.append(clone);
                        //keep track of domRows for scope destroy
                        var domRow = {
                            el: clone,
                            scope: domRowScope
                        };
                        domRows.push(domRow);
                    });
                });
            });
        };
    };
    var dir = {
        restrict: 'A',
        transclude: 'element',
        link: pouchdbRepeatDirectiveLink
    };
    return dir;
};
var app = angular.module('pouchdbRepeatModule', []);
app.service('pouchdbRepeatService', ['$rootScope',pouchdbRepeatService]);
app.directive('pouchdbRepeat', ['pouchdbRepeatService', '$rootScope', pouchdbRepeat]);