require.config({ baseUrl: "/lib"});
require(['cs!sun'],
  function(Sun) {
    canvas = document.getElementById("experiment");
    var sw = new Sun.SunWorld(canvas);
    sw.run();
  }
);
