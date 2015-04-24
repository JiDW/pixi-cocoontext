# PIXI-CocoonText

This is a plugin for PIXI v3.0.0 and higher. It adds a new text object optimized for mobile and specifically CocoonJS.

```javascript
var foo = new PIXI.cocoontext.CocoonText("This is a text with a cache !",{font:"12px Arial"});
```

It is a modified version of the original PIXI.Text object with the following modifications :

* *Texture cache* : when you create a PIXI.Text object, PIXI needs to use an offscreen canvas to generate your text and use this canvas as a texture. While this is the only way to do it at this moment, this is can be a huge performance bottleneck when you need to create multiple texts in your game. CocoonText provides you an automated cache system to make sure that if you create the same text with the same style a second time, you won't have to create a new canvas/texture. This allows you to preload your texts at the start of your application like you could do for an image or a sound.

* *CocoonJS compatibility* : the way PIXI.Text deals with text resolution is not compatible with CocoonJS v2.0. CocoonText is able to display high density texts for retina screens as long as you provide a font size with a px unit. You can set PIXI.cocoontext.CONST.TEXT_RESOLUTION to set a default resolution for all of your CocoonText objects. This can be useful if you want the best looking texts possible by setting it to the devicePixelRatio multiplied by the scale of your UI.

## Typical use case

Building a button with an "active" and "inactive" state that change the text style with preloaded textures

```javascript
//I set the resolution of my texts to the devicePixelRatio * the scale of my stage
PIXI.cocoontext.CONST.TEXT_RESOLUTION = window.devicePixelRatio * stage.scale.x;

// While my game is loading, I generate the texts I will need later
function preloadTexts()
{
    var myTexts = [
        new PIXI.cocoontext.CocoonText("Homepage",{font:"14px Arial",fill:"#FFFFFF"}),
        new PIXI.cocoontext.CocoonText("Homepage",{font:"14px Arial",fill:"#FF0000"})
    ];
    for(var i =0;i<myTexts.length;i++)
    {
        myTexts[i].updateText();
    }
}

...

var buttonHomepage = new PIXI.cocoontext.CocoonText("Homepage",{font:"14px Arial",fill:"#FFFFFF"});
buttonHomepage.interactive = true;
buttonHomepage.tap = function(){
    //this will get the preloaded text already generated earlier
    this.style = {font:"14px Arial",fill:"#FF0000"};
};
```
