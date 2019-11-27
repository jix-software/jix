/*
 * csvf.js
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

// Parsing
function csvparseObjVals(S) {
  var A=tokenize(S,True);
  if (length(A)==0) error("csvparseObjVals");
  var EXP="v",I=0,RES=[];
  while (I<length(A)) {
    if (EXP=="v") {
      var VAL="";
      while (I<length(A) && A[I]!=",") VAL+=A[I],I++;
      RES.push(VAL);
      EXP="s";
    }
    else {
      if (A[I]!=",") out(A[I]),error("csvparseObjVals(2)");
      I++;
      EXP="v";
      if (I>=length(A)) RES.push("");
    }
  }
  return RES;
}
function csvparseObj(S,TYPE,SLOT,CONT) {
  var A=csvparseObjVals(S),O={};
  if (length(A)!=length(SLOT)) out(display(A)),cr(),out(display(SLOT)),cr(),error("csvparse");
  for (var I=0;I<length(A);I++) {
    var VAL=A[I];
    if (length(VAL)>1 && VAL[0]=='"' && VAL[length(VAL)-1]=='"') VAL=trim(VAL,'"',True,True);
    O[SLOT[I]]=VAL;
  }
  return TYPE(O,CONT);
}
function csvparsef(S,CONT,TYPE) {
  csvparsefStart();
  var A=splitTrim(S,"\n"),RES=[];
  if (length(A)==0) error("csvparsef");
  var SLOT=splitTrim(A[0],","),
      TYNAME;
  for (var I=0;I<length(SLOT);I++) { // FIXME: unify addr's parsing with this syntax, and remove this code
    if (I==0) {
      var A2=splitTrim(SLOT[0],"||");
      if (length(A2)>1) TYNAME=A2[0],SLOT[0]=A2[1];
    }
    SLOT[I]=splitTrim(SLOT[I],":")[0];
  }
  if (isType(CONT)) TYPE=CONT,CONT=Undefined;
  if (isDefined(TYNAME) && isUndefined(TYPE)) {
    TYPE=type(Nil,{ NAME:TYNAME, PARENT:obj, ATTRS:SLOT });
  }
  if (isUndefined(TYPE)) TYPE=obj; //error("csvparsef(2)");
  RES.push(SLOT);
  for (var I=1;I<length(A);I++) {
    if (length(A[I])==0) continue;
    RES.push(csvparseObj(A[I],TYPE,SLOT,CONT));
  }
  return RES;
}

function csvparsefStart() {
  charsInit();
  charnatSet("'",CharNatAlf);
  charnatSet("(",CharNatAlf); // FIXME: "," should be ALN, rather than doing this
  charnatSet(")",CharNatAlf);
  charnatSet("[",CharNatAlf); 
  charnatSet("]",CharNatAlf);
  charnatSet("?",CharNatAlf);
  charnatSet(".",CharNatAlf);
  charnatSet(";",CharNatAlf); // FIXME (END)
  charnatSet("!",CharNatAlf); // FIXME: as a default, all characters except "," should be Alf. Implement a real context for charnats in the tokenizer
  tokenizeStart(",");
  TOKENIZECOMMENTS=False;
}

// Serializing
function csvserializef(L) {
  startOutS();
  var SLOT=L[0];
  for (var I=0;I<length(SLOT);I++) {
    if (I>0) out(",");
    out(SLOT[I]);
  }
  cr();
  var A=splitTrim(SLOT[0],"||");
  if (length(A)>1) SLOT[0]=A[1];
  for (var I=1;I<length(L);I++) {
    for (var J=0;J<length(SLOT);J++) {
      if (J>0) out(",");
      var VAL=L[I][SLOT[J]];
      if (isUndefined(VAL)) VAL="";
      if (contains(VAL,",")) VAL='"'+VAL+'"';
      out(VAL);
    }
    cr();
  }
  var RES=getOutS();
  stopOutS();
  return RES;
}

// CSV (raw)
// TODO: reunify this with csvparsef()
function csvRawCheck(L) {
  if (!isArray(L)) return False;
  if (length(L)>0) {
    if (!isArray(L[0]) || length(L)==0) return False;
    var N=length(L[0]);
    for (var E of L) {
      if (!isArray(E) || length(E)!=N) return False;
      for (var S of E) if (!isString(S)) return False;
    }
  }
  return True;
}
function csvLoadRaw(FNAME) {
  //if (isUndefined(project.JIXPATH)) error("csvLoadRaw(1)");
  var TXT;
  if (isNil(pythonExe()) || isNil(scriptFind("csv2db2.py"))) {
    if (isNil(pythonExe())) error("python not found");
    if (isNil(scriptFind("csv2db2.py"))) error("Script csv2db2 not found");
  }
  else {
    TXT=python("csv2db2.py",[FNAME]); //spawn("python",[project.JIXPATH+"/bin/csv2db2.py",FNAME]);
  }
  function skipb(I) {
    while (I<length(TXT) && TXT[I]!="\n" && charIsBlank(TXT[I])) I++;
    return I;
  }
  var RES=[],L=[],J=0;
  for (var I=0;I<length(TXT);I++) {
    I=J=skipb(I);
    if (I<length(TXT)) {
      if (TXT[I]=='"' && !(I>0 && TXT[I-1]=="\\")) {
        J=I+1;
        while (J<length(TXT) && !(TXT[J]=='"' && TXT[J-1]!="\\")) {
          if (TXT[J]=="\n") error("csvLoadRaw(2)");
          J++;
        }
        L.push(substring(TXT,I+1,J));
        I=J;
      }
      else
      if (TXT[I]=="\n" || I+1==length(TXT)) {
        if (length(L)>0 && !(length(L)==1 && strIsBlank(L[0]))) RES.push(L);
        L=[];
      }
    }
  }
  if (!csvRawCheck(RES)) error("csvLoadRaw(3)");
  return RES;
}

// CSV (headers)
var csvh=type(function (L,DESCR) {
                function proto(L) {
                  var P=["",[]];
                  if (!isArray(L) || isNil(L[0])) error("csvh.proto");
                  var A=splitTrim(L[0],"||");
                  if (length(A)!=2) error("csvh.proto(2)");
                  P[0]=A[0];
                  L[0]=A[1];
                  for (var I=0;I<length(L);I++) {
                    A=splitTrim(L[I],":");
                    var SLOT;
                    if (length(A)==1) SLOT=[A[0],"str"];
                    else
                    if (length(A)==2) SLOT=[A[0],A[1]];
                                 else error("csvh.proto(3)");
                    P[1].push(SLOT);
                  }
                  return P;
                }
                if (!csvRawCheck(L) || length(L)<=0) error("csvh(1)");
                var CSVH=csvh.create();
                var P=["",[]],ISFULL=contains(L[0][0],"||");
                if (ISFULL) P=proto(L[0]);
                CSVH.NAME=P[0];
                CSVH.TYPE=P[1];
                if (ISFULL) {
                  if (length(L)>1) {
                    for (var I=1;I<length(L);I++) {
                      var LANG;
                      if (contains(L[I][0],"||")) {
                        var A=splitTrim(L[I][0],"||");
                        LANG=A[0];
                        if (!mlstr.isLang(LANG) || length(A)!=2) error("csvh(2)");
                        L[I][0]=A[1];
                      }
                      else LANG="*";
                      if (isDefined(CSVH.TITLES[LANG])) error("csvh(3)");
                      CSVH.TITLES[LANG]=L[I]; // TODO: check titles are plain alphanumeric strings
                    }
                  }
                }
                else {
                  CSVH.TITLES["*"]=L[0];
                  if (length(L)!=1) error("csvh(4)");
                }
                var RES;
                if (DESCR) RES=CSVH;
                      else RES=csvh.find(CSVH);
                if (RES==Nil) {
                  if (!ISFULL) error("csvh: "+pretty(CSVH.TITLES["*"])+" not found");
                  RES=CSVH;
                  csvh.$.push(RES);
                }
                return RES;
              },
              { "NAME":"csvh", "PARENT":obj,
                "ATTRS":["NAME=''",
                         "TYPE=Nil",
                         "TITLES={}"]
              });

csvh.$=[];
setprop(csvh,"find",function (L) { // FIXME: really, unify all these kinds of functions in only one
  if (!isCsvh(L)) L=csvh(L,1);
  var RES=Nil;
  for (var CSVH of csvh.$) if (CSVH.match(L)) RES=CSVH;
  return RES;
});
csvh.setMethod("match",function (L) {
  if (!isCsvh(L)) L=csvh(L,1);
  if (L.NAME!="" && this.NAME!=L.NAME) return False;
  function matcht(L1,L2) {
    if (length(L1)!=length(L2)) return False;
    for (var I=0;I<length(L1);I++) if (L1[I][0]!=L2[I][0] || L1[I][1]!=L2[I][1]) return False;
    return True;
  }
  function matchtit(L1,L2) {
    if (length(L1)!=length(L2)) return False;
    for (var I=0;I<length(L1);I++) if (L1[I]!=L2[I]) return False;
    return True;
  }
  if (length(L.TYPE)!=0) {
  //if (length(L.TITLES)!=0) error("csvh.match(1)");
    if (matcht(this.TYPE,L.TYPE)) return True;
  }
  else {
    var LT=L.TITLES["*"];
    if (length(L.TITLES)!=1 || isUndefined(LT)) error("csvh.match(2)");
    for (var LANG in this.TITLES) {
      if (matchtit(this.TITLES[LANG],LT)) return True;
    }
  }
  return False;
});

function isCsvh(O) {
  return isa(O,csvh);
}

setprop(csvh,"load",function (FNAME) {
  var L=csvLoadRaw(FNAME);
  return csvh(L);
});

// CSV
var csv=type(function (L) {
               RES=csv.create();
               if (!isArray(L) || isNil(L[0])) error("csv");
               RES.CSVH=L.shift();
               RES.$=L;
               return RES;
             },
             { "NAME":"csv", "PARENT":obj,
               "ATTRS":["CSVH=Nil",
                        "$=[]"]
             });

function isCsv(O) {
  return isa(O,csv);
}

setprop(csv,"load",function (FNAME) {
  var L=csvLoadRaw(FNAME);
  L[0]=csvh([L[0]]);
  return csv(L);
});
csv.setMethod("toDb",function () {
  var CSVH=this.CSVH,L=this.$,
      RES='(type NAME="'+CSVH.NAME+'" PARENT="obj" ATTRS=[',
      FIRST=True;
  for (var I=0;I<length(CSVH.TYPE);I++) {
    var NAME=CSVH.TYPE[I][0];
    if (!contains(NAME,".")) {
      if (!FIRST) RES+=" ";
      var TY=CSVH.TYPE[I][1];
      if (TY!="str") RES+='"';
      RES+=NAME;
      if (TY!="str") RES+=":"+TY+'"';
      FIRST=False;
    }
  }
  RES+="])\n";
  for (var I=0;I<length(L);I++) {
    var S="("+CSVH.NAME;
    for (var J=0;J<length(CSVH.TYPE);J++) S+=" "+CSVH.TYPE[J][0]+'="'+L[I][J]+'"';
    RES+=S+" +o="+I+")\n";
  }
  return RES;
});
