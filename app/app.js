/* global angular */

var app = angular.module('angularApp', ['pouchdb', 'pouchdbRepeatModule']);
app.run(function (pouchDB, pouchDBDecorators, pouchdbRepeatService) {
    var usersDb = pouchDB('users');
    usersDb.find = pouchDBDecorators.qify(usersDb.find);
    PouchDB.debug.enable('pouchdb:find')
    usersDb.createIndex({
        index: {
            fields: ['doctype', 'name']
        }
    });

    pouchdbRepeatService.addCollection('allUsers', usersDb, {
        selector: {
            doctype: 'admin'
        },
        sort: ['doctype', 'name']
    });

    pouchdbRepeatService.addCollection('customers', usersDb, {
        selector: {
            debut: {'$exists': true}
        },
        sort: [{debut: 'desc'}]
    });
});
/*
 app.run(function (pouchDB) {
 var userDb = pouchDB('users');
 userDb.createIndex({
 index: {
 fields: ['name']
 }
 }).then(function (indexResults) {
 console.log('indexResults', indexResults);
 return userDb.find({
 selector: {
 name: {$gte: null},
 doctype: {$regex: "^Mario"}
 },
 sort: ['name']
 });
 }).then(function (result) {
 console.log('users', result.docs);
 }).catch(function (err) {
 console.info('err', err);
 });
 });
 */