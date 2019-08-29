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
    else
    if (N=="msg") this.msg=VAL; //template(VAL); FIXME: with this, there is a problem in tree()
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
      "title","import",
      "@",
      "var",
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

template.setMethod("expand",function (PARMS,ISMK) {
  function exp(A) {
  //if (isString(A) && contains(A,"$")) return jxmleEval(PARMS,A); FIXME: why this doesn't work ?
    if (isString(A) && A[0]=="$") { // FIXME: this if() to be replaced by the previous one, at some point
      var VAR=substring(A,1,length(A));
      if (PARMS.hasOwnProperty(VAR)) {
        var VAL=PARMS[VAR];
      //if (typeOf(VAL)==mlstr) VAL=VAL.toString();
        return VAL;
      }
    //else error("template.expand(1)"); // TODO: see how to deal with this
    }
    if (isUndefined(ISMK)) ISMK=True;
    if (isArray(A) && length(A)==0 && isDefined(PARMS[""])) return PARMS[""];
    var RES=[];
    if (ISMK) {
      if (isArray(A) && length(A)>0 && !isType(A[0])) A.unshift(columns); // FIXME: should not need to know datatypes like columns()
      if (isAtom(A) || constructor(A)!=Array && !isTemplate(A) || length(A)<1 || !isType(A[0])) return A;
      var O=length(A)==1?{}:A[1];
      if (constructor(O)!=Object) error("template.expand(2)");
      RES[0]=A[0];
      var O2={};
      for (var N in O) O2[N]=jxmleEval(PARMS,O[N]); //exp(O[N]);
      RES[1]=O2;
    }
    else if (!isArray(A)) return A;
    for (var I=(ISMK?2:0);I<length(A);I++) RES.push(exp(A[I])); // FIXME: why couldn't we use jxmleEval() directly here ?
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
  if (isDefined(E)) { // FIXME: E must always be defined ; it's not in case JSON has been inserted cause there is no skin
    if (isUndefined(E.FROM)) error("undisplay1(1)");
    if (isUndefined(E.FROM.TO)) error("undisplay1(2)");
    delete E.FROM.TO;
    delete E.FROM;
  }
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
  if (isDefined(CTX)) {
    if (isUndefined(O)) error("html.redisplay(1)");
    delete O.TO;
    var UP=this.up(1,1),
        A=UP[0],I=UP[1];
        RES=this.display2(O,CTX);
    A.setv(I,RES);
  }
  else
  for (var I=0;I<length(this.$);I++) this.$[I].redisplay();
});

lines.setMethod("load",function (L) {
  if (isUndefined(L)) error("lines.load");
  if (isString(L)) L=parse(L)[0];
  if (constructor(L)==Object || constructor(L)==Array || isQuery(L)) {
    if (!isQuery(L)) L=query(L);
    this.TO.value=sort(this.src.query(L,1),this.sort);
  }
/*else TODO: restore this once the query format will be more sophisticated
  if (isArray(L)) {
    if (!isArray(this.value) || isDefined(this.src)) error("lines.load(1)");
    this.value=L;
  }*/
  else error("lines.load(2)");
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
  if (isDefined(this.$[0]) || isDefined(this.value)) {
    var VAL=this.value;
    if (isUndefined(VAL)) VAL=this.$[0];
    else
    if (isDefined(this.$[0])) error("input.expand(2)");
    this.TO.value=VAL; // TODO: handle this in a better way
    this.TO.TO.setv("value",VAL);
  }
});

// Splitvs
splitv.setMethod("expand",function () {
  if (!isNil(this.TO)) error("splitv.expand");
  var VAL=this.value;
  if (isUndefined(VAL)) VAL=this.$[0];
  else
  if (isDefined(this.$[0])) error("splitv.expand(2)");
  var L=splitTrim(VAL,",");
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

html.setMethod("lang",function (LANG) {
  if (isUndefined(this.FROM) || !isJxmlPure(this.FROM)) error("html.lang(1)");
  mlstr.setLang(LANG)
  this.redisplay();
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
  if (isDefined(this.FROM) && isDefined(this.FROM.msg)) {
    var T=template(parse(this.FROM.msg)[0]);
    RES=T.expand(RES,False);
  }
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
html.ATTRS=["id", "type", "name", "value"];
html.SELFCLOSE=["br", "hr", "_input", "input", "button", "var", "import","img"];
html.setMethod("toHtml",function () {
  function traverse(W) {
    if (isAtom(W)) { outd(W);return; }
    out("<"+W.TAG);
    for (var A of html.ATTRS) if (isDefined(W[A]) && isAtom(W[A])) out(' '+A+"="+serialize(W[A]));
    out(">");
    if (!contains(html.SELFCLOSE,W.TAG)) {
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

str.setMethod("fromHtml",function () {
  if (!isString(this)) error("obj.fromHtml");
  function tokstart() {
    charsInit();
    charnatSet("#",CharNatAlf);
    charnatSet("+",CharNatAlf);
    charnatSet("-",CharNatAlf);
    tokenizeStart("< / > = & ;");
  }
  function parseAtom(VAL) {
    if (VAL[0]=='"' || VAL[0]=="'") VAL=substring(VAL,1,length(VAL)-1);
    return VAL;
  }
  function parseTag(RES,A,I) {
    if (A[I]!="<") error("fromHtml.parseTag(1)");
    var TAG=A[I+1],ATTR={};
    if (TAG=="!") {
      var TAG2=A[I+2];
      if (length(TAG2)>=2 && startsWith(TAG2,0,"--")) {
        I+=2;
        while (I+1<length(A) && !(endsWith(A[I],"--") && A[I+1]==">")) I++;
        if (I+1>=length(A)) error("fromHtml.parseTag(<!...)(1)");
        return I+2;
      }
      else error("fromHtml.parseTag(<!...)(2)");
    }
    TAG=type.getByName(TAG);
    if (typeOf(TAG)!=type) TAG=A[I+1]; //error("fromHtml.parseTag(2)");
    RES[0]=TAG;
    RES[1]=ATTR;
    I+=2;
    while (A[I]!=">" && !(A[I]=="/" && A[I+1]==">")) {
      if (A[I+1]!="=") error("fromHtml.parseTag(3)::"+A[I+1]);
      if (!strIsAlpha(A[I])) error("fromHtml.parseTag(4)");
      ATTR[A[I]]=parseAtom(A[I+2]);
      I+=3;
      if (I>=length(A)) error("fromHtml.parseTag(5)");
    }
    return I;
  }
  function postc(O,I0,I) {
    if (I==I0+1) return O[I0];
    var RES=[{}];
    for (var J=I0;J<I;J++) RES.push(O[J]);
    return RES;
  }
  function copy(RES,O) {
    splice(RES,0,length(RES),[]);
    for (var I=0;I<length(O);I++) RES.push(O[I]);
  }
  function post(O) {
    if (isDefined(O[1].skin)) O[1].skin=sy(O[1].skin);
    if (isDefined(O[1].src)
     && (O[0]==superpose || O[0]==lines || O[0]==columns)/*FIXME: improve this*/) O[1].src=sy(O[1].src);
    var RES=[O[0],O[1]];
    var I0=2;
    for (var I=2;I<length(O);I++) {
      if (O[I]=="<>") RES.push(postc(O,I0,I)),I0=I+1;
    }
    if (I0!=2) {
      RES.push(postc(O,I0,I))
      copy(O,RES);
    }
  }
  function transc(C) {
    if (C[0]=="u" || C[0]=="U") return "\\"+C;
    if (C=="nbsp") return "\\u00A0";
    return "&"+C+";";
  }
  function parse(RES,A,I) {
    if (A[I]!="<") error("fromHtml.parse(1)");
    while (length(RES)==0 && I<length(A)) I=parseTag(RES,A,I);
    var NAME=RES[0];
    if (isType(NAME)) NAME=NAME.name();
    if (A[I]!="/" && !contains(html.SELFCLOSE,NAME)) {
      I+=1;
      while (!(A[I]=="<" && A[I+1]=="/")) {
        var O=[];
        if (A[I]=="&") {
          if (A[I+2]!=";") error("fromHtml.parse(2)::"+A[I+1]+"||"+A[I+2]+"_");
          O=transc(A[I+1]),I+=3;
        }
        else
        if (A[I]!="<") O=A[I],I++;
        else
        if (A[I+1]==">") O="<>",I+=2;
                    else I=parse(O,A,I);
        if (length(O)>0) RES.push(O);
        if (I>=length(A)) error("fromHtml.parse(3)");
      }
      if (A[I+2]!=NAME || A[I+3]!=">") errlicolSet2(A[I+2]),error("Missing </"+NAME+"> tag");
      I+=3;
    }
    if (A[I]=="/") I++;
    if (A[I]==">") I++;
    post(RES);
    return I;
  }
  tokstart();
  var RES=[],A=tokenize(this);
  errlicolSet(-1,-1,licol(this).FNAME);
  parse(RES,A,0);
  return RES;
});

// JXML->HTML
jxml.toHtml=function (S) {
  function ptitle(O) {
    var S="";
    for (var I=2;I<length(O);I++) S+=O[I]+(I+1<length(O)?" ":"");
    return S;
  }
  var A=S.fromHtml(),
      TITLE,
      IMPORTS=[],
      BODY=[];
  for (var I=2;I<length(A);I++) {
    var O=A[I];
    if (isArray(O) && O[0]==title) TITLE=ptitle(O);
    else
    if (isArray(O) && O[0]==origin.import) IMPORTS.push(O[1].src);
                                      else BODY.push(O);
  }
  startOutS();
  out("<!DOCTYPE HTML>"),cr();
  out("<html>"),cr();
  out("<head>");
  outIndentInc(+2),crIndent();
  out('<meta charset="utf8">'),crIndent();
  if (isDefined(TITLE)) out("<title>"+TITLE+"</title>"),crIndent();
  for (var I=0;I<length(IMPORTS);I++) {
    var S=IMPORTS[I];
    if (endsWith(S,".css")) out('<link rel="stylesheet" href="'+S+'" type="text/css" media="screen">'),
                            crIndent();
    if (endsWith(S,".js")) out('<script src="'+S+'"></script>'),crIndent();
  }
  out('<script language="javascript">');
  outIndentInc(+2),crIndent();
  out('installOnload(function () {');
  outIndentInc(+2),crIndent();
  var OSERIALIZEINDENT=SERIALIZEINDENT;
  SERIALIZEINDENT=OUTINDENT+2;
  var VNO=1;
  for (var I=0;I<length(BODY);I++) {
    var O=BODY[I];
    if (isString(O)) out('out("'+O+'");'),crIndent();
    else
    if (isArray(O) && O[0]==origin.var) {
      var SRC=O[1].src,U=urlParse(SRC),HOST=U.host,A2=splitTrim(U.pathname,"/"),
          APP=A2[1],CONTN=A2[2];
      var SRV="V"+VNO;
      VNO++;
      out('var '+SRV+'=jix.server("http://'+HOST+'/'+APP+'.jix");'),crIndent();
      out(SRV+'.containers(1);'),crIndent();
      out('var '+O[1].name+'=server.SRV[0].container("'+CONTN+'")');
      if (I+1<length(BODY)) crIndent();
    }
    else
    if (isArray(O)) {
      var ID=O[1].id;
      if (isUndefined(ID)) ID="V"+VNO,VNO++;
      out("var "+ID+"=");
      if (O[0]==skin) {
        out("skin({ ");
        for (NAME in O[1]) out(NAME+':"'+O[1][NAME]+'",');
        out("$:[");
        outIndentInc(+2),crIndent();
        for (var J=2;J<length(O);J++) {
          out(pretty(O[J],"indent"));
          if (J+1<length(O)) crIndent();
        }
        outIndentInc(-2),crIndent();
        out("]});");
      }
      else {
        out("markup(");
        outIndentInc(+2),crIndent();
        out(pretty(O,"indent"));
        outIndentInc(-2),crIndent();
        out(");");
        crIndent(),out("out("+ID+");");
      }
      if (I+1<length(BODY)) crIndent();
    }
    else error("jxml.toHtml(1)");
  }  
  SERIALIZEINDENT=OSERIALIZEINDENT;
  outIndentInc(-2),crIndent();
  out('});');
  outIndentInc(-2),crIndent();
  out('</script>');
  outIndentInc(-2),crIndent();
  out('</head>'),cr();
  out('<body');
  if (isDefined(A[1].class)) out(' class="'+A[1].class+'"');
  if (isDefined(A[1].style)) out(' style="'+A[1].style+'"'); // FIXME: escape the "s, if any
  out('>'),cr();
  out('</body>'),cr();
  out('</html>'),cr();
  var RES=getOutS();
  stopOutS();
  return RES;
}
