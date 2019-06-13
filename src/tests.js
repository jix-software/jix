/*
 * tests.js
 *
 * Copyright (C) Henri Lesourd 2019.
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

// Test1
function test1() {
  parsefStart();
  var S="(56abcd1234 [befghij \"abcd\\\\\"])",
      RG=lexerStart(S);
  while (!lexerEOF(RG)) {
    out("<"+rangeValue(RG)+">"),cr();
    out(display([RG.MIN,RG.MAX,RG.NAT,RG.LI,RG.COL])),cr();
    lexerNext(RG);
  }
  out("---\n");
  var A=tokenize(S);
  out(display(A)),cr();
  out("---\n");
/*S=fileRead("scories/DB0.bee");
  out(S),cr();
  out("---\n");*/
  A=tokenize(S);
/*out(display(A)),cr();
  out("---\n");*/
  var person=type(Nil,{ NAME:"person" });
  var O=person({ "NAME":"Smith", "FNAME":"John", "AGE":43 });
  out(pretty(O,"short")),cr();
  out("---\n");
  type(Nil,{ NAME:"range" });
  var O=parsef('range{+o:"id1",A:1,B:2,C,D,E,F:{}}{Z:1}'); //parsef("(range A=1 B=2 C D E F=())(Z=1)","lisp");
  out(pretty(O)),cr();
  out("---\n");
  out(serializef(O,[["range","flat",
                      [["ID"],["A"],["B"],["F"],["$",{"nl":1}]]
                    ],
                    ["*","full",[]]],"json")),out("_"),cr();
  out("---\n");
  out(pretty(O)),cr();
}

// Test2
function test2() {
  var C=container("C1"),
      person=type(Nil,{ NAME:"person", ATTRS:["NAME=''","FNAME","AGE=0","> YEARS=[]"] }),
    //P=person({ NAME:"Smith", FNAME:"John", AGE:23, YEARS:[123,456] });
      P=person({ NAME:"Smith", FNAME:"John", AGE:23, YEARS:[{ A:123 },{ B:456 }] });
//out(serialize(person)),cr(); FIXME: hangs silently
  out(pretty(P)),cr();
  var P2=copy(P,C);
  out(pretty(P2)),cr();
  out(pretty(P2.YEARS[0])),cr();
  P2.delete();
  out(pretty(P2)),cr();
}

// Test3
var SK={ "song":{ "short":{ "Title":["av",""],
                          "Authors":["av",""],
                             "Year":["av",""]
                              /*"*":["av",""]*/ }
                },
            "*":{ "short":{   "+o":["av",""],
                            "NAME":["av",""] }
                }
       };
function test3() {
  var C=container("C1");
  C.load("./Songs","db");
  SK["song"]["short"][SymbolCont]=["-",""];
  SK["song"]["short"][SymbolId]=["av",""];
  out(pretty(C.$[0],"short",SK)),cr();
/*for (var I=0;I<length(C.$);I++) {
    out(pretty(C.$[I],"short",SK)),cr();
  }*/
}

// Test4
function test4() {
  var S=fileRead("./Songs.csv"),
      C=container("C1");
//var L=csvparsef(S,C);
  C.load("./Songs","csv");
  out(pretty(C.$[0],"short",SK)),cr();
  out("---\n");
  var L=C.query({ Year:"*5" });
  for (var I=0;I<length(L);I++) {
    out(pretty(L[I],"short",SK)),cr();
  }
}

// Test5
function test5() {
  var person=type(Nil,{ NAME:"person", ATTRS:["Name","FName","Age"] }),
      song=type(Nil,{ NAME:"song", ATTRS:["Title","Year","$=[]"] }),
      P1=person({ "Name":"Smith", "FName":"John", "Age":23 }),
      P2=person({ "Name":"Dupont", "FName":"Georges", "Age":27 }),
      S=song({ Title:"Imagine", Year:1981, $:[P1,P2] });
  out(serialize(S)),cr();
  var S2=tree([song,{Title:"A"},[person,{Name:"B"}],[person,{Name:"C"}]])
  out(serialize(S2)),cr();
}

// All tests
function tests() {
  test1();
  out("---\n");
  test2();
  out("---\n");
  test3();
  out("---\n");
  test4();
  out("---\n");
  test5();
}
