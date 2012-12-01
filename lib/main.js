require.config({ baseUrl: "/lib"});

require(['jquery', 'cs!sun'], function($, Sun) {
  canvas = document.getElementById("experiment");
  var sw = new Sun.SunWorld(canvas);

  var input;

  input = $('input[name="display_fps"]');
  sw.displayFPS = input.prop('checked');
  input.click(function(){
    sw.displayFPS = this.checked;
  });

  input = $('input[name="color"]');
  sw.fillColor = input.prop('checked');
  input.click(function(){
    sw.fillColor = this.checked;
  });

  sw.run();
});
