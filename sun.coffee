define ['cs!canvas-tools/world'], (World) ->

  #TODO: layers, layer numbers

  class SunArms
    constructor: (@world) ->
      #coordinates and radius for the ring of sun arms
      @x = 0
      @y = 0
      @angle = 0
      @color = "rgb(255,0,0)"

      @wave = 0;  #This goes from 0 to 1 and back to keep track of how far along we are in the arm wave
      @waveDirection = 1;  #Tracks whether wave is going from 0 to 1 or 1 to 0

      @setArms(12)
      @setWavesPerSecond(1)
      @setRadius(10)
      @setOuterRadiusRatio(1.5)

    setArms: (@arms) ->
      @updateMath()

    setRadius: (@radius) ->
      @updateMath()

    setOuterRadiusRatio: (@outerRadiusRatio) ->
      @updateMath()

    updateMath: ->
      # When drawing context.rotate is used so x/y coordinates are calculated
      # as if the arm is going straight up
      @armAngle = 2 * Math.PI / @arms #angle between arm centers from the center point of the sun
      @xoffset = Math.sin(@armAngle / 2) * @radius

      #Divide the angle by two to find the angle from arm center to start drawing the arm
      @yoffset = Math.cos(@armAngle / 2) * @radius  #starting y point for the arm
      @ytipoffset = @radius * @outerRadiusRatio
      @ybezoffset = (@yoffset + @ytipoffset) / 2 #how far out to put the bezier curve points

      #There's four bezier points, two for the first line of the sun's arm, two for the second
      this.xbezoffsets1 = [this.xoffset, this.xoffset * -0.5];  #first line's bezier points
      this.xbezoffsets2 = [this.xoffset * -0.5, this.xoffset * -1.5];  #second line's

    setWavesPerSecond: (@wps) ->
      @wpt = @wps / @world.ticks #How many waves per tick

    draw: ->
      c = @world.context
      c.save()
      c.translate(@x, @y)
      c.rotate(@angle)
      c.fillStyle = @color

      #This calculates the bezier points using xbezoffsets{1,2} and wave
      #Basically, we want the first arm line to transition to being a mirror of the second arm line during the progression of $wave going from 0 to 1 and back.
      #So, if we wanted to go a percentage (p) of the way from x1 to x2 to get to x, we would use this formula:
      # x = x1 + p(x2 - x1)
      #That's basically what's going on here. We're going from the x values in xbezoffsets1 to the MIRRORED x values of xbezoffsets2,
      #hence the "* -1". Hope this makes sense in the future..
      xbos1 = [(@xbezoffsets1[0] + ((@xbezoffsets2[0] * -1 - @xbezoffsets1[0]) * @wave)),
        (@xbezoffsets1[1] + ((@xbezoffsets2[1] * -1 - @xbezoffsets1[1]) * @wave))]
      xbos2 = [(@xbezoffsets2[0] + ((@xbezoffsets1[0] * -1 - @xbezoffsets2[0]) * @wave)),
        (@xbezoffsets2[1] + ((@xbezoffsets1[1] * -1 - @xbezoffsets2[1]) * @wave))]

      for i in [@arms..0]
        c.beginPath()
        c.moveTo(@xoffset, @yoffset)
        c.bezierCurveTo(xbos1[0], @ybezoffset, xbos1[1], @ybezoffset, 0, @ytipoffset)
        c.bezierCurveTo(xbos2[1], @ybezoffset, xbos2[0], @ybezoffset, (@xoffset * -1), @yoffset)
        c.fill()
        c.rotate(@armAngle)

      c.restore()

    update: ->
      @wave = (@wave + @wpt * @waveDirection)
      if (@wave > 1)
        @waveDirection = -1
        @wave = 1
      if (@wave < 0)
        @waveDirection = 1
        @wave = 0


  class Sun
    constructor: (@world) ->
      @x = 0
      @y = 0
      @radius = @world.height * 0.1

      #setup a few rings
      @rings = new Array(3)
      for i in [0..@rings.length]
        @rings[i] = new SunArms(@world)
        @rings[i].x = @x
        @rings[i].y = @y
        @rings[i].setRadius(@radius)
        @rings[i].setArms(12)

      @rings[1].angle = Math.PI * 2 / 12 * (2/3)
      @rings[1].color = "rgb(255,100,0)"
      @rings[1].wave = 1

      @rings[2].angle = Math.PI * 2 / 12 / 3
      @rings[2].color = "rgb(255,200,0)"
      @rings[2].setWavesPerSecond(2)
      @rings[2].setOuterRadiusRatio(1.75)

      #Used for color and fade direction of center circle
      @red = 255
      @green = 255
      @blue = 0
      @fade = -1

      #Setup inputs
      window.addEventListener('mousemove', @mouseMovement, false)
      window.addEventListener('click', @mouseClick, false)
      window.addEventListener('resize', @resize, false)

    setRadius: (@radius) ->
      for ring in @rings
        ring.setRadius(@radius)

    draw: ->
      for ring in @rings
        ring.draw()

      c = @world.context
      c.fillStyle = "rgb(" + @red + ", " + @green + ", " + @blue + ")"
      c.beginPath()
      c.arc(@x, @y, @radius, 0, 2 * Math.PI, true)
      c.fill()

    updatePosition: (x, y) ->
      @x = x
      @y = y
      for ring in @rings
        ring.x = x
        ring.y = y

    update: ->
      #fade main circle
      if @green < 150 then @fade = 1
      if @green > 255 then @fade = -1
      @green += 5 * @fade
      for ring in @rings
        ring.update()

    mouseMovement: (evt) =>
      @updatePosition(evt.clientX, evt.clientY);


    mouseClick: (evt) =>
      if @radius > @world.height * 0.2
        @radius = @world.height * 0.05
      @setRadius(@radius * 1.25)


  class Leaf
    constructor: (@world) ->
      @angle = Math.PI * 3/2
      @color = "rgb(0,255,0)"

    draw: (x, y) ->
      length = @world.height * 0.04
      xbezoffset = length / 4
      ybezoffset = length / 2

      c = @world.context
      c.save()
      c.translate(x, y)
      c.rotate(@angle)
      c.fillStyle = @color
      c.beginPath()
      c.moveTo(0,0)
      c.bezierCurveTo(xbezoffset,ybezoffset,xbezoffset,ybezoffset,length,0)
      c.bezierCurveTo(xbezoffset,-ybezoffset,xbezoffset,-ybezoffset,0,0)
      c.lineTo(0,0)
      c.fill()
      c.restore()


  class Branch
    constructor: (@world, @level) ->
      @targetLength = 0.5  #percentage of screen height

      @branchAngle = ((Math.PI * 2) / 360) * 7  #angle of the triangle for drawing the branch
      @branches = new Array()
      @leaf = new Leaf(@world)
      @maxLevel = 3
      @maxChildren = 4
      @health = 0.5 #0 is dead, 1 is full heath
      @color = "rgb(200,75,50)"

      #Where along this branch we can spawn children. 0 is base, 1 is tip
      @minChildBranch = 0.30
      @maxChildBranch = 0.65

      #Min/Max angle the child spawns away from the parent
      @minChildAngle = Math.PI * 2 / 360 * 25
      @maxChildAngle = Math.PI * 2 / 360 * 45

      #alternate what side of the branch children spawn on
      @side = 1

      #growth rate is how many seconds it takes to get halfway to the targetLength
      @growthRate = 0.5
      @growthRatePerTick = 2 * @growthRate * @world.ticks

      @setLength(0)
      @percentLength = 0 #Length compared to world height

      @setAngle(Math.PI * 3/2)  #default to straight up
      window.addEventListener('resize', @eventResize, false)

    eventResize: (evt) =>
      @setLength(@percentLength)

    setLength: (@percentLength) ->
      @length = @world.height * @percentLength
      @yoffset = Math.tan(@branchAngle / 2) * @length

    setAngle: (@angle) ->
      @leaf.angle = @angle

    draw: (x, y) ->
      c = @world.context
      c.save()
      c.translate(x, y)
      c.rotate(@angle)
      c.fillStyle = @color
      c.beginPath()
      c.moveTo(0,@yoffset)
      c.lineTo(@length, 0)
      c.lineTo(0,@yoffset * -1)
      c.fill()
      c.restore()

      for branch in @branches
         newx = x + Math.cos(@angle) * @length * branch[0]
         newy = y + Math.sin(@angle) * @length * branch[0]
         branch[1].draw(newx, newy)

      @leaf.draw(x + Math.cos(@angle) * @length, y + Math.sin(@angle) * @length)

    update: ->

      if (@percentLength / @targetLength > 0.97)
        return

      @setLength(@percentLength + (@targetLength - @percentLength) / @growthRatePerTick)

      for branch in @branches
        branch[1].update() #TODO: why 1?

      #space out the children so that we spawn them evenly on the way to our target length
      #the 0.5 below is because if it were 0, new child branchs would immediately spawn
      #if it were 1, the final branch would never spawn because were never truely achieving our targetlength.
      #we just get fractionally closer and closer
      if (@targetLength / @maxChildren * @branches.length < @percentLength && @level < @maxLevel)
        branch = @minChildBranch + Math.random() * (@maxChildBranch - @minChildBranch)
        b = new Branch(@world, @level + 1)
        b.targetLength = @targetLength / (1.75 + (@branches.length / 2))
        b.setAngle(@angle + (@side *= -1) * (@minChildAngle + Math.random() * (@maxChildAngle - @minChildAngle)))
        @branches.push([branch,b])


  class Tree
    constructor: (@world) ->
      @eventResize()
      @mouseClick()

      window.addEventListener('click', @mouseClick, false)
      window.addEventListener('resize', @eventResize, false)

    draw: ->
      @trunk.draw(@x, @y)

    update: ->
      @trunk.update()

    mouseClick: =>
      @trunk = new Branch(@world, 0)
      @trunk.targetLength = 0.6

    eventResize: =>
      @x = document.body.clientWidth / 2
      @y = document.body.clientHeight


  class SunWorld extends World.World
    constructor: ->
      super
      @displayFPS = true
      @objects.push(new Sun(this))
      @objects.push(new Tree(this))
      @color = "rgb(10,50,100)"

  module =
    SunWorld: SunWorld
    Sun: Sun
    Tree: Tree

  return module
