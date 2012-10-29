//TODO: layers, layer numbers

var world;

//------------------------
//   Base Class
//------------------------
function Base() { } 

Base.prototype.properlyScopedEventHandler = function(f) {
  var scope = this;
  return function(evt) { f.call(scope, evt) }
}


//------------------------
//   World Class
//------------------------
World.prototype = new Base;
World.prototype.constructor = World;
function World(canvas) {
  this.objects = new Array();
  this.width = 0;
  this.height = 0;
  this.frametimes = new Array();
  this.ticks = 30;
  this.objects = new Array();

  this.setCanvas(canvas);
  window.addEventListener('resize', this.properlyScopedEventHandler(this.eventResize), false);
}

World.prototype.setWidth = function(w) { this.width = w; }
World.prototype.setHeight = function(h) { this.height = h; }

World.prototype.setCanvas = function(canvas) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.eventResize();
  this.setWidth(parseInt(canvas.getAttribute('width')));
  this.setHeight(parseInt(canvas.getAttribute('height')));
}

World.prototype.eventResize = function(evt) {
  this.canvas.width = document.body.clientWidth;
  this.canvas.height = document.body.clientHeight;
  this.setWidth(document.body.clientWidth);
  this.setHeight(document.body.clientHeight);
}

World.prototype.draw = function() {
  //clear canvas, default to black
  var c = this.context;
  c.fillStyle = "rgb(10,50,100)";
  c.fillRect(0, 0, this.width, this.height);

  for (var i in this.objects) {this.objects[i].draw()}
  this.drawFPS();
}

World.prototype.update = function() {
  for (var i in this.objects) {this.objects[i].update()}
}

World.prototype.drawFPS = function() {
  //calculate fps
  world.frametimes.push((new Date()).getTime());
  if (world.frametimes.length > 10) {world.frametimes.shift()}
  //milleseconds per frame
  var mspf = (world.frametimes[world.frametimes.length - 1] -
              world.frametimes[0]) / world.frametimes.length;
  var fps = parseInt(1 / mspf * 1000);
  this.context.fillStyle = "rgb(0,0,0)";
  this.context.font = "2em Arial";
  this.context.textBaseline = "bottom";
  this.context.fillText('FPS: ' + fps, 5, world.height);
}


//------------------------
//   SunArms Class
//------------------------

//This is an object, because I want to create multiple rings around the
// sun, so I will create multiple objects of this class
function SunArms() {
  //coordinates and radius for the ring of sun arms
  this.x = 0;
  this.y = 0;
  this.angle = 0;
  this.color = "rgb(255,0,0)";

  this.wave = 0;  //This goes from 0 to 1 and back to keep track of how far along we are in the arm wave
  this.waveDirection = 1;  //Tracks whether wave is going from 0 to 1 or 1 to 0

  this.setArms(12);
  this.setWPS(1);
  this.setRadius(10);
  this.setOuterRadiusRatio(1.5);
}

SunArms.prototype.setArms = function(arms) {
  this.arms = 12;
  this.updateMath();
}

SunArms.prototype.setRadius = function(radius) {
  this.radius = radius;
  this.updateMath();
}

SunArms.prototype.setOuterRadiusRatio = function(ratio) {
  this.outerRadiusRatio = ratio;
  this.updateMath();
}

SunArms.prototype.updateMath = function() {
  this.armAngle = 2 * Math.PI / this.arms;  //angle between arm centers
  this.xoffset = Math.sin(this.armAngle / 2) * this.radius;  //starting x point for the arm

  //Divide the angle by two to find the angle from arm center to start drawing the arm
  this.yoffset = Math.cos(this.armAngle / 2) * this.radius;  //starting y point for the arm
  this.ytipoffset = this.radius * this.outerRadiusRatio;  //how far out the arm reaches
  this.ybezoffset = (this.yoffset + this.ytipoffset) / 2; //how far out to put the bezier curve points

  //There's four bezier points, two for the first line of the sun's arm, two for the second
  this.xbezoffsets1 = [this.xoffset, this.xoffset * -0.5];  //first line's bezier points
  this.xbezoffsets2 = [this.xoffset * -0.5, this.xoffset * -1.5];  //second line's
}

SunArms.prototype.setWPS = function(wps) {
  this.wps = wps;  //This controls how many waves we do in 1 second
  this.wpt = this.wps / world.ticks; //How many waves per tick
}

SunArms.prototype.draw = function() {
  var c = world.context;

  c.save();
  c.translate(this.x, this.y);
  c.rotate(this.angle);
  c.fillStyle = this.color;

  //This calculates the bezier points using xbezoffsets{1,2} and wave
  //Basically, we want the first arm line to transition to being a mirror of the second arm line during the progression of $wave going from 0 to 1 and back.
  //So, if we wanted to go a percentage (p) of the way from x1 to x2 to get to x, we would use this formula:
  // x = x1 + p(x2 - x1)
  //That's basically what's going on here. We're going from the x values in xbezoffsets1 to the MIRRORED x values of xbezoffsets2,
  //hence the "* -1". Hope this makes sense in the future..
  var xbos1 = [(this.xbezoffsets1[0] + ((this.xbezoffsets2[0] * -1 - this.xbezoffsets1[0]) * this.wave)),
               (this.xbezoffsets1[1] + ((this.xbezoffsets2[1] * -1 - this.xbezoffsets1[1]) * this.wave))];
  var xbos2 = [(this.xbezoffsets2[0] + ((this.xbezoffsets1[0] * -1 - this.xbezoffsets2[0]) * this.wave)), 
               (this.xbezoffsets2[1] + ((this.xbezoffsets1[1] * -1 - this.xbezoffsets2[1]) * this.wave))];

  for (var i = 0; i < this.arms; i++) {
    c.beginPath();
    c.moveTo(this.xoffset, this.yoffset);
    c.bezierCurveTo(xbos1[0], this.ybezoffset, xbos1[1], this.ybezoffset, 0, this.ytipoffset);
    c.bezierCurveTo(xbos2[1], this.ybezoffset, xbos2[0], this.ybezoffset, (this.xoffset * -1), this.yoffset);
    c.fill();
    c.rotate(this.armAngle);
  }
  c.restore();
}

SunArms.prototype.update = function() {
  this.wave = (this.wave + this.wpt * this.waveDirection)
  if (this.wave > 1) { this.waveDirection = -1; this.wave = 1; }
  if (this.wave < 0) { this.waveDirection = 1; this.wave = 0; }
}



//------------------------
//   Sun Class
//------------------------
Sun.prototype = new Base;
Sun.prototype.constructor = Sun;
function Sun() {
  this.x = 0;
  this.y = 0;
  this.radius = world.height * 0.1;

  //setup a few rings
  this.rings = new Array(3);
  for (var i = 0; i < this.rings.length; i++) {
    this.rings[i] = new SunArms(world);
    this.rings[i].x = this.x;
    this.rings[i].y = this.y;
    this.rings[i].setRadius(this.radius);
    this.rings[i].setArms(12);
  }
  this.rings[1].angle = Math.PI * 2 / 12 * (2/3);
  this.rings[1].color = "rgb(255,100,0)";
  this.rings[1].wave = 1;
  this.rings[2].angle = Math.PI * 2 / 12 / 3;
  this.rings[2].color = "rgb(255,200,0)";
  this.rings[2].setWPS(2);
  this.rings[2].setOuterRadiusRatio(1.75);

  //Used for color and fade direction of center circle
  this.red = 255;
  this.green = 255;
  this.blue = 0;
  this.fade = -1;

  //Setup inputs
  window.addEventListener('mousemove', this.properlyScopedEventHandler(this.mouseMovement), false);
  window.addEventListener('click', this.properlyScopedEventHandler(this.mouseClick), false);
  window.addEventListener('resize', this.properlyScopedEventHandler(this.resize), false);
}

Sun.prototype.setRadius = function(r) {
  this.radius = r;
  for (var i in this.rings) { this.rings[i].setRadius(r); }
}

Sun.prototype.draw = function() {
  for (var i in this.rings) { this.rings[i].draw(); }
  var c = world.context;
  c.fillStyle = "rgb(" + this.red + ", " + this.green + ", " + this.blue + ")";
  c.beginPath();
  c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
  c.fill();
}

Sun.prototype.updatePosition = function(x, y) {
  this.x = x;
  this.y = y;
  for (var i in this.rings) {
    this.rings[i].x = x;
    this.rings[i].y = y;
  }
}

Sun.prototype.update = function() {
  //fade main circle
  if (this.green < 150 ) { this.fade = 1; }
  if (this.green > 255 ) { this.fade = -1; }
  this.green += 5 * this.fade;
  for (var i in this.rings) { this.rings[i].update(); }
}

Sun.prototype.mouseMovement = function(evt) {
  this.updatePosition(evt.clientX, evt.clientY);
}


Sun.prototype.mouseClick = function(evt) {
  if (this.radius > world.height * 0.2) {this.radius = world.height * 0.05};
  this.setRadius(this.radius * 1.25);
}


//------------------------
//   Leaf Class
//------------------------
function Leaf() {
  this.angle = Math.PI * 3/2;
  this.color = "rgb(0,255,0)";
}

Leaf.prototype.draw = function(x, y) {
  var length = world.height * 0.04;
  var xbezoffset = length / 4;
  var ybezoffset = length / 2;

  var c = world.context;
  c.save();
  c.translate(x, y);
  c.rotate(this.angle);
  c.fillStyle = this.color;
  c.beginPath();
  c.moveTo(0,0);
  c.bezierCurveTo(xbezoffset,ybezoffset,xbezoffset,ybezoffset,length,0);
  c.bezierCurveTo(xbezoffset,-ybezoffset,xbezoffset,-ybezoffset,0,0);
  c.lineTo(0,0);
  c.fill();
  c.restore();
}

Leaf.prototype.update = function() { }


//------------------------
//   Branch Class
//------------------------
Branch.prototype = new Base;
Branch.prototype.constructor = Branch;
function Branch(level) {
  this.targetLength = 0.5;  //percentage of screen height

  this.branchAngle = ((Math.PI * 2) / 360) * 7;  //angle of the triangle for drawing the branch
  this.branches = new Array();
  this.leaf = new Leaf();
  this.maxLevel = 3;
  this.maxChildren = 4;
  this.level = level; //keep track of how deep we are in the branching
  this.health = 0.5; //0 is dead, 1 is full heath
  this.color = "rgb(200,75,50)";

  //Where along this branch we can spawn children. 0 is base, 1 is tip
  this.minChildBranch = 0.30;
  this.maxChildBranch = 0.65;

  //Min/Max angle the child spawns away from the parent
  this.minChildAngle = Math.PI * 2 / 360 * 25;
  this.maxChildAngle = Math.PI * 2 / 360 * 45;

  //alternate what side of the branch children spawn on
  this.side = 1;

  //growth rate is how many seconds it takes to get halfway to the targetLength
  this.growthRate = 0.5;
  this.growthRatePerTick = 2 * this.growthRate * world.ticks;

  this.setLength(0);
  this.percentLength = 0; //Length compared to world height

  this.setAngle(Math.PI * 3/2);  //default to straight up
  window.addEventListener('resize', this.properlyScopedEventHandler(this.eventResize), false);
}

Branch.prototype.eventResize = function(evt) { this.setLength(this.percentLength); }

Branch.prototype.setLength = function(l) {
  this.percentLength = l;
  this.length = world.height * l;
  this.yoffset = Math.tan(this.branchAngle / 2) * this.length;
}

Branch.prototype.setAngle = function(a) {
  this.angle = a;
  this.leaf.angle = a;
}

Branch.prototype.draw = function(x, y) { 

  var c = world.context;
  c.save();
  c.translate(x, y);
  c.rotate(this.angle);
  c.fillStyle = this.color;
  c.beginPath();
  c.moveTo(0,this.yoffset);
  c.lineTo(this.length, 0);
  c.lineTo(0,this.yoffset * -1);
  c.fill();
  c.restore();

  for (var i in this.branches) {
    var newx = x + Math.cos(this.angle) * this.length * this.branches[i][0];
    var newy = y + Math.sin(this.angle) * this.length * this.branches[i][0];
    this.branches[i][1].draw(newx, newy);
  }

  this.leaf.draw(x + Math.cos(this.angle) * this.length, y + Math.sin(this.angle) * this.length);
}

Branch.prototype.update = function() {

  if (this.percentLength / this.targetLength > 0.97) { return }

  this.setLength(this.percentLength + (this.targetLength - this.percentLength) / this.growthRatePerTick);

  for (var i in this.branches) { this.branches[i][1].update() }

  //space out the children so that we spawn them evenly on the way to our target length
  //the 0.5 below is because if it were 0, new child branchs would immediately spawn
  //if it were 1, the final branch would never spawn because were never truely achieving our targetlength.
  //we just get fractionally closer and closer
  if (this.targetLength / this.maxChildren * this.branches.length < this.percentLength && this.level < this.maxLevel) {
    var branch = this.minChildBranch + Math.random() * (this.maxChildBranch - this.minChildBranch); 
    var b = new Branch(this.level + 1);
    b.targetLength = this.targetLength / (1.75 + (this.branches.length / 2));
    b.setAngle(this.angle + (this.side *= -1) * (this.minChildAngle + Math.random() * (this.maxChildAngle - this.minChildAngle)));
    this.branches.push([branch,b])
  }
}


//------------------------
//   Tree Class
//------------------------
Tree.prototype = new Base;
Tree.prototype.constructor = Tree;
function Tree() {
  this.eventResize();
  this.mouseClick();

  window.addEventListener('click', this.properlyScopedEventHandler(this.mouseClick), false);
  window.addEventListener('resize', this.properlyScopedEventHandler(this.eventResize), false);
}

Tree.prototype.draw = function() { this.trunk.draw(this.x, this.y) }
Tree.prototype.update = function() { this.trunk.update() }

Tree.prototype.mouseClick = function() {
  this.trunk = new Branch(0);
  this.trunk.targetLength = 0.6;
}

Tree.prototype.eventResize = function() {
  this.x = document.body.clientWidth / 2;
  this.y = document.body.clientHeight;
}


//------------------------
//   Misc. Functions
//------------------------
function init() {
  canvas = document.getElementById('experiment');

  if (canvas.getContext) {

    //setup world
    world = new World(canvas);
    world.objects.push(new Sun());
    world.objects.push(new Tree());

    //GO!
    run();
  }
}


function run() {
  world.draw();
  world.update();

  setTimeout(run, 1000 / world.ticks);
}

window.addEventListener('load', function() {init()}, false);
