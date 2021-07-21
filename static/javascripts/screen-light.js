function initScreenLight() {
  let range = document.getElementsByTagName("input")[0];
  let bg = document.getElementsByTagName("div")[0];
  let para = document.getElementsByTagName("p")[0];
  // let span = para.getElementsByTagName("span")[0];

  range.addEventListener("change", function() {
    //bg.style.setProperty('--bg-opacity', this.value);
    var dec = parseInt(255 * this.value);
    bg.style.setProperty('--bg-color', hexFromDecimal(dec));
    dec = parseInt(255 * (.25 + (.5*this.value)));
    // dec = 255 - dec;
    para.style.setProperty('--ctrl-color', hexFromDecimal(dec));
    // span.innerHTML = "range: " + this.value + ", dec: " + dec + ", hex: " + hexFromDecimal(dec);
  });
};

function hexFromDecimal(dec) {
  // works only for gray
  var hex = ((dec < 16) ? "0" : "") + dec.toString(16);
  return "#" + hex + hex + hex;
}
