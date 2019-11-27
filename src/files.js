/*
 * files.js
 *
 * Copyright (C) Henri Lesourd 2017, 2018, 2019.
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

// File error contexts
var SymbolLicol=Symbol("licol");
function licolSet(S,LI,COL,FNAME) {
  if (isUnboxed(S)) S=new String(S);
  S[SymbolLicol]={ LI:LI, COL:COL, FNAME:FNAME }; 
  return S;
}
function licol(S) {
  var LICOL;
  if (isBoxed(S)) LICOL=S[SymbolLicol];
  if (isUndefined(LICOL)) LICOL={ LI:-1, COL:-1, FNAME:Undefined }; 
  return LICOL;
}
function errlicolSet2(LICOL) { // FIXME: find a way to redefine errlicolSet() in a transparent way
  if (isString(LICOL)) LICOL=licol(LICOL);
  errlicolSet(LICOL.LI,LICOL.COL,LICOL.FNAME);
}

// Files
function fileExists(fname) {
  if (SERVER) return fs.existsSync(fname);
         else return httpSend("GET","http://localhost:8080/fileExists?"+fname); // FIXME: replace by a jix server call
}
function fileIsDir(fname) {
  var fd=fs.openSync(fname,"r");
  var stats=fs.fstatSync(fd);
  return stats.isDirectory();
}
function fileStats(fname) {
  if (!fileExists(fname)) return { mtime:new Date("1/1/80") };
  var fd=fs.openSync(fname,"r");
  return fs.fstatSync(fd);
}
function fileRead(fname,encoding/*FIXME: use this ; or remove it*/) { // TODO: verify that it does automatically converts line endings to a canonic form (i.e., "\n", whether line endings are UNIXy or MSDOSy)
  if (SERVER) {
    if (!fileExists(fname)) error("File not found: "+fname);
    if (isUndefined(encoding)) encoding="utf8";
    var RES=fs.readFileSync(fname,"latin1"/*"ascii"*/);
    if (encoding=="utf8") RES=Buffer.from(RES,"latin1").toString("utf8");
    return licolSet(RES,1,1,fname);
  }
  else return httpSend("GET","http://localhost:8080/"+fname); // FIXME: replace by a jix server call
}
function filePath(fname) {
//return path.dirname(fname);
  var a=fnameNormalize(fname).split("/"),s="";
  for (var i=0;i<length(a)-1;i++) {
    s+=a[i];
    if (i+2<length(a)) s+="/";
  }
  return s;
}
function fileName0(fname) {
  var a=fname.split("/");
  return a[length(a)-1];
}
function fileName(fname) {
  var a=fname.split(".");
  return fileName0(a[0]); //path.basename(a[0]);
}
function fileExt(fname) {
  var a=fname.split(".");
  return length(a)>1?a[length(a)-1]:Undefined;
}
function fileWrite(fname,str,encoding) { // TODO: if we want to have CRLF line endings, add "\r\n" at the end ; otherwise, "\n" (if there are no other discordant line endings) ; add a parm for this
  try {
    if (isUndefined(encoding)) encoding="utf8";
    fs.writeFileSync(fname,str,encoding); // FIXME: convert back from UTF8 to Latin1 (is this necessary ? Decide a standard way to do it)
  }
  catch (err) {
    error("Can't write file: "+fname);
  }
}
function fileCopy(SRC,DEST,ENC) {
  if (SRC==DEST) return;
  var S=fileRead(SRC,ENC);
  fileWrite(DEST,S,ENC);
}
function fileDelete(fname) {
  fs.unlinkSync(fname);
}

// Directories
function dirCreate(fname) {
  try {
    fs.mkdirSync(fname);
  }
  catch (err) {
    error("Can't create directory: "+fname);
  }
}
function vfileCreate(dir,fname,isDir,parent,val) {
//console.log("Loading "+dir+"/"+fname);
  var D=fileStats(dir+"/"+fname).mtime;
  return {"dir":trim(replaceAll(dir,"//","/"),"/",false,true),"fname":fname,
          "isDir":isDir,
          "date":D,
          "isModified":false,"val":val,
          "parent":parent};
}
_READ={};
function fileReadSet(ext,readFunc) {
  _READ[ext]=readFunc;
}
function dirRead(fname,mask,rec,ldf) {
  function fileRead(fname) {
    var dir=path.dirname(fname)+"/";
    fname=path.basename(fname);
    var val="";
    var readFunc=_READ[fileExt(fname)];
    if (readFunc!=undefined) {
      val=readFunc(dir+fname);
      val=replaceAll(val,"\r\n","\n");
    }
    return val;
  }
  var predir=path.dirname(fname)+"/";
  fname=path.basename(fname);
  if (isUndefined(mask)) mask="*";
  var d=vfileCreate(predir,fname,true,null,{});
  var dir=fname;
  if (predir!="") dir=predir+"/"+fname;
  var a=fs.readdirSync(dir);
  for (var i=0;i<a.length;i++) {
    var b=fileIsDir(dir+"/"+a[i]);
    if (b) {
      if (rec) {
        d.val[a[i]]=dirRead(dir+"/"+a[i],mask,rec,ldf);
        d.val[a[i]].parent=d;
      }
      else
      if (strMatch(a[i],mask)) {
        d.val[a[i]]=vfileCreate(dir,a[i],b,d,{});
      }
    }
    else {
      var matches=strMatch(a[i],mask);
      if (matches) {
        d.val[a[i]]=vfileCreate(dir,a[i],b,d,null);
        if (ldf) d.val[a[i]].val=fileRead(dir+"/"+a[i]);
      }
    }
  }
  return d;
}
function foreach_vfile(d,func) {
  for (var fname in d.val) {
    var f=d.val[fname];
    if (f.isDir) foreach_vfile(f,func);
            else func(f);
  }
  func(d);
}
function fnameNormalize(fname) {
  return replaceAll(path.resolve(path.normalize(fname)),"\\","/");
}
function fnameIsAbsPath(fname) {
  return isString(fname) && (fname[0]=="/" || fname[1]==":");
}
function vfilePathname(vf) {
  var a=[];
  do {
    a.push(vf.fname);
    vf=vf.parent;
  }
  while (vf!=null);
  return fnameNormalize(a.reverse().join("/"));
}
function isChildPath(p,parent) {
  p=path.normalize(p);
  parent=path.normalize(parent);
  if (parent[0]=="." && p[0]!='/') p="./"+p; //FIXME: Sort out all the other cases with "."
  return startsWith(p,parent);
}

// URLs
function urlParse(U) {
  var RES;
  if (SERVER) RES=url.parse(U);
         else RES=physdom('a'),RES.href=U; // FIXME: due to the use of <a href ...>, urlParse() uses the current location of the page when one uses local URLs
  return RES;
}
function urlNormalize(U,BASE) {
  U=trim(U);
  if (isUndefined(BASE)) BASE="";
  var I=strFind(U,"://")
  if (I!=-1) {
    var P=substring(U,0,I+3),U=substring(U,I+3,length(U));
    return P+U; //replaceAll(path.normalize(U),"\\","/"); FIXME: find a way to have path.normalize() work on the client, too
  }
  else {
    if (BASE!="" && BASE[length(BASE)-1]!="/" && U!="" && U[0]!="/") BASE+="/";
    return BASE+U;
  }
}
function urlSelf() {
  if (SERVER) return Nil;
         else return urlParse(trim(document.location.href,"/",false,true));
}

// Console (output) ; TODO: Improve this and make it generic
var ColorNone           ="0",
    ColorBright         ="1",
    ColorNoBright       ="22",
    ColorUnderscore     ="4",
    ColorNoUnderscore   ="24",
    ColorBlink          ="5",
    ColorNoBlink        ="25",
    ColorReverse        ="7",
    ColorNoReverse      ="27";

var ColorBlack          ="30",
    ColorRed            ="31",
    ColorGreen          ="32",
    ColorBrown          ="33",
    ColorBlue           ="34",
    ColorMagenta        ="35",
    ColorCyan           ="36",
    ColorWhite          ="37",
    ColorGrey           ="b30",
    ColorBrightRed      ="b31",
    ColorBrightGreen    ="b32",
    ColorYellow         ="b33",
    ColorBrightBlue     ="b34",
    ColorBrightMagenta  ="b35",
    ColorBrightCyan     ="b36",
    ColorBrightWhite    ="b37";
    ColorBgBlack        ="40",
    ColorBgRed          ="41",
    ColorBgGreen        ="42",
    ColorBgBrown        ="43",
    ColorBgBlue         ="44",
    ColorBgMagenta      ="45",
    ColorBgCyan         ="46",
    ColorBgWhite        ="47";

var
   HTMLColor={}; // TODO: finish this
   HTMLColor[ColorBlack]="#000000",HTMLColor[ColorRed]="#FF0000";
   HTMLColor[ColorGreen]="#00FF00",HTMLColor[ColorBrown]="#800080";
   HTMLColor[ColorBlue]="#000080",HTMLColor[ColorMagenta]="#008080";
   HTMLColor[ColorCyan]="#0000FF",HTMLColor[ColorWhite]="#808080";

function htmlEscapeChars(html) {
  var res="";
  for (var i=0;i<html.length;i++) {
    var c=html[i];
    if (c=='<') c="&lt;";
    if (c=='>') c="&gt;";
    if (c=='&') c="&amp;";
    res+=c;
  }
  return res;
}
function htmlEscapeBlanks(html) {
  var res="";
  for (var i=0;i<html.length;i++) {
    var c=html[i];
    if (c=='\n') c="<br>";
    if (c==' ') c="<span style=\"white-space:pre-wrap;\"> </span>"; //"&nbsp;"; // TODO: Make the generated HTML code shorter (with an <spc> tag, styled with CSS)
    res+=c;
  }
  return res;
}

var OUTS=Nil;
function startOutS() {
  OUTS="";
}
function stopOutS() {
  OUTS=Nil;
}
function getOutS() {
  return OUTS;
}
function _out0(S) {
  if (!isString(S)) { console.log("<"+display(S)+">");error("out0"); }
  if (OUTS==Nil) if (SERVER) process.stdout.write(S); else document.write(S);
            else OUTS+=S; // FIXME: use an array instead, and join() it in flush()
}
function out0(S) {
  return _out0(S);
}
function _out(S) {
  if (SERVER || OUTS!=Nil) out0(S); else out0(htmlEscapeBlanks(htmlEscapeChars(S)));
}
function out(O) {
  return _out(O);
}
function outd(O) {
  out(display(O));
}
function br(s) {
  out0("<br>");
}
function hr(s) {
  out0("<hr>");
}

function esc(C) {
  if (SERVER) return "\x1b["+C+"m";
  else {
    C=HTMLColor[C];
    return C==undefined?"":"</font><font color=\""+C+"\">"; // FIXME: emit "</font>" exactly at the right time
  }
}
function color(C) {
  if (C[0]=="b") out0(esc(ColorBright)),C=substring(C,1,length(C));
            else out0(esc(ColorNoBright));
  out0(esc(C));
}
function cr() {
  out("\n");
}
function spc(N,C) {
  var RES="";
  if (isUndefined(C)) C=" ";
  while (N--) RES+=C;
  return RES;
}
function indent(N) {
  while (N--) out(" ");
}
var OUTINDENT=0;
function outIndent() {
  indent(OUTINDENT);
}
function outIndentInc(N) {
  OUTINDENT+=N;
}
function crIndent() {
  cr();
  outIndent();
}

// Console (input)
function consoleInputMode(RAW) {
  if (isUndefined(RAW)) RAW=False;
  process.stdin.setRawMode(RAW);
}

function consoleMain(FUNC) {
  process.stdin.on('data',FUNC);
}
function consoleRepeat(FUNC,ONCE) {
  FUNC();
  consoleMain(function (KEY) {
    if (ONCE) process.exit(0);
    FUNC();
  });
}

// Console (init)
function consoleInit() {
  ColorBlue=env("TERM")=="cygwin"?"37":"34"; // NOTE: Bug colors cygwin term ...
  ColorWhite=env("TERM")=="cygwin"?"34":"37";
}

// Environment
function env(VAR) {
  if (SERVER) return process.env[VAR]; else return "";
}

// Processes
function argvRemove(argv,j) {
  splice(argv,j,1,[]);
}
function processCwd() {
  return fnameNormalize(process.cwd());
}
function chdir(PATH) {
  return process.chdir(PATH);
}
function spawn(EXE,PARM,ASYNC) {
  function from(S,KEEP) {
    if (S==Nil) return "";
    return Buffer.from(S).toString();
  }
  if (ASYNC) return child_process.spawn(EXE,PARM);
  else {
    var RES=child_process.spawnSync(EXE,PARM);
    if (RES.stderr==Nil || from(RES.stderr).length>0) {
      throw new Error(from(RES.stderr));
    }
    return from(RES.stdout);
  }
}

// Python
function scriptFind(CMD) {
  if (!fnameIsAbsPath(CMD)) {
    var PATH;
    if (isDefined(project.cwp())) PATH=project.cwp().CONF.BIN;
    if (isDefined(project.JIXPROJ)
     && (isUndefined(PATH) || !fileExists(PATH+"/"+CMD))) PATH=project.JIXPROJ.CONF.BIN;
    if (isDefined(PATH) && fileExists(PATH+"/"+CMD)) CMD=PATH+"/"+CMD;
  }
  if (!fnameIsAbsPath(CMD)) CMD=Nil;
  return CMD;
}
function pythonExe() {
  var PYTHON=env("PYTHON_HOME");
  function ex(FP) {
    return fileExists(FP+"/python") || fileExists(FP+"/python.exe");
  }
  if (!(isDefined(PYTHON) && ex(PYTHON))) {
    PYTHON=env("PYTHON_PATH");
    var L=splitTrim(PYTHON,";").map(fnameNormalize); // TODO: detect if we are running under UNIX, and in that case, use ":" to split
    PYTHON=Undefined;
    for (var DIR of L) if (ex(DIR)) { PYTHON=DIR;break; }
  }
  if (isDefined(PYTHON) && ex(PYTHON)) PYTHON+="/python";
                                  else PYTHON=Undefined;
  return PYTHON;
}
function python(CMD,PARMS) {
  CMD=scriptFind(CMD);
  if (!fnameIsAbsPath(CMD)) error("python::script "+CMD+" not found");
  var PYTHON=pythonExe();
  if (isUndefined(PYTHON)) error("python not found");
  return spawn(PYTHON,[CMD].concat(PARMS));
}

// Init
var fs,path,url,child_process;
if (SERVER) {
  fs=require('fs');
  path=require('path');
  url=require('url');
  child_process=require('child_process');
}
consoleInit();
