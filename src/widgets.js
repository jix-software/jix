/*
 * widgets.js
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

// Widgets
var widget=type(function (O) {
                  error("widget.cons"); // It's an abstract class
                },
                { "NAME":"widget", "PARENT":obj,
                  "ATTRS":["TAG",
                           "FROM","TO",
                           "!*> $"]
                });

widget.$=container();
setprop(widget,"getById",function (ID) {
  return widget.$.getById(ID);
});

setprop(widget,"create0",widget.create);
setprop(widget,"create",function () { return this.create0(widget.$) });

function isWidget(O) {
  return isa(O,widget);
}

widget.setMethod("parent",function () {
  return this.up();
});
widget.setMethod("setParent",function (WUP) {
  error("widget.setParent(!Yet)");
});

function widgetType(NAME,PARENT) {
  var T=type(function (O) { // TODO: implement cons({...},[...]) format, too
               var T=origin[NAME]; // TODO: devise a method which only depends on type() to fetch the cons()
               if (isContainer(O)) {
                 if (O!=widget.$) error(T.name()+".cons(!widget.$)::"+O.NAME);
                 O=Undefined;
               }
               if (isDom(O)) return T({ "TO":O });
               else {
                 var RES=T.create();
                 RES.init(O);
                 return RES;
               }
             },
             { "NAME":NAME, "PARENT":PARENT,
               "ATTRS":["TAG", // FIXME: remove this asa. type() implements proper attribute inheritance
                        "FROM","TO",
                        "!*> $=[]"]
             });
  setprop(T,"create0",widget.create0);
  setprop(T,"create",widget.create);
  origin[NAME]=T;
  return T;
}

// HTMLArray
var htmla=type(function () {
                 return htmla.create(widget.$);
               },
               { "NAME":"htmla", "PARENT":array });

htmla.setMethod("setv",function (I,VAL) { // FIXME: in string VALs, translate HTML symbols like &nbsp;, etc. (?)
  if (!isNumStr(I)) error("htmla.setv");
  this.super("setv",I,VAL);
  var UP=this.up();
  if (isUndefined(UP)) error("htmla.setv(2)");
  if (isDomElement(UP.TO)) {
    var DOM=UP.TO.DOM;
  //if (I==DOM.childNodes.length) DOM.appendChild(physdom("#text","")); Can this be of any use ?
    if (I<0 || I>=DOM.childNodes.length/*TODO: verify that length(DOM.childNodes) always works*/) if (!SERVER/*FIXME: remove this if (!SERVER) asap*/) error("htmla.setv(3)");
    if (isString(VAL)) {
      DOM.replaceChild(physdom("#text",VAL),DOM.childNodes[I]);
    }
    else
    if (isDom(VAL.TO)) {
      DOM.replaceChild(VAL.TO.DOM,DOM.childNodes[I]);
    }
  }
});

htmla.setMethod("push",function (VAL) {
  if (isNumber(VAL)) VAL=VAL.toString();
  if (isNil(VAL)/*FIXME: hack ; decide what to do in this case*/) VAL="{{Undefined}}";
  if (!isHtml(VAL) && !isString(VAL)) error("htmla.push"+pretty(VAL));
  this.super("push",VAL);
  return VAL;
});

htmla.setMethod("remove",function (I,N) {
  this.super("remove",I,N);
  var UP=this.up();
  if (isUndefined(UP)) error("htmla.remove");
  if (isDomElement(UP.TO)) {
    while (N--) UP.TO.DOM.removeChild(UP.TO.DOM.childNodes[I]); // TODO: check that it works ok when N>1
  }
  ; // TODO: return the correct value
});
htmla.setMethod("removeAll",function () {
  this.remove(0,length(this));
});

htmla.setMethod("insert",function (I,...VAL) {
  var UP=this.up();
  if (isUndefined(UP)) error("htmla.insert(1)");
  if (isDomElement(UP.TO)) {
    var DOM=UP.TO.DOM;
    if (I<0 || I>DOM.childNodes.length/*TODO: verify that length(DOM.childNodes) always works*/) if (!SERVER/*FIXME: remove this if (!SERVER) asap*/) error("htmla.insert(2)");
    var N=length(VAL);
    while (N--) {
      DOM.insertBefore(physdom("#text",""),DOM.childNodes[I]);
    }
  }
  this.super("insert",I,...VAL);
});

// HTML elements
var html=widgetType("html",widget);

html.setMethod("init",function (O) {
  if (isUndefined(O)) O={};
  if (constructor(O)!=Object) error("html.init(1)");
  var TO=O.TO;
  if (isUndefined(TO)) TO=dom(typeOf(this));
                  else if (TO.tag()!=typeOf(this).name()) error("html.init(2)"); // TODO: in that case, create html() elements for all the subelements of TO
  if (isDefined(TO.from())) error("html.init(3)");
  TO.setFrom(this);
  this.TAG=typeOf(this).name();
  this.TO=TO;
  this.$=htmla();
  this.$.setUp(this,"$");
  if (isDefined(this.TO)) html.fetchDomTree(this.$,TO);
  for (var N of ["events", "targets"]) {
    var VAL=this.TO.getv(N);
    if (!isNil(VAL)) {
      if (!isNil(O[VAL])) error("html.init("+N+")(1)");
      this[N]=html[N=="events"?"parseLEvent":"parseLTarget"](VAL);
    }
    else this[N]=N=="events"?[]:{};
  }
  for (var N in O) { // TODO: implement a getv()/setv() couple for html objects that automatically fetches/propagates the attribute values from/to the actual DOM element (i.e., from/to TO.DOM), and performs the appropriate parsings/serializings.
    var VAL=O[N];
    if (N=="TO") ; // Done already
    else
    if (N=="TAG" && isDefined(VAL) && VAL!=typeOf(this).name()) error("html.init(4)");
    else
    if (N=="$") for (var N2 in O.$) {
      var W=O.$[N2];
      if (isJxmlPure(W)) W=W.TO;
      if (isDefined(W)/*TODO: check that this is enough*/) {
        this.$.push(W);
        if (this.TAG=="tr" && length(this.$)>0 && this.$[0].TAG=="table") {
          this.$[0]._NOCELL=1; /*FIXME: _NOCELL is a hack (1)*/
          ERRO=this;
        }
      }
    }
    else
    if (N=="events") this[N]=html.parseLEvent(VAL); // Extended HTML-specific slots
    else
    if (N=="targets") this[N]=html.parseLTarget(VAL);
    else { // Standard HTML slots ; TODO: filter out the inappropriate ones
      this[N]=VAL;
      this.TO.setv(N,VAL); // TODO: check that it performs the appropriate property settings on TO.DOM
    }
  }
});

var markup=tree; // TODO: devise a version of tree() that accepts only types T, T.inherits(html)

function isHtml(O) {
  return isa(O,html);
}
function isHtmlAtom(O) {
  return isHtml(O) && isDom(O.TO) && isDomTextNode(O.TO);
}

setprop(html,"getById",function (ID) {
  var D=dom.getById(ID);
  if (D) return D.FROM;
  return Undefined;
});
setprop(html,"getByName",function (NAME,ALL) {
  var L=dom.getByName(NAME,ALL);
  if (!ALL) if (L) return L.FROM; else return L;
       else return L.filter(function (D) { return isDefined(D.FROM) });
});

setprop(html,"fetchDomTree",function (A,DOM) {
  var A2=DOM.DOM.childNodes;
  for (var I=0;I<A2.length;I++) {
    var D=dom(A2[I]),
        W=D.FROM;
    if (isUndefined(W)) W=htmlType(lcase(D.DOM.nodeName))({ TO:D });
    A.push(W);
  }
});

var BODY;
setprop(html,"body",function () {
  if (!BODY) BODY=body({ TO:dom.getByName("body") });
  return BODY;
});

html.setMethod("setParent",function (WUP) {
  error("html.setParent(!Yet)");
});

// HTML types
html.TYPES={};
function htmlType(NAME) {
  var T=html.TYPES[NAME];
  if (isDefined(T)) return T;
  T=widgetType(NAME,html);
  html.TYPES[NAME]=T;
  return T;
}

for (var N of [
       "body",
       "i","u","b","h1",
       "span", "div", "br","hr","img","iframe",
       "table", "tr", "td",
       "_input","a"
     ]
    )
    htmlType(N);

// Html (events)
setprop(html,"parseEvent",function (E) {
  var A=splitTrim(E,"=>");
  return [splitTrim(A[0],"|"),splitTrim(A[1],"&")];
});
setprop(html,"parseLEvent",function (L) { // FIXME: make things more elegant, in such a way that it's not necessary to use this function outside of this library
  if (isString(L)) L=splitTrim(L,";");
  if (!isArray(L)) error("html.parseLEvent");
  return L.map(html.parseEvent);
});
setprop(html,"eventMatch",function (E,KEY) {
  var LHS=E[0],S=keyToStr(KEY);
//alert(LHS[0]+" "+S+" "+KEY);
  for (var I in LHS) {
    if (LHS[I]=="alpha" && keyboardIsChar(KEY) && strIsAlpha(S)) return True;
    if (LHS[I]=="num" && keyboardIsChar(KEY) && strIsNum(S)) return True;
    if (LHS[I]==S) return True;
  }
  return False;
});
setprop(html,"leventMatch",function (L,KEY) {
  for (var I in L) if (html.eventMatch(L[I],KEY)) return L[I];
  return Nil;
});

setprop(html,"parseTarget",function (L,T) {
  var A=splitTrim(T,":");
  L[A[0]]=A[1];
});
setprop(html,"parseLTarget",function (L) { // FIXME: make things more elegant, in such a way that it's not necessary to use this function outside of this library
  if (isString(L)) L=splitTrim(L,";");
  if (!isArray(L)) return L;
  var RES={};
  for (var T of L) html.parseTarget(RES,T);
  return RES;
});

// Widgets (propagate)
setprop(html,"evalTarget",function (TARGET,EXPR) {
  if (!isString(EXPR) || length(EXPR)==0) error("html.evalTarget");
  var O=Nil;
  if (EXPR=="$") O=TARGET;
  else {
    if (EXPR[0]=="#") O=substring(EXPR,1,length(EXPR));
    if (O!=Nil) O=html.getById(O);
  }
  return O;
});
setprop(html,"defaultParm",function (ACTION) {
  switch (ACTION) {
    case "load": return "^"; // TODO: replace "^" by "$.obj", or ".obj"
    case "add": return "^";
    case "mode": return "^";
    case "alert": return "^";
    case "save": return "";
    case "focus": return "_^"; // Hmm ...
    default: return "_^"; // E.g. focus() ; en fait, focus() ne prend aucun parametre, c'est moveTo(), le focus qui permet de deplacer le curseur a l'interieur d'un element, et focus() l'action qui permet de lui transmettre le jeton. Eventuellement, O.focus(TARGET) est en fait <=> a O.moveTo(TARGET),O.focus() <=> O.moveTo(TARGET)&focus()
  }
});
setprop(html,"evalParm",function (ACTION,PARM,THIS,TARGET) {
  var A=ACTION.split("!"); // FIXME: replace .split() by splitTrim() (?)
  ACTION=A[0];
  if (length(A)>1) PARM=A[1];
  if (PARM=="") PARM=html.defaultParm(ACTION);
  switch (PARM) {
    case "$": return THIS;
    case "*": return THIS.collect()/*FIXME: hmm, see how we can disambiguate collect()s stemming from forms, and collect()s stemming from an edit view*/;
    case "^": return TARGET.OBJ; // FIXME: return the actual value slot of a widget, and if there's no value, its $ (and perhaps if length($)==1, return $[0])
    case "_^": return TARGET;
    case "": return Nil;
    default: return PARM; //error("html.evalParm");
  }
});
setprop(html,"propagate",function (EVT) {
  function fn(ACTION) {
    var A=ACTION.split("!"); // FIXME: replace .split() by splitTrim() (?)
    return A[0];
  }
  var TARGET=EVT.TARGET,ACTION=Nil;
  while (TARGET!=Nil) {
  //alert("Propagate "+EVT.TAG+" "+EVT.KEY+" "+TARGET.ID+" "+JSON.stringify(TARGET.events));
    ACTION=html.leventMatch(TARGET.events,EVT.KEY);
    if (ACTION!=Nil) break;
    TARGET=TARGET.parent();
  }
  if (ACTION!=Nil) {
  //alert("Action "+display(ACTION));
    _LASTEVENT=EVT; // FIXME: put it there (?)
    ACTION=ACTION[1];
    TARGET=EVT.TARGET;
    while (TARGET!=Nil) {
      var TARGETA=TARGET.targets[fn(ACTION[0])];
      if (!isUndefined(TARGETA)) {
        var A=splitTrim(TARGETA,"!"),PARM=""; // FIXME: just like we parse events, also parse targets in advance, inside html.init()
        TARGETA=A[0];
        if (length(A)>1) PARM=A[1];
        TARGETA=html.evalTarget(TARGET,TARGETA);
        if (TARGETA==Nil) error("html.propagate(1)");
        for (var I in ACTION) { // FIXME: if TARGETA has no method, look for the method in TARGETA.FROM, before triggering the error
          if (!isFunction(TARGETA[fn(ACTION[I])])) error("html.propagate(2)");
        }
      //alert("Target "+TARGETA.ID+" "+display(ACTION)+" "+EVT.TARGET.ID);
     // FIXME: if there is a collect, apply it only on the first parm, or in any case, calculate it only once
        for (var I in ACTION) TARGETA[fn(ACTION[I])](html.evalParm(ACTION[I],PARM,TARGET,EVT.TARGET));
        break;
      }
      TARGET=TARGET.parent();
    }
  }
});

// Console
function out0(S) {
  if (isHtml(S)) {
    if (isHtml(S.TO)) S=S.TO;
    html.body().$.push(S);return;
  }
  if (OUTS!=Nil || SERVER) { _out0(S);return; }
  if (!isString(S)) error("widgets.out0");
  if (S=="<br>" || S=="\n") S=br();
  if (S=="<hr>") S=hr();
  ; // TODO: markup chunks, esp., spaces
  html.body().$.push(S);
}
function out(S) {
  out0(S);
}
