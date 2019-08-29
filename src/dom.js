/*
 * dom.js
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

// Dom elements
var ELEMENT_NODE=1,
    ATTRIBUTE_NODE=2,
    TEXT_NODE=3,
    CDATA_SECTION_NODE=4,
    ENTITY_REFERENCE_NODE=5,
    ENTITY_NODE=6,
    PROCESSING_INSTRUCTION_NODE=7,
    COMMENT_NODE=8,
    DOCUMENT_NODE=9,
    DOCUMENT_TYPE_NODE=10,
    DOCUMENT_FRAGMENT_NODE=11,
    NOTATION_NODE=12;

var ERRO;
var SymbolFrom=sy("<="),
    DomElement;
    dom=type(function (O) {
               var DOM;
               if (isString(O)) DOM=document.createTextNode(O);
               else
               if (isa0(O,DomElement)) {
                 DOM=O;
                 if (DOM[SymbolFrom]) return DOM[SymbolFrom];
                 ; // TODO: in that case, create dom() elements for all the subelements of DOM
               }
               else {
                 if (!isType(O) || !O.inherits(html)) ERRO=O,error("dom.cons");
                 DOM=document.createElement(O.name()=="_input"?"input":O.name()/*FIXME: handle the case of JXML tags having the same name as HTML tags in a clean way*/);
               }
               var RES=dom.create();
               RES.DOM=DOM;
               DOM[SymbolFrom]=RES;
               return RES;
             },
             { "NAME":"dom", "PARENT":obj });

function isDom(O) {
  return isa(O,dom);
}

dom.setMethod("categ",function () {
  return this.DOM.nodeType;
});
function isDomTextNode(O) {
  return isDom(O) && O.categ()==TEXT_NODE;
}
function isDomElement(O) {
  return isDom(O) && O.categ()==ELEMENT_NODE;
}

setprop(dom,"getById",function (ID) {
  var E=document.getElementById(ID);
  if (E) return dom(E);
  return Undefined;
});
setprop(dom,"getByName",function (NAME,ALL) {
  var L=document.getElementsByTagName(NAME),RES=[];
  for (var E of L) RES.push(dom(E)); // FIXME: is creating dom() objects for all, even if !ALL
  return ALL?RES:RES[0];
});

dom.setMethod("tag",function () {
  return lcase(this.DOM.nodeName);
});
dom.setMethod("from",function () {
  return this.FROM; // FIXME: perhaps we should use SymbolFrom here, to ease pretty-printing & copying
});
dom.setMethod("setFrom",function (W) {
  if (!isHtml(W)) error("dom.setFrom");
  this.FROM=W;
});
dom.setMethod("getv",function (NAME) { // FIXME: test that NAME is appropriate
  if (isDomElement(this)) return this.DOM.getAttribute(NAME);
  return this[NAME];
});
dom.setMethod("setv",function (NAME,VAL) {
  if (isDomElement(this)) {
    var DOIT=1;
    if (NAME=="hidden") { if (!VAL || VAL=="0") DOIT=0; ERRL=[VAL,DOIT]; }
    if (DOIT) this.DOM.setAttribute(NAME,VAL);
  }
  this[NAME]=VAL;
});

// Dom (focus)
var _DOMFOCUS=Nil;
setprop(dom,"focussed",function () {
  return _DOMFOCUS;
});
setprop(dom,"focus",function (E) {
  E.focus();
  _DOMFOCUS=E;
});

// Dom (events)
var _SHIFT=False,_CTRL=False,_ALT=False;
setprop(dom,"event",function (EVT) {
  var TARGET=EVT.target;
//alert("dom.event<"+display(TARGET.id)+";"+TARGET.nodeName+"> "+EVT.type+" "+EVT.charCode);
  if (TARGET.nodeName.toLowerCase()=="html") TARGET=document.getElementsByTagName("body")[0]; // NOTE: Firefox hack, due to the fact that the HTML element is catching the events
  var EVT2=new event(EVT.type,TARGET,EVT),EVT3=Nil;
  if (EVT.type=="keydown" || EVT.type=="keyup" || EVT.type=="keypress") {
    if (EVT.shiftKey!=Nil) _SHIFT=EVT.shiftKey;
    if (EVT.ctrlKey!=Nil) _CTRL=EVT.ctrlKey;
    if (EVT.altKey!=Nil) _ALT=EVT.altKey;
    EVT2.KEY=keyboardGetAscii(EVT.shiftKey,EVT.charCode,EVT.keyCode);
    EVT2.SCANCODE=EVT.keyCode;
    if (EVT.type=="keydown" && EVT2.KEY!=Nil
     && EVT.keyIdentifier!=Nil && EVT.keyIdentifier.substring(0,2)!="U+") { // TODO: Check that testing "U+" always generates the missing keypress correctly
      EVT3=new event("keypress",TARGET,EVT);
      EVT3.KEY=EVT2.KEY;
      EVT3.SCANCODE=EVT2.SCANCODE;
      EVT3.SHIFT=_SHIFT;
      EVT3.CTRL=_CTRL;
      EVT3.ALT=_ALT;
    }
    if (EVT2.KEY==Nil) EVT2.KEY=EVT2.SCANCODE;
  }
  if (EVT.type=="click" || EVT.type=="mousemove") {
    if (EVT.type=="click") EVT2.KEY=KeyClick;
    if (EVT.type=="move") EVT2.KEY=KeyMove;
    EVT2.X=0; // EVT.clientX-TARGET.x(); // FIXME: implement x(), y()
    EVT2.Y=0; // EVT.clientY-TARGET.y();
  }
  EVT2.SHIFT=_SHIFT;
  EVT2.CTRL=_CTRL;
  EVT2.ALT=_ALT;
  if (EVT3!=Nil) return EVT3;
  if (EVT2.TAG=="keyup" || EVT2.TAG=="keydown" && keyboardIsChar(EVT2.KEY)) return Nil;
  if (EVT2.TAG=="keydown") EVT2.TAG="keypress";
  return EVT2;
});
setprop(dom,"propagate",function (EVT) {
  EVT=dom.event(EVT);
  if (EVT!=Nil) {
    if (dom.focussed()!=Nil
     && (EVT.TAG=="keydown" || EVT.TAG=="keyup" || EVT.TAG=="keypress")) EVT.TARGET=dom.focussed();
  //alert("dom.propagate "+EVT.TARGET.id+" "+EVT.TAG.toString()+" "+EVT.KEY);
    var _E=EVT.TARGET;
    while (_E!=Nil) { // FIXME: should be able to use the UP slot of domelts
      if (!isUndefined(_E[SymbolFrom])) {
        var E=_E[SymbolFrom];
        if (E!=Nil && E.from()!=Nil) {
        //if (EVT.TAG=="click") E.WIDGET.focus(); // TODO: see if this is right
          EVT.TARGET=E.from();
          html.propagate(EVT);
          break;
        }
      }
      _E=_E.parentNode;
    }
  }
});

// Init
function domInit() {
  if (!SERVER) {
    DomElement=prototype(prototype(prototype(prototype(document.createElement("div"))))).constructor; // TODO: check that this is robust
    document.addEventListener("keyup",dom.propagate,false);
    document.addEventListener("keydown",dom.propagate,false);
    document.addEventListener("keypress",dom.propagate,false);
    document.addEventListener("click",dom.propagate,false);
  //document.addEventListener("mousemove",dom.propagate,false);
  }
}
