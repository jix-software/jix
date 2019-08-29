/*
 * servers.js
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

// APIs
var APIDefault={};
var api=type(Nil,
             { "NAME":"api", "PARENT":obj, "ATTRS":[] });

function isApi(O) {
  return isa(O,api);
}

// Servers
var server=type(function (PORT,API) {
                  var RES=server.create();
                  RES.IDSRV=server.LASTIDSRV++;
                  server.SRV.push(RES);
                  if (isNumber(PORT)) {
                    RES.CATEG="l"; // Local
                    if (isUndefined(API) || typeOf(API)==obj) API=api(API);
                    if (!isApi(API)) error("server.cons(1)");
                    RES.ADDR="0.0.0.0";
                    RES.PORT=PORT;
                    RES.API=API;
                    setPrototypeOf(API,APIDefault); // FIXME: not super nice way of inheriting APIs
                                                    // TODO: implement virtual servers
                  }
                  else
                  if (PORT=="c") {
                    if (!isNumber(API)) error("server.cons(2)");
                    RES.CATEG="c"; // Client
                    RES.IDSRVPARENT=API;
                  }
                  else {
                    var URL=PORT;
                    if (!isString(URL) || !isUndefined(API)) error("server.cons(3)");
                    RES.CATEG="r"; // Remote
                  //if (URL.substring(0,7)!="http://") URL="http://"+URL;
                    var URL0=urlParse(URL);
                    RES.HREF=URL;
                    RES.ADDR=URL0.hostname;
                    RES.PORT=JSON.parse(URL0.port==""?"80":URL0.port);
                    var CLI=RES.call("_connect",[]);
                    RES.IDCLI=CLI.IDSRV;
                  }
                  return RES;
                },
                { "NAME":"server", "PARENT":obj,
                  "ATTRS":["IDSRV=0","IDCLI","IDSRVPARENT",
                           "CATEG=''","PORT=0",
                           "ADDR=''","HREF=''",
                           "API={}","_RUNNING=Nil",
                           "CONT=[]"] });

server.SRV=[];
server.LASTIDSRV=0; // FIXME: implement classes that remember their instances, and let server be such a class

setprop(server,"getById",function (ID) {
  return server.SRV[ID];
});

function isServer(O) {
  return isa(O,server);
}
function isLocal(O) {
  return isServer(O) && O.CATEG=="l";
}
function isRemote(O) {
  return isServer(O) && O.CATEG=="r";
}
function isClient(O) {
  return isServer(O) && O.CATEG=="c";
}

// Find
setprop(server,"find",function (ADDR,PORT,IDCLI) {
  var RES=Nil;
  for (var I in server.SRV) {
    var SRV2=server.SRV[I];
    if (SRV2.ADDR==ADDR && SRV2.PORT==PORT && SRV2.IDSRV==IDCLI) {
      if (RES!=Nil) error("server.find"); // Not reached
      RES=SRV2;
    }
  }
  return RES;
});

// Connect/close
function _connect() {
  if (isNil(server.currentServer())) error("_connect");
  var RES=server("c",server.currentServer().IDSRV);
  RES.ADDR=_REQLOG.ADDR.address;
  RES.PORT=_REQLOG.ADDR.port;
  return { "IDSRV":RES.IDSRV };
}

server.setMethod("close",function () {
  if (this.CATEG=="r") this.call("_close",[]); // FIXME: remove it from server.SRV[], too
  else
  if (this.CATEG=="c") { // TODO: test this
    var DONE=False;
    for (var I in server.SRV) if (server.SRV[I]==this) {
      if (DONE) error("server.close"); // Not reached
      splice(server.SRV,I,1,[]);
      DONE=True;
    }
  }
});
function _close() {
  var SRV=server.currentClient();
  SRV.close();
  return True;
}

// Calls
server.setMethod("call",function (FNAME,PARMS,CALLBACK) {
  var RES=Nil;
  if (isLocal(this)) {
  //if (server.currentClient().IDSRVPARENT!=server.currentServer()) return Nil; // TODO: later, return a more sophisticated kind of error value ;; FIXME
    var F=this.API[FNAME];
    if (isFunction(F)) {
      RES=F.apply(Nil,PARMS);
    }
  }
  else
  if (isRemote(this)) {
    PARMS.unshift(this.IDCLI);
    RES=this.send("POST","",JSON.stringify([FNAME,PARMS]),CALLBACK);
  }
  else error("server.call");
  return RES;
});

server.setMethod("send",function (METHOD,PARMS,DATA,CALLBACK) {
  var REQ,RES=null,
      ASYNC=isDefined(CALLBACK);
  function ret(RES) {
    if (RES!=null && (SERVER || REQ.getResponseHeader("Content-Type")=="application/json")) RES=JSON.parse(RES);
    return RES;
  }
  if (!isRemote(this)) error("server.send(!remote)");
  if (SERVER) {
    if (ASYNC) error("server.send(SERVER)::ASYNC");
    else {
      RES=spawn('node',
                ['./bin/httpsend.js',
                 JSON.stringify([this.HREF,DATA])
                ]);
      var L=splitTrim(RES,"\n"),
          HEADERS=JSON.parse(L[0]);
      RES=L[1];
    //if (HEADERS["content-type"]=="application/json") RES=JSON.parse(RES);
    }
  }
  else {
    if (METHOD!="GET" && !isUndefined(DATA)) DATA=JSON.stringify(DATA);
                                        else DATA=null;
    REQ=new XMLHttpRequest();
    REQ.open(METHOD,this.HREF+(PARMS!=Nil && PARMS!=""?"?"+PARMS:""),ASYNC);
    REQ.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    REQ.setRequestHeader("Accept","application/json"); // Les formats qu'on _accepte_ en reponse
    REQ.onreadystatechange=function() {
      if (REQ.readyState==4) {
        if (REQ.status==200) {
          RES=REQ.responseText;
          if (ASYNC) CALLBACK(ret(RES));
        }
      }
    }
  }
  if (SERVER) ; // ...
         else REQ.send(DATA);
  if (ASYNC) return null;
        else return ret(RES);
});

// Current client & server
var _REQLOG=Nil,_CURSRV=Nil;
setprop(server,"currentClient",function () { // Physical
  if (isNil(_REQLOG)) return Nil;
  var SRV=server.find(_REQLOG.ADDR.address,_REQLOG.ADDR.port,_REQLOG.IDCLI);
  if (!isClient(SRV)) error("server.currentClient");
  return SRV;
});
setprop(server,"currentServer",function () { // Physical
  return _CURSRV;
});

// Handler
var http=Undefined;
server.setMethod("start",function () {
  var REQNO=0;
  function req(REQ) {
    var PARMS=urlParse(REQ.url);
    return { "METHOD":REQ.method,
             "PATHNAME":PARMS.pathname,"QUERY":PARMS.query,
             "ADDR":REQ.socket.address(),"RADDR":REQ.socket.remoteAddress,
             "ACCEPT":REQ.headers.accept,"REFERER":REQ.headers.referer,
             "IDCLI":-1
            };
  }
  function log(NO,REQ,BODY,ERR,ANSW) {
    out(REQ.METHOD+"<#"+NO+"><"+
        REQ.ADDR.address+":"+REQ.ADDR.port+"::"+
        REQ.IDCLI+" "+REQ.PATHNAME+" "+REQ.QUERY+">");
    if (REQ.METHOD=="GET") out("[]"); else out(BODY.toString());
    cr(),out("["+JSON.stringify(ERR)+"]=> ");
    if (REQ.METHOD=="GET") out("..."); else out(ANSW);
    cr(),cr();
  }
  var THIS=this;
  function handler(REQ,ANSW) {
    var REQLOG=_REQLOG=req(REQ);
    _CURSRV=THIS;
    function ret(ERR,CTYPE,MSG,RES,BIN) {
      if (CTYPE=="application/json") RES=isUndefined(RES)?"null"/*FIXME: clean this*/:JSON.stringify(RES);
      var SRES=RES;
      if (!BIN && length(SRES)>80) SRES=substring(RES,0,80)+" ...";
      log(REQNO++,REQLOG,MSG,ERR,SRES);
      ANSW.writeHead(ERR, {'Content-Type': CTYPE,
                           'Access-Control-Allow-Origin': '*' // Available to all
                          });
    //RES=Buffer.from(RES,"latin1").toString("utf8"); // TODO: doesn't work for sending data from cli->srv ; need to have everything in UTF8 in srv, and do all communications in utf8, and optionally, reexport to latin1 for the files
      if (isDefined(BIN)) ANSW.end(RES);
      else {
        ANSW.write(RES);
        ANSW.end("\n");
      }
      _REQLOG=_CURSRV=Nil;
    }
    if (endsWith(REQLOG.PATHNAME,".jix")) { // FIXME: extension should rather be ".srv"
      if (REQ.method=="POST") {
        var MSG="",ISOBJ=false;
        REQ.on('data', function (DATA) {
          if (ISOBJ) error("serverCreate(multipart obj)");
          else {
            if (typeOf(DATA)==str) MSG+=DATA;
            else {
              MSG=DATA;
              ISOBJ=true;
            }
          }
        });
        REQ.on('end',function () {
          if (ISOBJ) MSG=JSON.parse(MSG.toString());
          var PARMS=JSON.parse(MSG);
          REQLOG.IDCLI=PARMS[1].shift();
          var RES=THIS.call(PARMS[0],PARMS[1]); // FIXME: return a 404 when the API entry doesn't exists
          ret(200,"application/json",MSG,RES);
        });
      }
      else
      if (REQ.method=="GET") {
        ret(200,"application/json","",{ _type:"error", MSG:"RPCs must be POST"});
      }
    }
    else {
      function rd(PATH,BIN,FUNC) {
        if (BIN) fs.readFile(PATH,FUNC); // DOESN'T WORK with 'binary' as the second parameter, e.g. for images !
            else fs.readFile(PATH,'utf-8',FUNC);
      }
      var BIN=False;
      if (endsWith(REQLOG.PATHNAME,".jpg")) BIN=True;
      rd(__dirname+'/'+REQLOG.PATHNAME,BIN,function(ERR,DATA) {
        ; // FIXME: if the pathname is void, set pathname=index.html
        if (ERR) {
          ret(404,"text/html","",'<h1>Page Not Found</h1>');
        }
        else { 
          var MIME="text/html";
          if (endsWith(REQLOG.PATHNAME,".css")) MIME="text/css";
          if (endsWith(REQLOG.PATHNAME,".jpg")) MIME="image/jpeg";
          ret(200,MIME,"",DATA,BIN);
        }
      });
    /*var s = fs.createReadStream(__dirname+'/'+REQLOG.PATHNAME); // Probably better asynchronicity. 
      s.on('open', function () {
        res.setHeader('Content-Type','image/jpg');
        s.pipe(res);
      });
      s.on('error', function () {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 404;
        res.end('Not found');
      });*/
    }
  }
  if (!isNil(this._RUNNING)) error("server.start");
  var SRV=http.createServer(handler);
  this._RUNNING=SRV;
  SRV.on('connection', function (SOCK) { SOCK.unref(); });
  SRV.listen(this.PORT,"0.0.0.0");
//console.log('Server running at http://localhost:'+this.PORT+'/');
});

server.setMethod("stop",function () {
  if (isNil(this._RUNNING)) error("server.stop");
  this._RUNNING.close();
  this._RUNNING=Nil;
});

// Containers
server.setMethod("attach",function (CONT) {
  if (!isContainer(CONT) || isDefined(CONT.SRV)) error("server.attach");
  this.CONT[CONT.IDCONT]=CONT;
  CONT.SRV=this;
});

server.setMethod("container",function (NAME,FOP) {
  if (FOP) {
    var CONT=this.container(NAME);
    if (isNil(CONT)) {
      CONT=container(NAME,this);
    }
    return CONT;
  }
  else return find(this.CONT,function (X) { return isDefined(X) && X.NAME==NAME });
});
function _fetchconts() {
  return RES=server.currentClient().containers(True).map(function (C) {
    return {"NAME":C.NAME};
  });
}
server.setMethod("containers",function (FETCH) {
  if (FETCH) {
    if (isLocal(this)) ;
    else
    if (isRemote(this)) {
      var L=this.call("_fetchconts",[]);
      for (var C of L) {
        this.container(C.NAME,True);
      }
    }
    else
    if (isClient(this)) {
      var SRV=server.getById(this.IDSRVPARENT);
      for (var C of SRV.containers()) {
        if (isString(C.NAME) && C.NAME!="") {
          this.container(C.NAME,True);
        }
      }
    }
    return this.containers();
  }
  else return this.CONT.filter(function (X) { return isDefined(X); });
});

// Queries
function _grep(NAME/*Local*/,Q) {
  var CONT=server.getById(server.currentClient().IDSRVPARENT).container(NAME);
  if (isNil(CONT)) error("_grep");
  return serialize(CONT.query(Q),"flat*");
}

// Synchronization
function _syncobjs(NAME/*Local*/,S) {
  var CONT=server.getById(server.currentClient().IDSRVPARENT).container(NAME);
  if (isNil(CONT)) error("_syncobjs");
  parse(S,CONT);
  return True;
}

// Misc.
function _srvls() {
  var T={ "l":"LOC", "r":"REM", "c":"CLI" };
  function cls(CONT) {
    outd(CONT.IDCONT),out(" ");
    outd(CONT.SRV.IDSRV),out(" [");
    outd(CONT.NAME),out(";");
    outd(CONT.FNAME),out("]");
  }
  function ls(SRV) {
    out(T[SRV.CATEG]),
    out(" "),outd(SRV.IDSRV);
    out(" "),outd(SRV.IDCLI);
    out(" "),outd(SRV.HREF);
    out(" "),outd(SRV.ADDR);
    out(" "),outd(SRV.PORT);
    for (var C of SRV.containers()) cr(),out("  "),cls(C);
  }
  for (var I in server.SRV) ls(server.SRV[I]),cr();
  return Nil;
}

// Init
function serversInit() {
  if (SERVER) {
    http=require('http');
    APIDefault={ "_connect": _connect,
                 "_close": _close,
                 "_srvls": _srvls,
                 "_fetchconts": _fetchconts,
                 "_grep": _grep,
                 "_syncobjs": _syncobjs
               };
  }
}
