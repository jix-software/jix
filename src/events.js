/*
 * events.js
 *
 * Copyright (C) 2014, 2019  Henri Lesourd
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

// Events
function event(TAG,TARGET,PAYLOAD) {
  this.TAG=TAG;
  this.TARGET=TARGET;
  this.PAYLOAD=PAYLOAD;
  this.X=this.Y=0;
}
var _LASTEVENT=null;

// Keyboard
var KeyReturn=0x1000+13,
    KeyEscape=0x1000+27,
    KeyLeft  =0x1000+37, // FIXME: with these values, ASCII[0|1][Key%0x1000] bumps into valid ascii chars
    KeyRight =0x1000+39,
    KeyDown  =0x1000+40,
    KeyUp    =0x1000+38,
    KeyClick =0x1000+200,
    KeyMove =0x1000+201;

var ASCII=[[],[]];
for (var I=0;I<=255;I++) ASCII[0][I]=ASCII[1][I]=null;
for (var I=65;I<=91;I++) ASCII[0][I]=I+32; // Non shifted
for (var I=65;I<=91;I++) ASCII[1][I]=I;    // Shifted
ASCII[0][KeyReturn%0x1000]=ASCII[1][KeyReturn%0x1000]=KeyReturn;
ASCII[0][KeyEscape%0x1000]=ASCII[1][KeyEscape%0x1000]=KeyEscape;
ASCII[0][KeyLeft%0x1000]=ASCII[1][KeyLeft%0x1000]=KeyLeft;
ASCII[0][KeyRight%0x1000]=ASCII[1][KeyRight%0x1000]=KeyRight;
ASCII[0][KeyDown%0x1000]=ASCII[1][KeyDown%0x1000]=KeyDown;
ASCII[0][KeyUp%0x1000]=ASCII[1][KeyUp%0x1000]=KeyUp;
ASCII[0][KeyClick%0x1000]=ASCII[1][KeyClick%0x1000]=KeyClick;
ASCII[0][KeyMove%0x1000]=ASCII[1][KeyMove%0x1000]=KeyMove;

function keyboardGetAscii(SHIFT,CHAR,KEY) {
  if (CHAR!=0 && CHAR>=32) return CHAR;
                      else return ASCII[SHIFT?1:0][KEY];
}
function keyboardIsChar(KEY) {
  return KEY<0x1000;
}

// Accessing last event's properties
function shift() { return _LASTEVENT.SHIFT; }
function ctrl() { return _LASTEVENT.CTRL; }
function alt() { return _LASTEVENT.ALT; }
function mouseX() { return _LASTEVENT.X; }
function mouseY() { return _LASTEVENT.Y; }

// Keys as strings
function keyToStr(KEY) {
  if (isString(KEY)) return KEY;
  if (keyboardIsChar(KEY)) return chr(KEY);
  switch (KEY) {
    case KeyReturn: return "return";
    case KeyEscape: return "escape";
    case KeyLeft: return "left";
    case KeyRight: return "right";
    case KeyDown: return "down";
    case KeyUp: return "up";
    case KeyClick: return "click";
    case KeyMove: return "move";
  }
  return Nil;
}
function strToKey(S) {
  if (!isString(S)) error("strToKey");
  if (length(S)==1) {
    var KEY=asc(S[0]);
    if (KEY==10) return KeyReturn;
    return KEY;
  }
  if (S=="return") return KeyReturn;
  if (S=="escape") return KeyEscape;
  if (S=="left") return KeyLeft;
  if (S=="right") return KeyRight;
  if (S=="down") return KeyDown;
  if (S=="up") return KeyUp;
  if (S=="click") return KeyClick;
  if (S=="move") return KeyMove;
  return Nil;
}
