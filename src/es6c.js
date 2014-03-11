/**
 * ECMAScript 6 collection polyfill
 * http://people.mozilla.org/~jorendorff/es6-draft.html
 * http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets
 * Alternatives:
 * https://github.com/paulmillr/es6-shim
 * https://github.com/monolithed/ECMAScript-6
 * https://github.com/Benvie/harmony-collections
 * https://github.com/eriwen/es6-map-shim
 * https://github.com/EliSnow/Blitz-Collections
 * https://github.com/montagejs/collections
 * https://github.com/Polymer/WeakMap/blob/master/weakmap.js
 */
!function(){
  var STOREID      = symbol('storeid')
    , KEYS_STORE   = symbol('keys')
    , VALUES_STORE = symbol('values')
    , WEAKDATA     = symbol('weakdata')
    , WEAKID       = symbol('weakid')
    , SIZE         = DESCRIPTORS ? symbol('size') : 'size'
    , uid          = 0
    , wid          = 0
    , tmp          = {}
    , sizeGetter   = {
        size: {
          get: function(){
            return this[SIZE];
          }
        }
      };
  function initCollection(that, iterable, isSet){
    if(iterable != undefined)forOf && forOf(iterable, isSet ? that.add : function(val){
      that.set(val[0], val[1]);
    }, that);
    return that;
  }
  function createCollectionConstructor(key, isSet){
    function F(iterable){
      assertInstance(this, F, key);
      this.clear();
      initCollection(this, iterable, isSet);
    }
    return F;
  }
  function fixCollectionConstructor(fix, Base, key, isSet){
    if(!fix && framework)return Base;
    var F = fix
      // wrap to init collections from iterable
      ? function(iterable){
          assertInstance(this, F, key);
          return initCollection(new Base, iterable, isSet);
        }
      // wrap to prevent obstruction of the global constructors
      : function(itareble){
          return new Base(itareble);
        }
    F[prototype] = Base[prototype];
    return F;
  }
  
  // fix .add & .set for chaining
  function fixAdd(Collection, key){
    var collection = new Collection;
    if(framework && collection[key](tmp, 1) !== collection){
      var fn = collection[key];
      hidden(Collection[prototype], key, function(){
        fn.apply(this, arguments);
        return this;
      });
    }
  }
  function fastKey(it, create){
    return isObject(it)
      ? '_' + (has(it, STOREID)
        ? it[STOREID]
        : create ? defineProperty(it, STOREID, {value: uid++})[STOREID] : '')
      : typeof it == 'string' ? '$' + it : it;
  }
  function createForEach(key){
    return function(callbackfn, thisArg /* = undefined */){
      assertFunction(callbackfn);
      var values = this[VALUES_STORE]
        , keyz   = this[key]
        , names  = keys(keyz)
        , length = names.length
        , i = 0
        , index;
      while(length > i){
        index = names[i++];
        callbackfn.call(thisArg, values[index], keyz[index], this);
      }
    }
  }
  function collectionHas(key){
    return fastKey(key) in this[VALUES_STORE];
  }
  function clearSet(){
    hidden(this, VALUES_STORE, create(null));
    hidden(this, SIZE, 0);
  }
  // 23.1 Map Objects
  if(!isFunction(Map) || !has(Map[prototype], 'forEach')){
    Map = createCollectionConstructor('Map');
    assign(Map[prototype], {
      // 23.1.3.1 Map.prototype.clear()
      clear: function(){
        hidden(this, KEYS_STORE, create(null));
        clearSet.call(this);
      },
      // 23.1.3.3 Map.prototype.delete(key)
      'delete': function(key){
        var index    = fastKey(key)
          , values   = this[VALUES_STORE]
          , contains = index in values;
        if(contains){
          delete this[KEYS_STORE][index];
          delete values[index];
          this[SIZE]--;
        }
        return contains;
      },
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: createForEach(KEYS_STORE),
      // 23.1.3.6 Map.prototype.get(key)
      get: function(key){
        return this[VALUES_STORE][fastKey(key)];
      },
      // 23.1.3.7 Map.prototype.has(key)
      has: collectionHas,
      // 23.1.3.9 Map.prototype.set(key, value)
      set: function(key, value){
        var index  = fastKey(key, 1)
          , values = this[VALUES_STORE];
        if(!(index in values)){
          this[KEYS_STORE][index] = key;
          this[SIZE]++;
        }
        values[index] = value;
        return this;
      }
    });
    // 23.1.3.10 get Map.prototype.size
    defineProperties(Map[prototype], sizeGetter);
  } else {
    Map = fixCollectionConstructor(!new Map([tmp]).size != 1, Map, 'Map');
    fixAdd(Map, 'set');
  }
  // 23.2 Set Objects
  if(!isFunction(Set) || !has(Set[prototype], 'forEach')){
    Set = createCollectionConstructor('Set', 1);
    assign(Set[prototype], {
      // 23.2.3.1 Set.prototype.add(value)
      add: function(value){
        var index  = fastKey(value, 1)
          , values = this[VALUES_STORE];
        if(!(index in values)){
          values[index] = value;
          this[SIZE]++;
        }
        return this;
      },
      // 23.2.3.2 Set.prototype.clear()
      clear: clearSet,
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(value){
        var index    = fastKey(value)
          , values   = this[VALUES_STORE]
          , contains = index in values;
        if(contains){
          delete values[index];
          this[SIZE]--;
        }
        return contains;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: createForEach(VALUES_STORE),
      // 23.2.3.7 Set.prototype.has(value)
      has: collectionHas
    });
    // 23.2.3.9 get Set.prototype.size
    defineProperties(Set[prototype], sizeGetter);
  } else {
    Set = fixCollectionConstructor(new Set([1]).size != 1, Set, 'Set', 1);
    fixAdd(Set, 'add');
  }
  function getWeakData(it){
    return (has(it, WEAKDATA) ? it : defineProperty(it, WEAKDATA, {value: {}}))[WEAKDATA];
  }
  var commonWeakCollection = {
    // 23.3.3.1 WeakMap.prototype.clear()
    // 23.4.3.2 WeakSet.prototype.clear()
    clear: function(){
      hidden(this, WEAKID, wid++);
    },
    // 23.3.3.3 WeakMap.prototype.delete(key)
    // 23.4.3.4 WeakSet.prototype.delete(value)
    'delete': function(key){
      return this.has(key) && delete key[WEAKDATA][this[WEAKID]];
    },
    // 23.3.3.5 WeakMap.prototype.has(key)
    // 23.4.3.5 WeakSet.prototype.has(value)
    has: function(key){
      return isObject(key) && has(key, WEAKDATA) && has(key[WEAKDATA], this[WEAKID]);
    }
  };
  // 23.3 WeakMap Objects
  if(!isFunction(WeakMap) || !has(WeakMap[prototype], 'clear')){
    WeakMap = createCollectionConstructor('WeakMap');
    assign(WeakMap[prototype], assign({
      // 23.3.3.4 WeakMap.prototype.get(key)
      get: function(key){
        return isObject(key) && has(key, WEAKDATA) ? key[WEAKDATA][this[WEAKID]] : undefined;
      },
      // 23.3.3.6 WeakMap.prototype.set(key, value)
      set: function(key, value){
        assertObject(key);
        getWeakData(key)[this[WEAKID]] = value;
        return this;
      }
    }, commonWeakCollection));
  } else {
    WeakMap = fixCollectionConstructor(!new WeakMap([[tmp, 1]]).has(tmp), WeakMap, 'WeakMap');
    fixAdd(WeakMap, 'set');
  }
  // 23.4 WeakSet Objects
  if(!isFunction(WeakSet)){
    WeakSet = createCollectionConstructor('WeakSet', 1);
    assign(WeakSet[prototype], assign({
      // 23.4.3.1 WeakSet.prototype.add(value)
      add: function(value){
        assertObject(value);
        getWeakData(value)[this[WEAKID]] = true;
        return this;
      }
    }, commonWeakCollection));
  } else {
    WeakSet = fixCollectionConstructor(!new WeakSet([tmp]).has(tmp), WeakSet, 'WeakSet', 1);
    fixAdd(WeakSet, 'add');
  }
  $define(GLOBAL, {
    Map: Map,
    Set: Set,
    WeakMap: WeakMap,
    WeakSet: WeakSet
  }, 1);
}();