/*
 * containers.js
 *
 * Copyright (C) Henri Lesourd 2018, 2019.
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

// Containers
var container=type(function (NAME,FNAME,CATEG,SRV) {
                     var RES=container.create();
                     RES.IDCONT=container.LASTIDCONT++;
                     if (isString(NAME) && isString(FNAME)) { // From file
                       if (!isString(CATEG)) SRV=CATEG,CATEG=FNAME,FNAME=NAME,NAME=Undefined;
                       RES.load(FNAME,CATEG);
                     }
                     else
                     if (isContainer(NAME) || isContainer(FNAME)) { // Derived container
                       var CONT=FNAME;
                       if (isContainer(NAME)) CONT=NAME,NAME=Undefined,SRV=FNAME;
                       else {
                         if (!isString(NAME)) error("container.cons(1)");
                         SRV=CATEG;
                       }
                       RES.setParent(CONT);
                       error("container.derived(!Yet)");
                     }
                     else
                     if (isUndefined(NAME) || isString(NAME) || isServer(NAME)) { // Pure container
                       if (isServer(NAME)) SRV=NAME;
                       else {
                         SRV=FNAME;
                       }
                     }
                     else error("container.cons(2)");
                     RES.NAME=NAME;
                     if (!isUndefined(SRV)) {
                       if (!isServer(SRV)) error("container.cons(3)");
                       SRV.attach(RES);
                     }
                     return RES;
                   },
                   { "NAME":"container", "PARENT":obj,
                     "ATTRS":["SRV",
                              "IDCONT","PARENT",
                              "NAME","FNAME=''",
                              "LASTID=0",
                              "QMETHODS={}",
                              "$={}"] });

container.LASTIDCONT=0; // FIXME: implement classes that remember their instances & set id to them

function isContainer(O) {
  return isa(O,container);
}

container.setMethod("getById",function (ID) {
  return this.$[ID];
});
container.setMethod("parent",function () {
  return this.PARENT;
});
container.setMethod("setParent",function (CONT) {
  if (!isContainer(CONT)) error("setParent");
  this.PARENT=CONT;
});
container.setMethod("qmethod",function (NAME) {
  return this.QMETHODS[NAME];
});
container.setMethod("setQMethod",function (NAME,FUNC) {
  this.QMETHODS[NAME]=FUNC;
});

// Store
var SymbolCont=sy("^$"),
    SymbolId=sy("+o"),
    SymbolFlags=sy("%"),
    SymbolUp=sy("^");

obj.setMethod("containerOf",function () {
  return this[SymbolCont];
});
obj.setMethod("setContainerOf",function (CONT) {
  if (!isContainer(CONT)) error("setContainerOf");
  if (this.containerOf()) error("setContainerOf(2)");
  this[SymbolCont]=CONT;
  CONT.$[this.getId()]=this;
});
obj.setMethod("getId",function () {
  return this[SymbolId];
});
obj.setMethod("setId",function (ID) {
  var CONT=this.containerOf(),ID0=this.getId();
  if (ID0 && !isNil(CONT)) {
    delete CONT.$[ID0];
  }
  this[SymbolId]=ID;
  if (ID0 && !isNil(CONT)) {
    if (!isUndefined(CONT.$[ID])) error("obj.setId");
    CONT.$[ID]=this;
  }
});
obj.setMethod("flags",function () {
  var F=this[SymbolFlags];
  if (isNil(F)) return set(""); else return F;
});
obj.setMethod("hasFlags",function (F) {
  return this.flags().has(F);
});
obj.setMethod("setFlags",function (FLAGS) {
  if (isString(FLAGS)) FLAGS=oflags(FLAGS);
  this[SymbolFlags]=FLAGS;
  if (this[SymbolFlags]=="") delete this[SymbolFlags];
});
obj.setMethod("addFlags",function (FLAGS) {
  if (isUndefined(this.flags())) this.setFlags(FLAGS);
                            else this.setFlags(this.flags().union(FLAGS));
});
obj.setMethod("delFlags",function (FLAGS) {
  if (isDefined(this.flags())) this.setFlags(this.flags().minus(FLAGS));
});
obj.setMethod("up",function (CLOSEST,FULLREF) {
  var UP=this[SymbolUp];
  if (UP) {
    if (!CLOSEST && isArray(UP[0]) && isNumStr(UP[1])) {
      var UP2=UP[0].up(True,True),A;
      if (isDefined(UP2)
       && isDefined(A=typeOf(UP2[0]).attr(UP2[1]))
       && A.has("*>")) return FULLREF?[UP2[0],UP2[1],UP[1]]:UP2[0];
    }
    if (!FULLREF) return UP[0];
  }
  return UP;
});
obj.setMethod("upa",function () {
  var UP=this.up(True,True);
  if (isUndefined(UP)) return Undefined;
  var A=typeOf(UP[0]).attr(UP[1]);
  return A;
});
obj.setMethod("multiA",function () { // TODO: check that PO arrays can never be detached
  if (!isArray(this)) return Undefined;
  var A=this.upa();
  return isDefined(A) && A.has("*")?A:Undefined;
});
obj.setMethod("setUp",function (NEWUP,NAME) {
  if (!isUndefined(NEWUP) && !isObject(NEWUP)) error("setUp(1)");
  var UP=this.up(True,True);
  if (!isUndefined(UP)) {
    if (UP[0][UP[1]]!=this) error("setUp(2)");
    UP[0][UP[1]]=Undefined;
  //if (isArray(UP[0]) && isNumStr(UP[1])) UP[0].splice0(UP[1],1); FIXME: do that later, raises too much problems
  }
  if (isUndefined(NEWUP)) this[SymbolUp]=Undefined;
                     else this[SymbolUp]=[NEWUP,NAME];
});
obj.setMethod("detach",function () {
  this.setUp(Undefined);
});

container.setMethod("newId",function () {
  return this.LASTID++;  // FIXME: generate IDs in such a way that the generated ID can never be in collision with an ID that have been choosen by the user (e.g. ID=Chr(1)+(LASTID++))
});
container.setMethod("store",function (O,ID,UP,UPNAME) {
  if (isUndefined(ID)) ID=this.newId();
  O.setId(ID);
  O.setUp(UP,UPNAME);
  O.setContainerOf(this);
});

// Access & PO
obj.setMethod("getv",function (NAME) {
  return this[NAME];
});
obj.setMethod("setv",function (NAME,VAL) { // TODO: find why we can't simply use "set"
  if (!isString(NAME) && !isNumber(NAME)) error("setv::"+NAME); // Comment this out for performance reasons (?)
  if (this[NAME]==VAL) return;
  var A=typeOf(this).attr(NAME),
      MA=this.multiA(),
      NUM=isNumStr(NAME),
      SAMECONT=isUnboxed(VAL) || this.containerOf()==VAL.containerOf();
  if (NUM && isDefined(MA) && MA.has(">") || isDefined(A) && A.has(">")) { // PO
    if (NUM && SAMECONT && isDefined(MA) && MA.has("!") || isDefined(A) && A.has("!")) { // Move
      if (isBoxed(this[NAME])) this[NAME].detach();
    }
    else {
      if (isBoxed(VAL) && (!SAMECONT || isDefined(VAL.up()))) VAL=copy(VAL,this.containerOf());
    }
    if (isBoxed(VAL)) VAL.setUp(this,NAME);
  }
  this[NAME]=VAL;
});

obj.setMethod("remove",function (NAME,N) {
  function rm(A,I) {
    var VAL=A[I];
    if (isBoxed(VAL) && VAL.up(True)==A) VAL.detach();
  }
  if (isArray(this) && isNumStr(NAME)) {
    if (isUndefined(N)) N=1;
    if (NAME<0 || NAME>=length(this) || NAME+N>length(this)) error("obj.remove");
    var M=N;
    while (M--) {
      rm(this,NAME);
      this.splice0(NAME,1);
    }
    for (var I=NAME;I<length(this);I++) {
      var VAL=this[I],UP;
      if (isBoxed(VAL)) UP=VAL.up(True,True);
      if (isDefined(UP)) UP[1]-=N;
    }
  }
  else {
    rm(this,NAME);
    delete this[NAME];
  }
});
obj.setMethod("cut",function (NAME,N) { // Useable to replace pop() and shift()
  var NDEF=True,RES=[];
  if (isUndefined(N)) N=1,NDEF=False;
  if (isArray(this) && isNumStr(NAME)) {
    if (NAME<0 || NAME>=length(this) || NAME+N>length(this)) error("obj.cut");
    for (var I=NAME;I<NAME+N;I++) RES.push(this[NAME]);
  }
  else RES.push(this[NAME]);
  this.remove(NAME,N);
  return NDEF?RES:RES[0];
});

array.setMethod("insert",function (I,...VAL) { // Useable to replace push() and unshift()
  if (!isNumStr(I)) error("array.insert");
  for (var J=0;J<length(VAL);J++) this.splice0(I,0,Undefined);
  var N=length(VAL);
  for (var J=I+N;J<length(this);J++) {
    var UP=this[J].up(True,True);
    if (isDefined(UP)) UP[1]+=N;
  }
  for (var J=0;J<length(VAL);J++) this.setv(I+J,VAL[J]);
});
array.setMethod("push0",array.method("push"));
array.setMethod("push",function (VAL) {
  var A=this.upa();
  if (isUndefined(A)) return this.push0(VAL);
  this.insert(length(this),VAL);
  return VAL;
});

array.setMethod("splice0",array.method("splice"));
array.setMethod("splice",function (I,N,...VAL) {
  var A=this.upa();
  if (isUndefined(A)) return this.splice0(I,N,...VAL);
  var RES=this.cut(I,N);
  this.insert(I,...VAL);
  return RES;
});

obj.setMethod("first",function () {
  if (isArray(this)) return this[0];
  else {
    if (!this.$) error("obj.first");
    return this.$[0];
  }
});
obj.setMethod("last",function () {
  if (isArray(this)) return this[length(this)-1];
  else {
    if (!this.$) error("obj.last");
    return this.$[length(this.$)-1];
  }
});

obj.setMethod("prev",function () {
  error("obj.prev (!Yet)");
});
obj.setMethod("next",function () {
  var UP=this.up(True,True);
  if (!UP || !isArray(UP[0])) return Undefined;
  return UP[0][UP[1]+1]; // TODO: add BOL et EOL (?)
});

// Copy & move
container.setMethod("copy",function (O,MODE) { // TODO: detect loops
  if (isUndefined(MODE)) MODE="flat";
  var T=typeOf(O);
  function cons(O,CONT) {
    if (T.root()==obj) return T(CONT);
                  else return T(O,CONT);
  }
  if (isUnboxed(O)) return O;
  var ISARR=isArray(O);
  var RES=cons(O,this);
  for (var N of sfattrs(O)) {
    var VAL=O[N],PO=True;
    if (!(ISARR && isNumStr(N))) PO=T.attrHas(N,">");
    var VAL2=VAL;
    if (isBoxed(VAL) && MODE=="flat" && !PO) error("copy(!PO)::"+N); // FIXME: copy while keeping the references ? If the referred objects are in the same container, it should be okay.
    if (isBoxed(VAL) && (MODE=="full" || PO)) {
      VAL2=this.copy(VAL,MODE);
      if (isArray(VAL2) && PO) {
        for (var I=0;I<length(VAL2);I++) {
          var ELT=VAL2[I];
          if (isBoxed(ELT)) ELT.setUp(VAL2,N);
        }
      }
    }
    RES.setv(N,VAL2);
  }
  return RES;
});
container.setMethod("move",function (O,MODE) {
  var RES=this.copy(O,MODE);
  O.delete(MODE);
  return RES;
});

// Load & save
container.setMethod("load",function (FNAME,CATEG) { // TODO: recognize when FNAME is a directory, and load all files from FNAME of the format CATEG
  if (!isNil(this.FNAME) && this.FNAME!="") error("container.load");
  this.FNAME=FNAME+"."+CATEG;
  var S=fileRead(this.FNAME);
  if (CATEG=="db") {
    parsef(S,this,"lisp");
  }
  else
  if (CATEG=="csv") {
    csvparsef(S,this);
  }
  else error("container.load(2)");
});
container.setMethod("save",function () { // TODO: recognize when FNAME is a directory, and save the content in the respective appropriate files from FNAME of the format CATEG
  if (isNil(this.FNAME)) error("container.save");
  var L=[];
  for (N in this.$) L.push(this.$[N]);
  var S;
  if (fileExt(this.FNAME)=="db") {
    var S=serializef(L,[],"lisp");
  }
  else error("container.save(2)");
  fileWrite(this.FNAME,S+"\n");
});

// Queries
var query=type(function (VARS,OBJ) {
                 var RES=query.create();
                 if (isUndefined(OBJ)) OBJ=VARS,VARS=Undefined;
                 if (isUndefined(VARS)) VARS=["*"];
                 if (!isObject(OBJ)) error("query");
                 RES.VARS=VARS;
                 RES.QUERY=OBJ;
                 return RES;
               },
               { "NAME":"query", "PARENT":obj, "ATTRS":["VARS=[]","QUERY={}"] });

function isQuery(O) {
  return isa(O,query);
}

// Matching
query.setMethod("match",function (O,Q) {
  if (isAtom(O)) {
    if (!isString(O)) O=str(O);
    if (!isString(Q)) error("query.match::str");
    return strMatch(O,Q);
  }
  if (!isObject(O)) return False;
  var RES=True;
  if (typeOf(this.QUERY)==array) {
    var CONT=O.containerOf();
    if (isDefined(CONT)) {
      var M=CONT.qmethod(this.QUERY[0]);
      if (isUndefined(M)) error("query.match::qmethod(1)");
      RES=M(O,...acopy(this.QUERY,1,length(this.QUERY)));
    }
    else error("query.match::qmethod(2)");
  }
  else
  for (VAR in this.QUERY) {
    if (!this.match(O[VAR],this.QUERY[VAR])) RES=False;
  }
  return RES;
});
container.setMethod("query",function (VARS,QUERY,FETCH) {
  if (typeOf(VARS)==obj || isQuery(VARS)) {
    FETCH=QUERY;
    QUERY=VARS;
    VARS=Undefined;
  }
  if (!isQuery(QUERY)) {
    QUERY=query(VARS,QUERY);
  }
  if (FETCH && isRemote(this.SRV)) {
    var S=this.SRV.call("_grep",[this.NAME,QUERY.QUERY]);
    return parse(S,this);
  }
  else {
    var L=[];
    for (var ID in this.$) {
      var O=this.$[ID];
      if (QUERY.match(O)) L.push(O);
    }
    return L;
  }
});

// Sync
function isModified(O) {
  return O.hasFlags("m");
}
obj.setMethod("setModified",function (B) {
  if (isUndefined(B) || B) this.addFlags("m");
                      else this.delFlags("m");
});
container.setMethod("sync",function (L,FORCE) {
  if (isUndefined(L)) L=this.$;
  else
  if (typeOf(L)!=array) {
    if (isAtom(L)) FORCE=L,L=this.$;
              else L=[L];
  }
  if (isUndefined(FORCE)) FORCE=False;
  if (isRemote(this.SRV)) {
    if (!FORCE) L=L.filter(isModified);
    for (var O of L) O.setModified(False);
    var PARMS=[this.NAME,serialize(L,"flat*")];
    return this.SRV.call("_syncobjs",PARMS); // TODO: once the container has been updated, propagate to parents, and save to file if it's the mapping of a file (find a way to do this in an incremental way)
  }
  else
  if (isClient(this.SRV)) error("container.sync(Client !Yet)");
  else
  if (isLocal(this.SRV)) error("container.sync(Local !Yet)");
                    else error("container.sync");
});

// Init
function containersInit() {
  MEMORY=container("memory");
  setprop(MEMORY,"store",function () {});
}
