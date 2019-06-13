/*
 * jxml.js
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

// JXML elements
var jxml=widgetType("jxml",html);

jxml.setMethod("init",function (O) {
  if (isUndefined(O)) O={};
  if (constructor(O)!=Object) error("jxml.init(1)");
  this.TAG=typeOf(this).name();
  this.$=array.create(widget.$);
  this.$.setUp(this,"$");
  for (var N in O) {
    var VAL=O[N];
    if (N=="TAG" && isDefined(VAL) && VAL!=typeOf(this).name()) error("jxml.init(2)");
    else
    if (N=="$") for (var N2 in O.$) this.$.push(O.$[N2]);
    else
    if (N=="src") if (!isContainer(VAL)) error("jxml.init(src)");
                                    else this[N]=VAL;
    else
    if (N=="value") this.value=VAL;
    else
    if (N=="skin") if (!isSkin(VAL)) error("jxml.init(skin)");
                                else this[N]=VAL;
    else { // Standard HTML slots ; TODO: filter out the inappropriate ones
      this[N]=VAL;
    }
  }
  this.expand();
  for (var N of ["id",
                 "style", "class",
                 "events", "targets"])
  {
    if (isDefined(this[N]) && isDefined(this.TO)) {
      if (N=="events") this.TO[N]=html.parseLEvent(this[N]);
      else
      if (N=="targets") this.TO[N]=html.parseLTarget(this[N]);
      else {
        this.TO[N]=this[N];
        if (isDefined(this.TO.TO)) this.TO.TO.setv(N,this[N]); // TODO: check that it performs the appropriate property settings on TO.DOM
      }
    }
  }
});

function isJxml(O,STRICT) {
  return isa(O,jxml) && (!STRICT || isJxmlPure(O));
}
function isHtmlPure(O) {
  return isa(O,html) && !isa(O,jxml);
}

jxml.setMethod("expand",function () {
  return Nil;
});

// JXML types
var JXMLTAGS=[
      "@",
      "skin","shape","view",
      "superpose",
      "lines", "columns",
      "splitv",
      "button","input"
    ];
for (var N of JXMLTAGS) widgetType(N,N=="columns"?lines:jxml);

function isJxmlPure(O) { // TODO: Improve this by means of the appropriate flag in T, T.inherit(widget)
  if (!isJxml(O)) return False;
  return contains(JXMLTAGS,typeOf(O).name());
}

// Refs
var JXMLREF=origin["@"];

// Templates
var template=type(Nil,
                  { NAME:"template", PARENT:array });

function isTemplate(O) {
  return isa(O,template);
}

template.setMethod("expand",function (PARMS) {
  function exp(A) {
    if (isString(A) && A[0]=="$") {
      var VAR=substring(A,1,length(A));
      if (PARMS.hasOwnProperty(VAR)) return PARMS[VAR];
                              //else error("template.expand(1)"); // TODO: see how to deal with this
    }
    if (isArray(A) && length(A)==0 && isDefined(PARMS[""])) return PARMS[""];
    if (isArray(A) && length(A)>0 && !isType(A[0])) A.unshift(columns); // FIXME: should not need to know datatypes like columns()
    if (isAtom(A) || constructor(A)!=Array && !isTemplate(A) || length(A)<1 || !isType(A[0])) return A;
    var O=length(A)==1?{}:A[1];
    if (constructor(O)!=Object) error("template.expand(2)");
    var RES=[];
    RES[0]=A[0];
    var O2={};
    for (var N in O) O2[N]=exp(O[N]);
    RES[1]=O2;
    for (var I=2;I<length(A);I++) RES.push(exp(A[I]));
    return RES;
  }
  if (typeOf(PARMS).root()!=obj) error("template.expand(0)");
  return exp(this);
});

template.setMethod("findVarPos",function (VAR) {
  function f(O,PATH) {
    for (var I=2;I<length(O);I++) if (O[I]==VAR) {
      PATH.unshift(I-2);
      return PATH;
    }
    for (var I=2;I<length(O);I++) if (isArray(O[I])) {
      if (f(O[I],PATH)) {
        PATH.unshift(I-2);
        return PATH;
      }
    }
    return Nil;
  }
  return f(this,[]);
});
obj.setMethod("getByPath",function (PATH) {
  var RES=this;
  for (var I of PATH) RES=RES.$[I];
  return RES;
});

// Skins
skin.setMethod("init",function (O) {
  if (isUndefined(O.$) || !isUndefined(O.CODE)) error("skin.init(0)");
  O.CODE=O.$;
  delete O.$;
  this.super("init",O);
  var CODE={};
  for (var SH of this.CODE) {
    if (!isArray(SH) || length(SH)<2 || SH[0]!=shape || constructor(SH[1])!=Object) error("skin.init(1)");
    var CLASS=SH[1].class,
        MODE=SH[1].mode;
    if (isUndefined(CLASS)) error("skin.init(2)");
    if (isUndefined(MODE)) {
      if (length(SH)!=3) error("skin.init(3)");
      MODE="";
    }
    var SH2={ "mode":MODE, "VIEW":{} };
    for (var I=2;I<length(SH);I++) {
      var V=SH[I];
      if (!isArray(V) || length(V)<2 || V[0]!=view || constructor(V[1])!=Object) error("skin.init(4)");
      if (isUndefined(V[1].mode)) {
        if (MODE!="") error("skin.init(5)");
      }
      var V2=[columns,{}];
      if (length(V)==3 && isArray(V[2])) V2=V[2];
                                    else for (var J=2;J<length(V);J++) V2.push(V[J]);
      if (MODE=="") SH2.VIEW[MODE]=template(V2);
               else SH2.VIEW[V[1].mode]=template(V2);
    }
    CODE[CLASS]=SH2;
  }
  this.CODE=CODE;
});

function isSkin(O) {
  return typeOf(O)==skin;
}

// Skin contexts
setprop(skin,"context",type(function (O) {
                              var RES=skin.context.create();
                              RES.init(O);
                              return RES;
                            },
                            { NAME:"skin.context" })); 

skin.context.setMethod("init",function (O) {
  this.MODE=O.MODE;
  this.SHAPE=O.SHAPE; // FIXME: throw an error if there are other attributes in O
});

function isSkinContext(O) {
  return typeOf(O)==skin.context;
}

// Lines
lines.LB=template([table,{},"$"]);
lines.LBPATH=lines.LB.findVarPos("$");
lines.LBPATH.pop();
lines.LD=template([tr,{},"$"]);
lines.LDPATH=lines.LD.findVarPos("$");

lines.setMethod("lb",function () {
  return typeOf(this).LB;
});
lines.setMethod("lbPath",function () {
  return typeOf(this).LBPATH;
});
lines.setMethod("ld",function () {
  return typeOf(this).LD;
});
lines.setMethod("ldPath",function () {
  return typeOf(this).LDPATH;
});

html.setMethod("display1",function (O,TO,PUSH,SETFROMTO) {
  SETFROMTO=isUndefined(SETFROMTO)?True:SETFROMTO;
  var XP;
  if (PUSH) { // FIXME: hmmm, clean this
    XP=markup(this.ld().expand({ "":TO }));
    TO=XP.getByPath(this.ldPath());
  }
  else {
    TO=markup(TO);
    if (isJxmlPure(TO)) TO=TO.TO; // FIXME: in that case, the FROM should be stored in the $[] of the corresponding upper JXML container (if it exists).
  }
  if (isAtom(TO)) TO=markup([span,{},TO]); // FIXME: manage these artificially introduced cells correctly, in case we replace the element at these positions
  TO.TO.DOM.style.display="table-cell";
  if (SETFROMTO) {
    if (isDefined(O.TO)) error("lines.display1(1)"); // FIXME: currently the same object can't be displayed inside two different views
  //if (isDefined(TO.FROM)) error("lines.display1(2)"); // TODO: this should not be necessary anymore ; check that it is so, and in that case, remove it
    O.TO=TO;
    TO.FROM=O;
  }
  if (PUSH) this.HEAD.$.push(XP);
  return TO;
});
html.setMethod("display2",function (O,CTX,PUSH) { // FIXME: display1() & display2() are methods of html, while the others are methods of lines. Organize this better.
  var TO=Nil,SH;
  if (isDefined(CTX)) {
    SH=CTX.SHAPE;
    var V=SH.VIEW[CTX.MODE];
    TO=V.expand(O);
  }
  else TO=str(pretty(O));
  TO=this.display1(O,TO,PUSH);
  if (isDefined(CTX)) {
    TO.CTX=CTX;
  }
  return TO;
});
lines.setMethod("undisplay1",function (I) {
  var E=this.HEAD.$[I].getByPath(this.ldPath());
  if (isUndefined(E.FROM)) error("undisplay1(1)");
  if (isUndefined(E.FROM.TO)) error("undisplay1(2)");
  delete E.FROM.TO;
  delete E.FROM;
  this.HEAD.$.remove(I,1);
});
lines.setMethod("undisplay",function () {
  var N=length(this.HEAD.$);
  while (N--) this.undisplay1(0);
});

lines.setMethod("display",function () {
  var L=isDefined(this.src)?this.TO.value:this.value;
  if (isUndefined(L)) error("lines.display");
  this.undisplay();
  var SK=this.skin;
  for (var O of L) {
    var CTX;
    if (isDefined(SK)) {
      var SH=SK.CODE[typeOf(O).name()];
      CTX=skin.context({ MODE:SH.mode, SHAPE:SH });
    }
    this.display2(O,CTX,1);
  }
});
html.setMethod("redisplay",function () {
  var O=this.FROM,
      CTX=this.CTX;
  if (isUndefined(O)) error("html.redisplay(1)");
  delete O.TO;
  var UP=this.up(1,1),
      A=UP[0],I=UP[1];
      RES=this.display2(O,CTX);
  A.setv(I,RES);
  return RES;
});

var ERRL
lines.setMethod("load",function (L) {
  if (isUndefined(L)) error("lines.load");
  if (constructor(L)==Object || isQuery(L)) {
    if (!isQuery(L)) L=query(L);
    this.TO.value=this.src.query(L,1);
  }
  else
  if (isArray(L)) {
    if (!isArray(this.value) || isDefined(this.src)) error("lines.load(1)");
    this.value=L;
  }
  else ERRL=L,error("lines.load(2)");
  this.display();
});

lines.setMethod("expand",function () {
  if (!isNil(this.TO)) error("lines.expand");
  this.TO=markup(this.lb());
  this.TO.FROM=this; // FIXME: why can't we have this one, and have it in the other expand()s ?
  this.HEAD=this.TO.getByPath(this.lbPath());
  this.HEAD.$.remove(0,1);
  if (isDefined(this.value)) {
    if (length(this.$)>0) {
      if (length(this.$)!=1 || !isSkin(this.$[0])) error("lines.expand(skin !Yet)");
    }
    this.load(this.value);
  }
  else {
    ; // FIXME: check all markup is displayeable, there should be no skin(), or any other markup like that
    for (var I in this.$) {
      var W=this.$[I];
      if (isHtmlPure(W) || isString(W) || isNumStr(W)) {
        var REF=JXMLREF();
        W.detach();
        this.display1(REF,W,1);
        this.$.setv(I,REF);
      }
      else
      if (isJxmlPure(W)) {
        this.display1(W,W.TO,1,0);
      }
      else error("lines.expand(2)");
    }
  }
});

// Columns
columns.LB=template([table,{},[tr,{},"$"]]);
columns.LBPATH=columns.LB.findVarPos("$");
columns.LBPATH.pop();
columns.LD=template([]);
columns.LDPATH=[];

// Buttons
button.setMethod("expand",function () {
  if (!isNil(this.TO)) error("button.expand");
  this.TO=markup([_input,{type:"button"}]);
  this.TO.FROM=this;
  if (isDefined(this.title)) {
    this.TO.title=this.title;
    this.TO.TO.setv("value",this.title);
  }
});

// Inputs
input.setMethod("expand",function () {
  if (!isNil(this.TO)) error("input.expand");
  this.TO=markup([_input,{type:"text"}]);
  this.TO.FROM=this;
  if (isDefined(this.name)) {
    this.TO.name=this.name;
  }
  if (isDefined(this.$[0])) {
    this.TO.value=this.$[0]; // TODO: handle this in a better way
    this.TO.TO.setv("value",this.$[0]);
  }
});

// Splitvs
splitv.setMethod("expand",function () {
  if (!isNil(this.TO)) error("splitv.expand");
  if (!isDefined(this.$[0])) error("splitv.expand(2)");
  var L=splitTrim(this.$[0],",");
  L.splice(0,0,lines,{});
  this.TO=markup(L).TO;
  this.TO.FROM=this;
});

// JXML methods
html.setMethod("mode",function (MODE) {
  var CTX=this.CTX;
  CTX.MODE=MODE;
  this.redisplay();
});

html.setMethod("load",function (L) {
  if (isUndefined(this.FROM) || !isJxmlPure(this.FROM)) error("html.load(1)");
  this.FROM.load(L);
});

html.setMethod("collect",function () {
  var RES={},N=0;
  function traverse(W) {
    if (isAtom(W)) return;
    if (typeOf(W)==_input && W.type=="text") {
      var NAME=W.name,VALUE=W.TO.DOM.value;
      if (isUndefined(NAME)) NAME="in"+N,N++;
      if (isUndefined(VALUE)) VALUE="";
      RES[NAME]=VALUE;
    }
    for (var I=0;I<length(W.$);I++) traverse(W.$[I]);
  }
  traverse(this);
  return RES;
});
html.setMethod("save",function (X/*TODO: check that there is never any value here, and remove this parm*/) {
  var O2=this.collect();
//alert("save: "+display(X)+" "+display(O));
  var O=this.FROM;
  if (isHtml(O)) error("html.save(1)");
  var C=O.containerOf();
  if (!isContainer(C)) error("html.save(2)");
  O.setModified(O.setAttrs(O2)); // FIXME: hmm ...
  C.sync([O]);
});

// Parse/serialize
html.setMethod("toHtml",function () {
  var ATTRS=["id", "type", "name", "value"],
      SELFCLOSE=["br", "hr", "_input"];
  function traverse(W) {
    if (isAtom(W)) { outd(W);return; }
    out("<"+W.TAG);
    for (var A of ATTRS) if (isDefined(W[A]) && isAtom(W[A])) out(' '+A+"="+serialize(W[A]));
    out(">");
    if (!contains(SELFCLOSE,W.TAG)) {
      if (length(W.$)>0) outIndentInc(+2);
      for (var I=0;I<length(W.$);I++) crIndent(),traverse(W.$[I]);
      if (length(W.$)>0) outIndentInc(-2),crIndent(),out("</"+W.TAG+">");
    }
  }
  startOutS();
  traverse(this);
  var RES=getOutS();
  stopOutS();
  return RES;
});
