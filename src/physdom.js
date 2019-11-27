/*
 * physdom.js
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

var DomElement;

if (SERVER) {
  var physdom=type(function (TAG,VAL) {
                if (!isString(TAG)) error("physdom.cons(0)");
                var RES=physdom.create();
                if (TAG=="#text") {
                  if (!isString(VAL)) error("physdom.cons(1)");
                  RES.nodeType=TEXT_NODE;
                }
                else {
                //if (/*TODO: check TAG is an actual HTML tag*/) error("physdom.cons(2)");
                  RES.nodeType=ELEMENT_NODE;
                  RES.nodeName=TAG;
                  RES.childNodes=[];
                  RES.style={};
                }
                return RES;
              },
              { "NAME":"physdom", "PARENT":obj, "ATTRS":["nodeType","nodeName","childNodes"] });
}
else {
  function physdom(TAG,VAL) {
    if (!isString(TAG)) error("physdom.cons(0)");
    if (TAG=="#text") {
      if (!isString(VAL)) error("physdom.cons(1)");
      return document.createTextNode(VAL);
    }
    else {
    //if (/*TODO: check TAG is an actual HTML tag*/) error("physdom.cons(2)");
      return document.createElement(TAG);
    }
  }
}

function isPhysDomTextNode(O) {
  return O.nodeType==TEXT_NODE;
}
function isPhysDomElement(O) {
  if (SERVER) return O.nodeType==ELEMENT_NODE;
         else return isa0(O,DomElement);
}

setprop(physdom,"getById",function (ID) {
  if (SERVER) return Undefined; // TODO: implement indexing by ID 
         else return document.getElementById(ID);
});
setprop(physdom,"getByName",function (NAME) {
  if (SERVER) return []; // TODO: implement indexing by TagName
         else return document.getElementsByTagName(NAME);
});

if (SERVER) {
  physdom.setMethod("getAttribute",function (NAME) {
    return this[lcase(NAME)];
  });
  physdom.setMethod("setAttribute",function (NAME,VAL) {
    this[lcase(NAME)]=VAL;
  });
  physdom.setMethod("appendChild",function (E) {
  });
  physdom.setMethod("insertBefore",function (NEW,E) {
  });
  physdom.setMethod("replaceChild",function (E,OLD) {
  });
  physdom.setMethod("removeChild",function (E) {
  });
}

// Init
function physdomInit() {
  if (!SERVER) {
    DomElement=prototype(prototype(prototype(prototype(document.createElement("div"))))).constructor; // TODO: check that this is robust
  }
}
