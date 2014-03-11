{banner}   = require './config'
{readFile} = require \fs
modules    = <[init es5 global es6 es6c promise symbol reflect iterator extendedObjectAPI timers immediate function deferred binding object array arrayStatics number string date extendCollections console]>
module.exports = (opt, next)-> let @ = opt
  @init = on
  import {+global, +es5, +timers, +node} if @all
  import {+\function, +deferred, +binding, +object, +array, +arrayStatics, +number, +string, +date, +es6, +es6c, +promise, +symbol, +reflect, +iterator, +extendedObjectAPI, +extendCollections, +immediate, +console} if @node
  import {+iterator} if @reflect or @promise
  import {+immediate} if @promise
  include = modules.filter ~> @[it]
  scripts = [] <~ Promise.all include.map (module)->
    resolve, reject <- new Promise _
    error, file <- readFile "src/#module.js"
    if error => reject error else resolve file
  .then _, console.error
  scripts .= map (script, key)-> """
    /*****************************
     * Module : #{include[key]}
     *****************************/\n
    #script
    """
  next """
    #banner
    !function(global, framework, undefined){
    'use strict';
    #{scripts * '\n\n'}
    }(typeof window != 'undefined' ? window : global, #{!@library});
    """