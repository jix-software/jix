/*
 * objects.js
 *
 * Copyright (C) Henri Lesourd 2014, 2018, 2019.
 *
 *  This file is part of JIX.
 *
 *  JIX is free software: you can redistribute it and/or modify it under
 *  the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JIX is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with JIX.  If not, see <http://www.gnu.org/licenses/>.
 */

// JS properties et al.
function setprop(O,NAME,VAL,E,W,C) {
  if (!isString(NAME)) error("setprop");
  if (isUndefined(E)) E=False;
  if (isUndefined(W)) W=False;
  if (isUndefined(C)) C=False;
  Object.defineProperty(O,NAME,{
    "value": VAL,
    "enumerable": E,
    "writable": W,
    "configurable": C
  });
}

var getPrototypeOf=Object.getPrototypeOf || function (O) { // FIXME: Only works with Chrome and Firefox
  return O.__proto__; // FIXME: check when O==Nil and O==Undefined
}
var setPrototypeOf=Object.setPrototypeOf || function (O,PROTO) { // FIXME: Only works with Chrome and Firefox
  O.__proto__=PROTO;
  return O;
}
function hasPrototype(O,P) {
  O=getPrototypeOf(O);
  while (O!=Nil) {
    if (O==P) return True;
    O=getPrototypeOf(O);
  }
  return False;
}

// Types (1)
var SymbolType=Symbol("type");
function _mtypeOf() {
  var OBJ=this;
  if (!isNil(this.typeOf)) OBJ=prototype(this);//Object.getPrototypeOf(this);
  return OBJ[SymbolType];
}
function jsprotoCreate(JSPROTO,TYPE,JSPARENT) {
  var CLASS=Object;
  if (!isNil(JSPARENT)) CLASS=JSPARENT.constructor;
  var RES=JSPROTO;
  if (JSPROTO==Nil) RES=(class extends CLASS {}).prototype;
  RES[SymbolType]=TYPE;
  setprop(RES,"typeOf",_mtypeOf);
  setprop(RES,"init0",function () {},False,True);
//setprop(RES,"init",function () {},False,True); // Should not be there, probably ; only obj() should have an init(), that is inherited by all
  return RES;
}
function jsprotoIsAtom(PROTO) {
  return PROTO==Symbol.prototype
      || PROTO==Boolean.prototype
      || PROTO==Number.prototype
      || PROTO==String.prototype;
}
function jsprotoInheritsAtom(PROTO) {
  if (PROTO==Nil) return False;
  if (jsprotoIsAtom(PROTO)) return True;
  return jsprotoInheritsAtom(Object.getPrototypeOf(PROTO));
}

function _createObject(CONT) {
  var RES=new this.JSPROTO.constructor();
  if (!isUndefined(CONT)) {
    if (!isContainer(CONT)) error("_createObject");
    CONT.store(RES);
  }
  RES.init0();
  return RES;
}
function _consObject(JSPROTO,VAL,CONT) {
  if (!isUndefined(VAL) && constructor(VAL)!=Object && constructor(VAL)!=Array) {
    if (!isContainer(VAL) || !isUndefined(CONT)) error("_consObject");
    CONT=VAL;
    VAL=Undefined;
  }
  var RES=({ "_":_createObject, "JSPROTO":JSPROTO })._(CONT);
  RES.init();
  if (isDefined(VAL)) Object.assign(RES,VAL); // FIXME: doesn't work with POs
  return RES;
}
function _createAtom(VAL,CONT) {
  var RES=new this.JSPROTO.constructor(VAL);
  if (!isUndefined(CONT)) CONT.store(RES);
  RES.init0();
  return RES;
}
function _consAtom(JSPROTO,VAL,CONT) { // FIXME: add the possibility to have a list of attributes, too
  var RES=({ "_":_createAtom, "JSPROTO":JSPROTO })._(VAL,CONT);
  RES.init();
  return RES;
}
var TYPEPROTO=jsprotoCreate(Nil,Nil);
setprop(TYPEPROTO,"init0",function () {
  this.NAME=Nil;
  this.PARENT=Nil;
  this.JSPROTO=Nil;
  this.ATTRS=[];
  setprop(this,"create",_createObject,False,True);
});
var TYPES={};
var type=function (CONS,O) {
  var PARENT=Nil;
  if (!isNil(O)) PARENT=O.PARENT;
  var JSPARENT=Nil;
  if (PARENT!=Nil) JSPARENT=PARENT.JSPROTO;
  var JSPROTO=Nil;
  if (CONS==type) JSPROTO=TYPEPROTO;
  else
  if (!isNil(O) && !isNil(O.JSPROTO)) JSPROTO=O.JSPROTO;
  if (isNil(CONS) || CONS!=type) JSPROTO=jsprotoCreate(JSPROTO,CONS,JSPARENT);
  var CREATE=jsprotoInheritsAtom(JSPROTO)
             ?_createAtom
             :_createObject;
  if (isNil(CONS)) {
    CONS=CREATE==_createObject
         ?function (VAL,CONT) { return _consObject(JSPROTO,VAL,CONT); }
         :function (VAL,CONT) { return _consAtom(JSPROTO,VAL,CONT); };
  }
  JSPROTO[SymbolType]=CONS;
  Object.setPrototypeOf(CONS,TYPEPROTO);
  CONS.init0();
  CONS.PARENT=PARENT;
  CONS.JSPROTO=JSPROTO;
  if (!isNil(O)) {
    if (!isNil(O.NAME)) {
      CONS.NAME=O.NAME;
      TYPES[O.NAME]=CONS;
    }
    CONS.ATTRS=[];
    if (!isArray(O.ATTRS)) { if (!isNil(O.ATTRS)) error("type::ATTRS"); }
                      else if (!empty(O.ATTRS)) CONS.setAttrs(O.ATTRS); // TODO: add the attributes of all the parents, too
    for (var N in O) if (N!="NAME" && N!="PARENT" && N!="JSPROTO" && N!="ATTRS") CONS[N]=O[N];
  }
  delete CONS.name; // TODO: check that there is a long-lasting standard that states we can always do it
  if (!empty(CONS.ATTRS)) {
    setprop(CONS.JSPROTO,"init0",function () {
      for (var I=0;I<length(CONS.ATTRS);I++) {
        var VAL0=CONS.ATTRS[I].VAL0;
        if (isBoxed(VAL0)) {
          var VAL1={};
          if (isArray(VAL0)) VAL1=[];
          Object.assign(VAL1,VAL0);
          VAL0=VAL1;
        }
        if (CONS.ATTRS[I].QUALIF.has("v>")) this.setv(CONS.ATTRS[I].NAME,VAL0); // FIXME: improve this, and do it for all cases
        else
        if (CONS.ATTRS[I].QUALIF.has("v")) this[CONS.ATTRS[I].NAME]=VAL0;
      }
    },
    False,True);
  }
  setprop(CONS,"create",CREATE,False,True);
  return CONS;
}
var obj=type(function (VAL,CONT) { // FIXME: reunite this with _consObject()
               if (!isUndefined(VAL) && constructor(VAL)!=Object) {
                 if (!isContainer(VAL)) {
                   if (constructor(VAL)==Array && isDefined(tree)) return tree(VAL,CONT);
                 }
                 else {
                   if (!isUndefined(CONT)) error("obj.cons");
                   CONT=VAL;
                   VAL=Undefined;
                 }
               }
               var RES=obj.create(CONT);
               if (isDefined(VAL)) Object.assign(RES,VAL); // FIXME: doesn't work with POs
               return RES;
             },
             { "NAME":"obj", "PARENT":Nil, "JSPROTO":Object.prototype, "ATTRS":[] });

type=type(type,
          { "NAME":"type", "PARENT":obj, "ATTRS":[] });
setprop(type,"create",function () { error("type.create"); });

setprop(type,"getByName",function (NAME) {
  return TYPES[NAME];
});

function isType(O) {
  return isa(O,type);
}
setprop(TYPEPROTO,"setMethod",function (NAME,FUNC) {
  setprop(this.JSPROTO,NAME,FUNC,False,True);
},
False,True);

obj.setMethod("init",function () {});

type.setMethod("name",function () {
  return this.NAME;
});
type.setMethod("parent",function () {
  return this.PARENT;
});
type.setMethod("inherits",function (T) {
  var P=this.parent();
  if (!isType(T) || P==Nil) return False;
  if (P==T) return True;
       else return P.inherits(T);
});
type.setMethod("method",function (NAME) {
  var FUNC=this.JSPROTO[NAME]; // FIXME: only get inside own properties of JSPROTO, or rather, in ATTRS
  return isFunction(FUNC)?FUNC:Undefined;
});
type.setMethod("super",function (NAME) {
  return this.parent().method(NAME);
});
obj.setMethod("super",function (NAME,...PARMS) {
  var M=typeOf(this).super(NAME);
  if (isNil(M)) error("super::method "+NAME+" doesn't exists in class "+typeOf(this).parent().name());
  return M.apply(this,PARMS);
});

// JS types (2)
var nil=type(function (VAL) {
               var RES=boxit(VAL);
               if (!isNil(RES.valueOf())) error("nil");
               return RES;
             },
             { "NAME":"nil", "PARENT":obj, "ATTRS":[] });

var BoxedNil=nil.create(),BoxedUndefined=nil.create();

nil.setMethod("valueOf",function () {
  if (this==BoxedUndefined) return Undefined;
  if (this==BoxedNil) return Nil;
  error("nil.valueOf");
});

function isUnboxed(O) {
  if (O==Nil/*Nil or Undefined*/) return True;
  return isAtom(O) && O.valueOf()===O;
}
function isBoxed(O) { // FIXME: to make files independent from objects, put this in basics
  if (O==Nil) return False;
  return !isUnboxed(O);
}
function boxed(O) {
  if (O==Nil) return boxit(O);
  if (isUnboxed(O)) return Object(O);
  return O;
}

function boxit(O) {
  if (isUndefined(O)) return BoxedUndefined;
  if (eqNil(O)) return BoxedNil;
  return O;
}
function typeOf(O) {
  O=boxit(O);
  if (!isFunction(O.typeOf)) return obj;
  return O.typeOf();
}

// JS types (3)
var symb=type(function (S) {
                return Symbol(S);
              },
              { "NAME":"symb", "PARENT":obj, "JSPROTO":Symbol.prototype, "ATTRS":[] });
var bool=type(function (B,CONT) {
                 return bool.create(B,CONT);
              },
              { "NAME":"bool", "PARENT":obj, "JSPROTO":Boolean.prototype, "ATTRS":[] });
var num=type(function (N,CONT) {
               return num.create(N,CONT);
             },
             { "NAME":"num", "PARENT":obj, "JSPROTO":Number.prototype, "ATTRS":[] });
var str=type(function (S,CONT) {
               return str.create(S,CONT);
             },
             { "NAME":"str", "PARENT":obj, "JSPROTO":String.prototype, "ATTRS":[] });
var array=type(function (VAL) { // FIXME: this constructor should take CONT into account
                 if (isString(VAL)) return explode(VAL);
                 var RES=[];
                 if (isDefined(VAL)) Object.assign(RES,VAL); // FIXME: doesn't work with POs
                 return RES;
               },
               { "NAME":"array", "PARENT":obj, "JSPROTO":Array.prototype, "ATTRS":[] });

type.setMethod("isAtom",function (STRICT) {
  if (STRICT) return this==nil || this==symb || this==bool || this==num || this==str;
         else return this.isAtom(True) || this.inherits(nil)
                                        || this.inherits(symb) || this.inherits(bool)
                                        || this.inherits(num) || this.inherits(str);
});
type.setMethod("root",function () {
  if (this.isAtom(True) || this==array) return this;
                                   else if (this.parent()==Nil) return obj;
                                                           else return this.parent().root();
});

// Sets
var set=type(function (VAL) {
               if (isUndefined(VAL)) VAL=[];
               return set.create(implode(VAL)); // FIXME: everywhere with sets, when strings are given, eliminate duplicated elements
             },
             { "NAME":"set", "PARENT":str, "ATTRS":[], "ELEMS":Undefined });

function isSet(O) {
  return isa(O,set);
}
set.setMethod("contains",function (ELTS) { // FIXME: make contains() compatible with this method
  if (!isString(ELTS)) error("set.contains");
  ; // TODO: test that all elements in ELTS are part of this.ELEMS
  for (var I=0;I<length(ELTS);I++) if (!contains(this,ELTS[I])) return False;
  return True;
});
set.setMethod("has",set.method("contains"));

set.setMethod("inter",function (S) {
  ; // TODO: test this.ELEMS is compatible with S.ELEMS
  var A=[];
  for (var I=0;I<length(this);I++) if (contains(S,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});
set.setMethod("union",function (S) {
  ; // TODO: test this.ELEMS is compatible with S.ELEMS
  var A=explode(S);
  for (var I=0;I<length(this);I++) if (!contains(A,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});
set.setMethod("minus",function (S) {
  ; // TODO: test this.ELEMS is compatible with S.ELEMS
  var A=[];
  for (var I=0;I<length(this);I++) if (!contains(S,this[I])) A.push(this[I]);
  return typeOf(this)(A);
});

setprop(set,"parse",function (S) { // FIXME: adapt the function parse() to take parse() methods into account
  error("set.parse");
});
set.setMethod("serialize",function (VAL) { // Call it also str(), and adapt str() accordingly
  error("set.serialize");
});

function tset(NAME,ELEMS) { // TODO: parse ELEMS if it is a string
  if (!isArray(ELEMS)) error("tset");
  return RES=type(function (VAL) {
                    if (isUndefined(VAL)) VAL=[];
                    return type.getByName(NAME).create(implode(VAL)); // FIXME: improve this
                  },
                  { "NAME":NAME, "PARENT":set, "ATTRS":[], "ELEMS":ELEMS });
}

// Addrs
var qualif=tset("qualif",[
  "v", // Var
  "c", // Const
  "i", // Immediate
  "p", // Public
  "a", // Parm
  "*", // Multi
  "!", // Set
  ">", // PO
  "l"  // Volatile
]);

function isQualif(O) {
  return isa(O,qualif);
}

var addr=type(function (NAME,TYPE,QUALIF,VAL0) {
                if (isUndefined(TYPE)) return addr.obj(NAME);
                else {
                  var RES=addr.create();
                  RES.init(NAME,TYPE,QUALIF,VAL0);
                  return RES;
                }
              },
              { "NAME":"addr", "PARENT":obj, "ATTRS":[] });

addr.setMethod("init",function (NAME,TYPE,QUALIF,VAL0) {
  if (isUndefined(TYPE)) TYPE=str;
  if (isString(QUALIF)) QUALIF=qualif(QUALIF);
  else
  if (!isQualif(QUALIF)) error("addr.init");
  Object.assign(this,{ "NAME":NAME, "TYPE":TYPE, "QUALIF":QUALIF, "VAL0":VAL0 });
});
setprop(addr,"obj",function (S) { // E.g.: cp*! A:num=1234
  S=trim(S," ",True,True);
  var A=splitOnce(S," ",["v",Undefined]);
  var Q=qualif(A[0]);
  if (Q.inter("vci")=="") Q=Q.union("v");
  A=splitOnce(A[1],"=",[Undefined,Undefined]);
  var VAL0=eval("(function () { return "+A[1]+"; })()"); // because eval("2+2")==4, but eval("{}")==undefined
  A=splitOnce(A[0],":",[Undefined,"obj"]);
  var NAME=A[0],TYPE=type.getByName(A[1]);
  return addr(NAME,TYPE,Q,VAL0);
});

function isAddr(O) {
  return isa(O,addr);
}

// Types (2)
type.setMethod("attr",function (NAME) {
  return find(this.ATTRS,function (O) { return O.NAME==NAME; });
});
addr.setMethod("has",function (Q) {
  return this.QUALIF.has(Q);
});
type.setMethod("attrHas",function (NAME,Q) {
  var A=this.attr(NAME);
  return isDefined(A) && A.has(Q);
});
  
type.setMethod("setAttr",function (A) {
  if (isString(A)) A=addr(A);
  if (!isAddr(A)) error("setAttr");
  if (!isNil(this.attr(A.NAME))) error("type.setAttr");
  this.ATTRS.push(A);
  if (A.QUALIF.has("c")) {
    setprop(this.JSPROTO,A.NAME,A.VAL0,False,True/*False ; FIXME: assigning RO methods to obj prevents other modules to actually redefine methods of the same name ; in that case, it should be R/W, but stay RO for either data attributes, or even all attributes of the class obj*/);
  }
});

type.setMethod("attrs",function () {
  return this.ATTRS;
});
type.setMethod("setAttrs",function (L) {
  for (var I=0;I<length(L);I++) this.setAttr(L[I]);
});

type.setAttrs(["NAME","PARENT","JSPROTO","ATTRS"]);
addr.setAttrs(["NAME","TYPE","QUALIF","VAL0"]);

// Functions
var func=type(function () {
               return func.create();
             },
             { "NAME":"func", "PARENT":obj, "JSPROTO":Function.prototype, "ATTRS":[] });

setprop(TYPEPROTO,"setMethod",function (NAME,FUNC) {
  if (!isFunction(FUNC)) error("setMethod");
  this.setAttr(addr(NAME,func,"c",FUNC));
});

// Objects (1)
/*setprop(obj,"create",function () {
  error("obj.create(!Yet)");
});*/
function isObject(O) {
  return isBoxed(O);
}

setprop(obj,"getById",function (ID) {
  error("obj.getById(!Yet)");
});

// Objects (2)
var create=obj; // Keep this (?)

function isa(O,T) {
  return typeOf(O)==T || typeOf(O).inherits(T);
}

obj.setMethod("equalAttrs",function (O) {
  var RES=True;
  for (var N in O) if (this[N]!=O[N]) RES=False;
  return RES;
});
obj.setMethod("setAttrs",function (O,NOSLOTS) {
  if (isUndefined(NOSLOTS)) NOSLOTS={};
  var RES=False;
  if (!isUndefined(O)) for (var N in O) if (isUndefined(NOSLOTS[N])) {
    if (this[N]!=O[N]) {
      this[N]=O[N];
      RES=True;
    }
  }
  return RES;
});

var oflags=tset("oflags",[
  "d" // Deleted
]);

var MEMORY;
function memory() {
  return MEMORY;
}

function copy(O,MODE,CONT) {
  if (isContainer(MODE)) {
    if (!isUndefined(CONT)) error("copy");
    CONT=MODE;
    MODE=Undefined;
  }
  if (isUndefined(CONT)) CONT=MEMORY;
  return CONT.copy(O,MODE);
}
function move(O,MODE,CONT) {
  if (isContainer(MODE)) {
    if (!isUndefined(CONT)) error("move");
    CONT=MODE;
    MODE=Undefined;
  }
  if (isUndefined(CONT)) CONT=MEMORY;
  return CONT.move(O,MODE);
}

function parse(S,CONT) {
  return parsef(S,CONT);
}
function serialize(O,MODE) {
  if (isUndefined(MODE)) MODE="full";
  if (!contains(["full","flat*","flat"],MODE)) error("serialize");
  var FMT=[["*",MODE=="flat*"?"flat":MODE,[]]];
  if (MODE=="flat") {
    sfinit();
    serializefBis(O,"flat",[]);
    return sfresult();
  }
  else return serializef(O,FMT);
}

function isDeleted(O) {
  return O.hasFlags("d");
}
obj.setMethod("delete",function (MODE) { // TODO: detect loops
  if (isUndefined(MODE)) MODE="flat";
  if (isUnboxed(this)) return;
  var ISARR=isArray(this);
  for (var N of sfattrs(this)) {
    var VAL=this[N],PO=True;
    if (!(ISARR && isNumStr(N))) PO=typeOf(this).attrHas(N,">");
    if (isBoxed(VAL) && MODE=="flat" && !PO) error("delete(!PO)::"+N);
    if (isBoxed(VAL) && (MODE=="full" || PO)) {
      VAL.delete(MODE);
    }
  }
  this.addFlags("d");
});
setprop(obj,"delete",function (O,MODE) {
  if (isUnboxed(O)) O.delete(MODE);
});

// Trees
function tree(A,CONT) {
  if (isAtom(A) || constructor(A)!=Array && !isTemplate(A)/*FIXME: tree() should not need to know exceptional datatypes like template()*/ || length(A)<1 || !isType(A[0])) return A; // FIXME: should not return the array as such when there is no tag, there should be a default datatype (e.g. div, or columns (?) for markup)
  var O=length(A)==1?{}:A[1];
  if (constructor(O)!=Object) error("tree(1)");
  O.$=[];
  for (var I=2;I<length(A);I++) O.$.push(tree(A[I],CONT)); // FIXME: should be able to work by means of doing directly push()es in RES.$ ; currently, it shits because of the expand(), which is only used in the constructor.
  var RES=A[0](O,CONT);
  if (!isArray(RES["$"]) && length(A)>2) error("tree(2)");
  return RES;
}
