(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @namespace PIXI.cocoonText
 */
module.exports = PIXI.cocoontext = {
    CocoonText:    require('./CocoonText'),
    CONST:    require('./CocoonTextUtil')
};

},{"./CocoonText":3,"./CocoonTextUtil":2}],2:[function(require,module,exports){
module.exports = {
    /**
     * @property {number} TEXT_RESOLUTION - Default resolution of a new CocoonText
     * @constant
     * @static
     */
    TEXT_RESOLUTION:1
};

},{}],3:[function(require,module,exports){
var CONST = require('../CocoonTextUtil');

/**
 * A CocoonText Object will create a line or multiple lines of text. To split a line you can use '\n' in your text string,
 * or add a wordWrap property set to true and and wordWrapWidth property with a value in the style object.
 *
 * Once a CocoonText is generated, it is stored as a BaseTexture and will be used if a new Text is
 * created with the exact same parameters.
 *
 * A CocoonText can be created directly from a string and a style object
 *
 * ```js
 * var text = new PIXI.extras.CocoonText('This is a CocoonText',{font : '24px Arial', fill : 0xff1010, align : 'center'});
 * ```
 *
 * @class
 * @extends Sprite
 * @memberof PIXI.extras
 * @param text {string} The copy that you would like the text to display
 * @param [style] {object} The style parameters
 * @param [style.font] {string} default 'bold 20px Arial' The style and size of the font
 * @param [style.fill='black'] {String|Number} A canvas fillstyle that will be used on the text e.g 'red', '#00FF00'
 * @param [style.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
 * @param [style.stroke] {String|Number} A canvas fillstyle that will be used on the text stroke e.g 'blue', '#FCFF00'
 * @param [style.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
 * @param [style.wordWrap=false] {boolean} Indicates if word wrap should be used
 * @param [style.wordWrapWidth=100] {number} The width at which text will wrap, it needs wordWrap to be set to true
 * @param [style.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
 * @param [style.dropShadow=false] {boolean} Set a drop shadow for the text
 * @param [style.dropShadowColor='#000000'] {string} A fill style to be used on the dropshadow e.g 'red', '#00FF00'
 * @param [style.dropShadowAngle=Math.PI/4] {number} Set a angle of the drop shadow
 * @param [style.dropShadowDistance=5] {number} Set a distance of the drop shadow
 * @param [style.padding=0] {number} Occasionally some fonts are cropped. Adding some padding will prevent this from happening
 * @param [style.textBaseline='alphabetic'] {string} The baseline of the text that is rendered.
 * @param [style.lineJoin='miter'] {string} The lineJoin property sets the type of corner created, it can resolve
 *      spiked text issues. Default is 'miter' (creates a sharp corner).
 * @param [style.miterLimit=10] {number} The miter limit to use when using the 'miter' lineJoin mode. This can reduce
 *      or increase the spikiness of rendered text.
 */
function CocoonText(text, style, resolution)
{
    /**
     * The canvas element that everything is drawn to
     *
     * @member {HTMLCanvasElement}
     */
    this.canvas = null;

    /**
     * The canvas 2d context that everything is drawn with
     * @member {HTMLCanvasElement}
     */
    this.context = null;

    /**
     * The resolution of the canvas.
     * @member {number}
     */
    this.resolution = resolution || CONST.TEXT_RESOLUTION || PIXI.RESOLUTION;

    /**
     * Private tracker for the current text.
     *
     * @member {string}
     * @private
     */
    this._text = null;

    /**
     * Private tracker for the current style.
     *
     * @member {object}
     * @private
     */
    this._style = null;

    /**
     * Private tracker for the generated style.
     *
     * @member {object}
     * @private
     */
    this._generatedStyle = null;

    this._pixiId = text+JSON.stringify(style)+this.resolution;

    var baseTexture = PIXI.utils.BaseTextureCache[this._pixiId];
    if (!baseTexture)
    {
        this.canvas = document.createElement('canvas');
        this.canvas._pixiId = this._pixiId;
        this.cacheDirty = true;
    }
    else
    {
        this.canvas = baseTexture.source;
        this.cacheDirty = false;
    }

    this.context = this.canvas.getContext('2d');

    var texture = PIXI.Texture.fromCanvas(this.canvas);
    texture.trim = new PIXI.math.Rectangle();
    PIXI.Sprite.call(this, texture);

    this.text = text;
    this.style = style;

    this.switchNeeded = false;
}

// constructor
CocoonText.prototype = Object.create(PIXI.Sprite.prototype);
CocoonText.prototype.constructor = CocoonText;
module.exports = CocoonText;

Object.defineProperties(CocoonText.prototype, {
    /**
     * The width of the CocoonText, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof CocoonText#
     */
    width: {
        get: function ()
        {
            if (this.dirty)
            {
                this.updateText();
            }

            return this.scale.x * this._texture._frame.width;
        },
        set: function (value)
        {
            this.scale.x = value / this._texture._frame.width;
            this._width = value;
        }
    },

    /**
     * The height of the CocoonText, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof CocoonText#
     */
    height: {
        get: function ()
        {
            if (this.dirty)
            {
                this.updateText();
            }

            return  this.scale.y * this._texture._frame.height;
        },
        set: function (value)
        {
            this.scale.y = value / this._texture._frame.height;
            this._height = value;
        }
    },

    /**
     * Set the style of the text
     *
     * @param [value] {object} The style parameters
     * @param [value.font='bold 20pt Arial'] {string} The style and size of the font
     * @param [value.fill='black'] {object} A canvas fillstyle that will be used on the text eg 'red', '#00FF00'
     * @param [value.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
     * @param [value.stroke='black'] {string} A canvas fillstyle that will be used on the text stroke eg 'blue', '#FCFF00'
     * @param [value.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
     * @param [value.wordWrap=false] {boolean} Indicates if word wrap should be used
     * @param [value.wordWrapWidth=100] {number} The width at which text will wrap
     * @param [value.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
     * @param [value.dropShadow=false] {boolean} Set a drop shadow for the text
     * @param [value.dropShadowColor='#000000'] {string} A fill style to be used on the dropshadow e.g 'red', '#00FF00'
     * @param [value.dropShadowAngle=Math.PI/6] {number} Set a angle of the drop shadow
     * @param [value.dropShadowDistance=5] {number} Set a distance of the drop shadow
     * @param [value.padding=0] {number} Occasionally some fonts are cropped. Adding some padding will prevent this from happening
     * @param [value.textBaseline='alphabetic'] {string} The baseline of the text that is rendered.
     * @param [value.lineJoin='miter'] {string} The lineJoin property sets the type of corner created, it can resolve
     *      spiked text issues. Default is 'miter' (creates a sharp corner).
     * @param [value.miterLimit=10] {number} The miter limit to use when using the 'miter' lineJoin mode. This can reduce
     *      or increase the spikiness of rendered text.
     * @memberof CocoonText#
     */
    style: {
        get: function ()
        {
            return this._style;
        },
        set: function (value)
        {
            var style = {};
            style.font = value.font || 'bold 20px Arial';
            style.fill = value.fill || 'black';
            style.align = value.align || 'left';
            style.stroke = value.stroke || 'black'; //provide a default, see: https://github.com/GoodBoyDigital/pixi.js/issues/136
            style.strokeThickness = value.strokeThickness || 0;
            style.wordWrap = value.wordWrap || false;
            style.wordWrapWidth = value.wordWrapWidth || 100;

            style.dropShadow = value.dropShadow || false;
            style.dropShadowColor = value.dropShadowColor || '#000000';
            style.dropShadowAngle = value.dropShadowAngle || Math.PI / 6;
            style.dropShadowDistance = value.dropShadowDistance || 5;

            style.padding = value.padding || 0;

            style.textBaseline = value.textBaseline || 'alphabetic';

            style.lineJoin = value.lineJoin || 'miter';
            style.miterLimit = value.miterLimit || 10;

            //multiply the font style by the resolution
            //TODO : warn if font size not in px unit
            this._generatedStyle = {
                font : style.font.replace(/[0-9]+/,Math.round(parseInt(style.font.match(/[0-9]+/)[0],10)*this.resolution)),
                fill : style.fill,
                align : style.align,
                stroke : style.stroke,
                strokeThickness : Math.round(style.strokeThickness*this.resolution),
                wordWrap : style.wordWrap,
                wordWrapWidth : Math.round(style.wordWrapWidth*this.resolution),
                dropShadow : style.dropShadow,
                dropShadowColor : style.dropShadowColor,
                dropShadowAngle : style.dropShadowAngle,
                dropShadowDistance : Math.round(style.dropShadowDistance*this.resolution),
                padding : Math.round(style.padding*this.resolution),
                textBaseline : style.textBaseline,
                lineJoin : style.lineJoin,
                miterLimit : style.miterLimit
            };

            if (this._style !== null)
            {
                this.prepareUpdateText(this._text,value);
            }

            this._style = style;
            this.dirty = true;
        }
    },

    /**
     * Set the copy for the text object. To split a line you can use '\n'.
     *
     * @param text {string} The copy that you would like the text to display
     * @memberof CocoonText#
     */
    text: {
        get: function()
        {
            return this._text;
        },
        set: function (text){
            text = text.toString() || ' ';
            if (this._text === text)
            {
                return;
            }
            if (this._text !== null)
            {
                this.prepareUpdateText(text,this._style);
            }
            this._text = text;
            this.dirty = true;
        }
    }
});

/**
 * Prepare the canvas for an update and try to get a cached text first.
 *
 * @private
 */
CocoonText.prototype.prepareUpdateText = function (text,style)
{
    this._pixiId = text+JSON.stringify(style)+this.resolution;
    this.switchNeeded = true;
};

/**
 * Prepare the canvas for an update and try to get a cached text first.
 *
 * @private
 */
CocoonText.prototype.switchCanvas = function ()
{
    var baseTexture = PIXI.utils.BaseTextureCache[this._pixiId];
    if (baseTexture)
    {
        //there is a cached text for these parameters
        this.canvas = baseTexture.source;
        this.context = this.canvas.getContext('2d');

        this.cacheDirty = false;
    }
    else
    {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas._pixiId = this._pixiId;

        this.cacheDirty = true;
    }
    var texture = PIXI.Texture.fromCanvas(this.canvas);
    texture.trim = new PIXI.math.Rectangle();
    this.texture = texture;
    this._texture = texture;
    this.switchNeeded = false;
};

/**
 * Renders text and updates it when needed
 *
 * @private
 */
CocoonText.prototype.updateText = function ()
{
    if (this.switchNeeded)
    {
        this.switchCanvas();
    }
    if (this.cacheDirty)
    {
        var style = this._generatedStyle;
        this.context.font = style.font;

        // word wrap
        // preserve original text
        var outputText = style.wordWrap ? this.wordWrap(this._text) : this._text;

        // split text into lines
        var lines = outputText.split(/(?:\r\n|\r|\n)/);

        // calculate text width
        var lineWidths = new Array(lines.length);
        var maxLineWidth = 0;
        var fontProperties = this.determineFontProperties(style.font);
        for (var i = 0; i < lines.length; i++)
        {
            var lineWidth = this.context.measureText(lines[i]).width;
            lineWidths[i] = lineWidth;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }

        var width = maxLineWidth + style.strokeThickness;
        if (style.dropShadow)
        {
            width += style.dropShadowDistance;
        }

        this.canvas.width = ( width + this.context.lineWidth );

        // calculate text height
        var lineHeight = this.style.lineHeight || fontProperties.fontSize + style.strokeThickness;

        var height = lineHeight * lines.length;
        if (style.dropShadow)
        {
            height += style.dropShadowDistance;
        }

        this.canvas.height = ( height + this._style.padding * 2 );

        if (navigator.isCocoonJS)
        {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.context.font = style.font;
        this.context.strokeStyle = style.stroke;
        this.context.lineWidth = style.strokeThickness;
        this.context.textBaseline = style.textBaseline;
        this.context.lineJoin = style.lineJoin;
        this.context.miterLimit = style.miterLimit;

        var linePositionX;
        var linePositionY;

        if (style.dropShadow)
        {
            this.context.fillStyle = style.dropShadowColor;

            var xShadowOffset = Math.cos(style.dropShadowAngle) * style.dropShadowDistance;
            var yShadowOffset = Math.sin(style.dropShadowAngle) * style.dropShadowDistance;

            for (i = 0; i < lines.length; i++)
            {
                linePositionX = style.strokeThickness / 2;
                linePositionY = (style.strokeThickness / 2 + i * lineHeight) + fontProperties.ascent;

                if (style.align === 'right')
                {
                    linePositionX += maxLineWidth - lineWidths[i];
                }
                else if (style.align === 'center')
                {
                    linePositionX += (maxLineWidth - lineWidths[i]) / 2;
                }

                if (style.fill)
                {
                    this.context.fillText(lines[i], linePositionX + xShadowOffset, linePositionY + yShadowOffset + this._style.padding);
                }
            }
        }

        //set canvas text styles
        this.context.fillStyle = style.fill;

        //draw lines line by line
        for (i = 0; i < lines.length; i++)
        {
            linePositionX = style.strokeThickness / 2;
            linePositionY = (style.strokeThickness / 2 + i * lineHeight) + fontProperties.ascent;

            if (style.align === 'right')
            {
                linePositionX += maxLineWidth - lineWidths[i];
            }
            else if (style.align === 'center')
            {
                linePositionX += (maxLineWidth - lineWidths[i]) / 2;
            }

            if (style.stroke && style.strokeThickness)
            {
                this.context.strokeText(lines[i], linePositionX, linePositionY + this._style.padding);
            }

            if (style.fill)
            {
                this.context.fillText(lines[i], linePositionX, linePositionY + this._style.padding);
            }
        }
    }

    this.updateTexture();
};

/**
 * Updates texture size based on canvas size
 *
 * @private
 */
CocoonText.prototype.updateTexture = function ()
{
    var texture = this._texture;

    if (this.cacheDirty)
    {
        texture.baseTexture.hasLoaded = true;
        texture.baseTexture.resolution = this.resolution;

        texture.baseTexture.width = this.canvas.width / this.resolution;
        texture.baseTexture.height = this.canvas.height / this.resolution;
    }

    texture.crop.width = texture._frame.width = this.canvas.width / this.resolution;
    texture.crop.height = texture._frame.height = this.canvas.height / this.resolution;

    texture.trim.x = 0;
    texture.trim.y = -this._style.padding;

    texture.trim.width = texture._frame.width;
    texture.trim.height = texture._frame.height - this._style.padding*2;

    this._width = this.canvas.width / this.resolution;
    this._height = this.canvas.height / this.resolution;

    this.scale.x = 1;
    this.scale.y = 1;

    if (this.cacheDirty)
    {
        texture.baseTexture.emit('update',  texture.baseTexture);
    }

    this.dirty = false;
    this.cacheDirty = false;
};

/**
 * Calculates the ascent, descent and fontSize of a given fontStyle
 *
 * @param fontStyle {object}
 * @private
 */
CocoonText.prototype.determineFontProperties = function (fontStyle)
{
    var properties = PIXI.Text.fontPropertiesCache[fontStyle];

    if (!properties)
    {
        properties = {};

        var canvas = PIXI.Text.fontPropertiesCanvas;
        var context = PIXI.Text.fontPropertiesContext;

        context.font = fontStyle;

        var width = Math.ceil(context.measureText('|MÉq').width);
        var baseline = Math.ceil(context.measureText('M').width);
        var height = 2 * baseline;


        // baseline factor depends a lot of the font. todo : let user specify a factor per font name ?
        baseline = baseline * 1.2 | 0;

        canvas.width = width;
        canvas.height = height;

        context.fillStyle = '#f00';
        context.fillRect(0, 0, width, height);

        context.font = fontStyle;

        context.textBaseline = 'alphabetic';
        context.fillStyle = '#000';
        context.fillText('|MÉq', 0, baseline);

        var imagedata = context.getImageData(0, 0, width, height).data;
        var pixels = imagedata.length;
        var line = width * 4;

        var i, j;

        var idx = 0;
        var stop = false;

        // ascent. scan from top to bottom until we find a non red pixel
        for (i = 0; i < baseline; i++)
        {
            for (j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx += line;
            }
            else
            {
                break;
            }
        }

        properties.ascent = baseline - i;

        idx = pixels - line;
        stop = false;

        // descent. scan from bottom to top until we find a non red pixel
        for (i = height; i > baseline; i--)
        {
            for (j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx -= line;
            }
            else
            {
                break;
            }
        }

        properties.descent = i - baseline;
        properties.fontSize = properties.ascent + properties.descent;

        PIXI.Text.fontPropertiesCache[fontStyle] = properties;
    }

    return properties;
};

/**
 * Applies newlines to a string to have it optimally fit into the horizontal
 * bounds set by the Text object's wordWrapWidth property.
 *
 * @param text {string}
 * @private
 */
CocoonText.prototype.wordWrap = function (text)
{
    // Greedy wrapping algorithm that will wrap words as the line grows longer
    // than its horizontal bounds.
    var result = '';
    var lines = text.split('\n');
    var wordWrapWidth = this._generatedStyle.wordWrapWidth;
    for (var i = 0; i < lines.length; i++)
    {
        var spaceLeft = wordWrapWidth;
        var words = lines[i].split(' ');
        for (var j = 0; j < words.length; j++)
        {
            var wordWidth = this.context.measureText(words[j]).width;
            var wordWidthWithSpace = wordWidth + this.context.measureText(' ').width;
            if (j === 0 || wordWidthWithSpace > spaceLeft)
            {
                // Skip printing the newline if it's the first word of the line that is
                // greater than the word wrap width.
                if (j > 0)
                {
                    result += '\n';
                }
                result += words[j];
                spaceLeft = wordWrapWidth - wordWidth;
            }
            else
            {
                spaceLeft -= wordWidthWithSpace;
                result += ' ' + words[j];
            }
        }

        if (i < lines.length-1)
        {
            result += '\n';
        }
    }
    return result;
};

/**
 * Renders the object using the WebGL renderer
 *
 * @param renderer {WebGLRenderer}
 */
CocoonText.prototype.renderWebGL = function (renderer)
{
    if (this.dirty)
    {
        this.updateText();
    }

    PIXI.Sprite.prototype.renderWebGL.call(this, renderer);
};

/**
 * Renders the object using the Canvas renderer
 *
 * @param renderer {CanvasRenderer}
 * @private
 */
CocoonText.prototype._renderCanvas = function (renderer)
{
    if (this.dirty)
    {
        this.updateText();
    }

    PIXI.Sprite.prototype._renderCanvas.call(this, renderer);
};

/**
 * Returns the bounds of the Text as a rectangle. The bounds calculation takes the worldTransform into account.
 *
 * @param matrix {Matrix} the transformation matrix of the Text
 * @return {Rectangle} the framing rectangle
 */
CocoonText.prototype.getBounds = function (matrix)
{
    if (this.dirty)
    {
        this.updateText();
    }

    return PIXI.Sprite.prototype.getBounds.call(this, matrix);
};

/**
 * Destroys this text object.
 *
 * @param [destroyBaseTexture=true] {boolean} whether to destroy the base texture as well
 */
CocoonText.prototype.destroy = function (destroyBaseTexture)
{
    // make sure to reset the the context and canvas.. dont want this hanging around in memory!
    this.context = null;
    this.canvas = null;

    this._style = null;

    this._texture.destroy(destroyBaseTexture === undefined ? true : destroyBaseTexture);
};

},{"../CocoonTextUtil":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dFV0aWwvaW5kZXguanMiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAbmFtZXNwYWNlIFBJWEkuY29jb29uVGV4dFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFBJWEkuY29jb29udGV4dCA9IHtcbiAgICBDb2Nvb25UZXh0OiAgICByZXF1aXJlKCcuL0NvY29vblRleHQnKSxcbiAgICBDT05TVDogICAgcmVxdWlyZSgnLi9Db2Nvb25UZXh0VXRpbCcpXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IFRFWFRfUkVTT0xVVElPTiAtIERlZmF1bHQgcmVzb2x1dGlvbiBvZiBhIG5ldyBDb2Nvb25UZXh0XG4gICAgICogQGNvbnN0YW50XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIFRFWFRfUkVTT0xVVElPTjoxXG59O1xuIiwidmFyIENPTlNUID0gcmVxdWlyZSgnLi4vQ29jb29uVGV4dFV0aWwnKTtcblxuLyoqXG4gKiBBIENvY29vblRleHQgT2JqZWN0IHdpbGwgY3JlYXRlIGEgbGluZSBvciBtdWx0aXBsZSBsaW5lcyBvZiB0ZXh0LiBUbyBzcGxpdCBhIGxpbmUgeW91IGNhbiB1c2UgJ1xcbicgaW4geW91ciB0ZXh0IHN0cmluZyxcbiAqIG9yIGFkZCBhIHdvcmRXcmFwIHByb3BlcnR5IHNldCB0byB0cnVlIGFuZCBhbmQgd29yZFdyYXBXaWR0aCBwcm9wZXJ0eSB3aXRoIGEgdmFsdWUgaW4gdGhlIHN0eWxlIG9iamVjdC5cbiAqXG4gKiBPbmNlIGEgQ29jb29uVGV4dCBpcyBnZW5lcmF0ZWQsIGl0IGlzIHN0b3JlZCBhcyBhIEJhc2VUZXh0dXJlIGFuZCB3aWxsIGJlIHVzZWQgaWYgYSBuZXcgVGV4dCBpc1xuICogY3JlYXRlZCB3aXRoIHRoZSBleGFjdCBzYW1lIHBhcmFtZXRlcnMuXG4gKlxuICogQSBDb2Nvb25UZXh0IGNhbiBiZSBjcmVhdGVkIGRpcmVjdGx5IGZyb20gYSBzdHJpbmcgYW5kIGEgc3R5bGUgb2JqZWN0XG4gKlxuICogYGBganNcbiAqIHZhciB0ZXh0ID0gbmV3IFBJWEkuZXh0cmFzLkNvY29vblRleHQoJ1RoaXMgaXMgYSBDb2Nvb25UZXh0Jyx7Zm9udCA6ICcyNHB4IEFyaWFsJywgZmlsbCA6IDB4ZmYxMDEwLCBhbGlnbiA6ICdjZW50ZXInfSk7XG4gKiBgYGBcbiAqXG4gKiBAY2xhc3NcbiAqIEBleHRlbmRzIFNwcml0ZVxuICogQG1lbWJlcm9mIFBJWEkuZXh0cmFzXG4gKiBAcGFyYW0gdGV4dCB7c3RyaW5nfSBUaGUgY29weSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAqIEBwYXJhbSBbc3R5bGVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gW3N0eWxlLmZvbnRdIHtzdHJpbmd9IGRlZmF1bHQgJ2JvbGQgMjBweCBBcmlhbCcgVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gKiBAcGFyYW0gW3N0eWxlLmZpbGw9J2JsYWNrJ10ge1N0cmluZ3xOdW1iZXJ9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBlLmcgJ3JlZCcsICcjMDBGRjAwJ1xuICogQHBhcmFtIFtzdHlsZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLnN0cm9rZV0ge1N0cmluZ3xOdW1iZXJ9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBzdHJva2UgZS5nICdibHVlJywgJyNGQ0ZGMDAnXG4gKiBAcGFyYW0gW3N0eWxlLnN0cm9rZVRoaWNrbmVzcz0wXSB7bnVtYmVyfSBBIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHRoaWNrbmVzcyBvZiB0aGUgc3Ryb2tlLiBEZWZhdWx0IGlzIDAgKG5vIHN0cm9rZSlcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXA9ZmFsc2VdIHtib29sZWFufSBJbmRpY2F0ZXMgaWYgd29yZCB3cmFwIHNob3VsZCBiZSB1c2VkXG4gKiBAcGFyYW0gW3N0eWxlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXAsIGl0IG5lZWRzIHdvcmRXcmFwIHRvIGJlIHNldCB0byB0cnVlXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvdz1mYWxzZV0ge2Jvb2xlYW59IFNldCBhIGRyb3Agc2hhZG93IGZvciB0aGUgdGV4dFxuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93Q29sb3I9JyMwMDAwMDAnXSB7c3RyaW5nfSBBIGZpbGwgc3R5bGUgdG8gYmUgdXNlZCBvbiB0aGUgZHJvcHNoYWRvdyBlLmcgJ3JlZCcsICcjMDBGRjAwJ1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93QW5nbGU9TWF0aC5QSS80XSB7bnVtYmVyfSBTZXQgYSBhbmdsZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAqIEBwYXJhbSBbc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlPTVdIHtudW1iZXJ9IFNldCBhIGRpc3RhbmNlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5wYWRkaW5nPTBdIHtudW1iZXJ9IE9jY2FzaW9uYWxseSBzb21lIGZvbnRzIGFyZSBjcm9wcGVkLiBBZGRpbmcgc29tZSBwYWRkaW5nIHdpbGwgcHJldmVudCB0aGlzIGZyb20gaGFwcGVuaW5nXG4gKiBAcGFyYW0gW3N0eWxlLnRleHRCYXNlbGluZT0nYWxwaGFiZXRpYyddIHtzdHJpbmd9IFRoZSBiYXNlbGluZSBvZiB0aGUgdGV4dCB0aGF0IGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIFtzdHlsZS5saW5lSm9pbj0nbWl0ZXInXSB7c3RyaW5nfSBUaGUgbGluZUpvaW4gcHJvcGVydHkgc2V0cyB0aGUgdHlwZSBvZiBjb3JuZXIgY3JlYXRlZCwgaXQgY2FuIHJlc29sdmVcbiAqICAgICAgc3Bpa2VkIHRleHQgaXNzdWVzLiBEZWZhdWx0IGlzICdtaXRlcicgKGNyZWF0ZXMgYSBzaGFycCBjb3JuZXIpLlxuICogQHBhcmFtIFtzdHlsZS5taXRlckxpbWl0PTEwXSB7bnVtYmVyfSBUaGUgbWl0ZXIgbGltaXQgdG8gdXNlIHdoZW4gdXNpbmcgdGhlICdtaXRlcicgbGluZUpvaW4gbW9kZS4gVGhpcyBjYW4gcmVkdWNlXG4gKiAgICAgIG9yIGluY3JlYXNlIHRoZSBzcGlraW5lc3Mgb2YgcmVuZGVyZWQgdGV4dC5cbiAqL1xuZnVuY3Rpb24gQ29jb29uVGV4dCh0ZXh0LCBzdHlsZSwgcmVzb2x1dGlvbilcbntcbiAgICAvKipcbiAgICAgKiBUaGUgY2FudmFzIGVsZW1lbnQgdGhhdCBldmVyeXRoaW5nIGlzIGRyYXduIHRvXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2FudmFzIDJkIGNvbnRleHQgdGhhdCBldmVyeXRoaW5nIGlzIGRyYXduIHdpdGhcbiAgICAgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHJlc29sdXRpb24gb2YgdGhlIGNhbnZhcy5cbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5yZXNvbHV0aW9uID0gcmVzb2x1dGlvbiB8fCBDT05TVC5URVhUX1JFU09MVVRJT04gfHwgUElYSS5SRVNPTFVUSU9OO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgY3VycmVudCB0ZXh0LlxuICAgICAqXG4gICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fdGV4dCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBjdXJyZW50IHN0eWxlLlxuICAgICAqXG4gICAgICogQG1lbWJlciB7b2JqZWN0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fc3R5bGUgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSB0cmFja2VyIGZvciB0aGUgZ2VuZXJhdGVkIHN0eWxlLlxuICAgICAqXG4gICAgICogQG1lbWJlciB7b2JqZWN0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fZ2VuZXJhdGVkU3R5bGUgPSBudWxsO1xuXG4gICAgdGhpcy5fcGl4aUlkID0gdGV4dCtKU09OLnN0cmluZ2lmeShzdHlsZSkrdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgaWYgKCFiYXNlVGV4dHVyZSlcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuY2FudmFzLl9waXhpSWQgPSB0aGlzLl9waXhpSWQ7XG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdmFyIHRleHR1cmUgPSBQSVhJLlRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLmNhbnZhcyk7XG4gICAgdGV4dHVyZS50cmltID0gbmV3IFBJWEkubWF0aC5SZWN0YW5nbGUoKTtcbiAgICBQSVhJLlNwcml0ZS5jYWxsKHRoaXMsIHRleHR1cmUpO1xuXG4gICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICB0aGlzLnN0eWxlID0gc3R5bGU7XG5cbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufVxuXG4vLyBjb25zdHJ1Y3RvclxuQ29jb29uVGV4dC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuU3ByaXRlLnByb3RvdHlwZSk7XG5Db2Nvb25UZXh0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvY29vblRleHQ7XG5tb2R1bGUuZXhwb3J0cyA9IENvY29vblRleHQ7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKENvY29vblRleHQucHJvdG90eXBlLCB7XG4gICAgLyoqXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBDb2Nvb25UZXh0LCBzZXR0aW5nIHRoaXMgd2lsbCBhY3R1YWxseSBtb2RpZnkgdGhlIHNjYWxlIHRvIGFjaGlldmUgdGhlIHZhbHVlIHNldFxuICAgICAqXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHdpZHRoOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxlLnggKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueCA9IHZhbHVlIC8gdGhpcy5fdGV4dHVyZS5fZnJhbWUud2lkdGg7XG4gICAgICAgICAgICB0aGlzLl93aWR0aCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgaGVpZ2h0OiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAgdGhpcy5zY2FsZS55ICogdGhpcy5fdGV4dHVyZS5fZnJhbWUuaGVpZ2h0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS55ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9oZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHN0eWxlIG9mIHRoZSB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW3ZhbHVlXSB7b2JqZWN0fSBUaGUgc3R5bGUgcGFyYW1ldGVyc1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZm9udD0nYm9sZCAyMHB0IEFyaWFsJ10ge3N0cmluZ30gVGhlIHN0eWxlIGFuZCBzaXplIG9mIHRoZSBmb250XG4gICAgICogQHBhcmFtIFt2YWx1ZS5maWxsPSdibGFjayddIHtvYmplY3R9IEEgY2FudmFzIGZpbGxzdHlsZSB0aGF0IHdpbGwgYmUgdXNlZCBvbiB0aGUgdGV4dCBlZyAncmVkJywgJyMwMEZGMDAnXG4gICAgICogQHBhcmFtIFt2YWx1ZS5hbGlnbj0nbGVmdCddIHtzdHJpbmd9IEFsaWdubWVudCBmb3IgbXVsdGlsaW5lIHRleHQgKCdsZWZ0JywgJ2NlbnRlcicgb3IgJ3JpZ2h0JyksIGRvZXMgbm90IGFmZmVjdCBzaW5nbGUgbGluZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2U9J2JsYWNrJ10ge3N0cmluZ30gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IHN0cm9rZSBlZyAnYmx1ZScsICcjRkNGRjAwJ1xuICAgICAqIEBwYXJhbSBbdmFsdWUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICAgICAqIEBwYXJhbSBbdmFsdWUud29yZFdyYXA9ZmFsc2VdIHtib29sZWFufSBJbmRpY2F0ZXMgaWYgd29yZCB3cmFwIHNob3VsZCBiZSB1c2VkXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcFdpZHRoPTEwMF0ge251bWJlcn0gVGhlIHdpZHRoIGF0IHdoaWNoIHRleHQgd2lsbCB3cmFwXG4gICAgICogQHBhcmFtIFt2YWx1ZS5saW5lSGVpZ2h0XSB7bnVtYmVyfSBUaGUgbGluZSBoZWlnaHQsIGEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdmVydGljYWwgc3BhY2UgdGhhdCBhIGxldHRlciB1c2VzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93Q29sb3I9JyMwMDAwMDAnXSB7c3RyaW5nfSBBIGZpbGwgc3R5bGUgdG8gYmUgdXNlZCBvbiB0aGUgZHJvcHNoYWRvdyBlLmcgJ3JlZCcsICcjMDBGRjAwJ1xuICAgICAqIEBwYXJhbSBbdmFsdWUuZHJvcFNoYWRvd0FuZ2xlPU1hdGguUEkvNl0ge251bWJlcn0gU2V0IGEgYW5nbGUgb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gICAgICogQHBhcmFtIFt2YWx1ZS5wYWRkaW5nPTBdIHtudW1iZXJ9IE9jY2FzaW9uYWxseSBzb21lIGZvbnRzIGFyZSBjcm9wcGVkLiBBZGRpbmcgc29tZSBwYWRkaW5nIHdpbGwgcHJldmVudCB0aGlzIGZyb20gaGFwcGVuaW5nXG4gICAgICogQHBhcmFtIFt2YWx1ZS50ZXh0QmFzZWxpbmU9J2FscGhhYmV0aWMnXSB7c3RyaW5nfSBUaGUgYmFzZWxpbmUgb2YgdGhlIHRleHQgdGhhdCBpcyByZW5kZXJlZC5cbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICAgICAqICAgICAgc3Bpa2VkIHRleHQgaXNzdWVzLiBEZWZhdWx0IGlzICdtaXRlcicgKGNyZWF0ZXMgYSBzaGFycCBjb3JuZXIpLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubWl0ZXJMaW1pdD0xMF0ge251bWJlcn0gVGhlIG1pdGVyIGxpbWl0IHRvIHVzZSB3aGVuIHVzaW5nIHRoZSAnbWl0ZXInIGxpbmVKb2luIG1vZGUuIFRoaXMgY2FuIHJlZHVjZVxuICAgICAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHN0eWxlOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0eWxlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHN0eWxlID0ge307XG4gICAgICAgICAgICBzdHlsZS5mb250ID0gdmFsdWUuZm9udCB8fCAnYm9sZCAyMHB4IEFyaWFsJztcbiAgICAgICAgICAgIHN0eWxlLmZpbGwgPSB2YWx1ZS5maWxsIHx8ICdibGFjayc7XG4gICAgICAgICAgICBzdHlsZS5hbGlnbiA9IHZhbHVlLmFsaWduIHx8ICdsZWZ0JztcbiAgICAgICAgICAgIHN0eWxlLnN0cm9rZSA9IHZhbHVlLnN0cm9rZSB8fCAnYmxhY2snOyAvL3Byb3ZpZGUgYSBkZWZhdWx0LCBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9Hb29kQm95RGlnaXRhbC9waXhpLmpzL2lzc3Vlcy8xMzZcbiAgICAgICAgICAgIHN0eWxlLnN0cm9rZVRoaWNrbmVzcyA9IHZhbHVlLnN0cm9rZVRoaWNrbmVzcyB8fCAwO1xuICAgICAgICAgICAgc3R5bGUud29yZFdyYXAgPSB2YWx1ZS53b3JkV3JhcCB8fCBmYWxzZTtcbiAgICAgICAgICAgIHN0eWxlLndvcmRXcmFwV2lkdGggPSB2YWx1ZS53b3JkV3JhcFdpZHRoIHx8IDEwMDtcblxuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvdyA9IHZhbHVlLmRyb3BTaGFkb3cgfHwgZmFsc2U7XG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93Q29sb3IgPSB2YWx1ZS5kcm9wU2hhZG93Q29sb3IgfHwgJyMwMDAwMDAnO1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0FuZ2xlID0gdmFsdWUuZHJvcFNoYWRvd0FuZ2xlIHx8IE1hdGguUEkgLyA2O1xuICAgICAgICAgICAgc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlID0gdmFsdWUuZHJvcFNoYWRvd0Rpc3RhbmNlIHx8IDU7XG5cbiAgICAgICAgICAgIHN0eWxlLnBhZGRpbmcgPSB2YWx1ZS5wYWRkaW5nIHx8IDA7XG5cbiAgICAgICAgICAgIHN0eWxlLnRleHRCYXNlbGluZSA9IHZhbHVlLnRleHRCYXNlbGluZSB8fCAnYWxwaGFiZXRpYyc7XG5cbiAgICAgICAgICAgIHN0eWxlLmxpbmVKb2luID0gdmFsdWUubGluZUpvaW4gfHwgJ21pdGVyJztcbiAgICAgICAgICAgIHN0eWxlLm1pdGVyTGltaXQgPSB2YWx1ZS5taXRlckxpbWl0IHx8IDEwO1xuXG4gICAgICAgICAgICAvL211bHRpcGx5IHRoZSBmb250IHN0eWxlIGJ5IHRoZSByZXNvbHV0aW9uXG4gICAgICAgICAgICAvL1RPRE8gOiB3YXJuIGlmIGZvbnQgc2l6ZSBub3QgaW4gcHggdW5pdFxuICAgICAgICAgICAgdGhpcy5fZ2VuZXJhdGVkU3R5bGUgPSB7XG4gICAgICAgICAgICAgICAgZm9udCA6IHN0eWxlLmZvbnQucmVwbGFjZSgvWzAtOV0rLyxNYXRoLnJvdW5kKHBhcnNlSW50KHN0eWxlLmZvbnQubWF0Y2goL1swLTldKy8pWzBdLDEwKSp0aGlzLnJlc29sdXRpb24pKSxcbiAgICAgICAgICAgICAgICBmaWxsIDogc3R5bGUuZmlsbCxcbiAgICAgICAgICAgICAgICBhbGlnbiA6IHN0eWxlLmFsaWduLFxuICAgICAgICAgICAgICAgIHN0cm9rZSA6IHN0eWxlLnN0cm9rZSxcbiAgICAgICAgICAgICAgICBzdHJva2VUaGlja25lc3MgOiBNYXRoLnJvdW5kKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIHdvcmRXcmFwIDogc3R5bGUud29yZFdyYXAsXG4gICAgICAgICAgICAgICAgd29yZFdyYXBXaWR0aCA6IE1hdGgucm91bmQoc3R5bGUud29yZFdyYXBXaWR0aCp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3cgOiBzdHlsZS5kcm9wU2hhZG93LFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dDb2xvciA6IHN0eWxlLmRyb3BTaGFkb3dDb2xvcixcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93QW5nbGUgOiBzdHlsZS5kcm9wU2hhZG93QW5nbGUsXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0Rpc3RhbmNlIDogTWF0aC5yb3VuZChzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UqdGhpcy5yZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICBwYWRkaW5nIDogTWF0aC5yb3VuZChzdHlsZS5wYWRkaW5nKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgdGV4dEJhc2VsaW5lIDogc3R5bGUudGV4dEJhc2VsaW5lLFxuICAgICAgICAgICAgICAgIGxpbmVKb2luIDogc3R5bGUubGluZUpvaW4sXG4gICAgICAgICAgICAgICAgbWl0ZXJMaW1pdCA6IHN0eWxlLm1pdGVyTGltaXRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9zdHlsZSAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRoaXMuX3RleHQsdmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9zdHlsZSA9IHN0eWxlO1xuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBjb3B5IGZvciB0aGUgdGV4dCBvYmplY3QuIFRvIHNwbGl0IGEgbGluZSB5b3UgY2FuIHVzZSAnXFxuJy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9IFRoZSBjb3B5IHRoYXQgeW91IHdvdWxkIGxpa2UgdGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBtZW1iZXJvZiBDb2Nvb25UZXh0I1xuICAgICAqL1xuICAgIHRleHQ6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh0ZXh0KXtcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnRvU3RyaW5nKCkgfHwgJyAnO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3RleHQgPT09IHRleHQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3RleHQgIT09IG51bGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVwYXJlVXBkYXRlVGV4dCh0ZXh0LHRoaXMuX3N0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnByZXBhcmVVcGRhdGVUZXh0ID0gZnVuY3Rpb24gKHRleHQsc3R5bGUpXG57XG4gICAgdGhpcy5fcGl4aUlkID0gdGV4dCtKU09OLnN0cmluZ2lmeShzdHlsZSkrdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gdHJ1ZTtcbn07XG5cbi8qKlxuICogUHJlcGFyZSB0aGUgY2FudmFzIGZvciBhbiB1cGRhdGUgYW5kIHRyeSB0byBnZXQgYSBjYWNoZWQgdGV4dCBmaXJzdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5zd2l0Y2hDYW52YXMgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBiYXNlVGV4dHVyZSA9IFBJWEkudXRpbHMuQmFzZVRleHR1cmVDYWNoZVt0aGlzLl9waXhpSWRdO1xuICAgIGlmIChiYXNlVGV4dHVyZSlcbiAgICB7XG4gICAgICAgIC8vdGhlcmUgaXMgYSBjYWNoZWQgdGV4dCBmb3IgdGhlc2UgcGFyYW1ldGVyc1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGJhc2VUZXh0dXJlLnNvdXJjZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdGhpcy5jYW52YXMuX3BpeGlJZCA9IHRoaXMuX3BpeGlJZDtcblxuICAgICAgICB0aGlzLmNhY2hlRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICB0ZXh0dXJlLnRyaW0gPSBuZXcgUElYSS5tYXRoLlJlY3RhbmdsZSgpO1xuICAgIHRoaXMudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5fdGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0ZXh0IGFuZCB1cGRhdGVzIGl0IHdoZW4gbmVlZGVkXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dCA9IGZ1bmN0aW9uICgpXG57XG4gICAgaWYgKHRoaXMuc3dpdGNoTmVlZGVkKVxuICAgIHtcbiAgICAgICAgdGhpcy5zd2l0Y2hDYW52YXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRoaXMuX2dlbmVyYXRlZFN0eWxlO1xuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IHN0eWxlLmZvbnQ7XG5cbiAgICAgICAgLy8gd29yZCB3cmFwXG4gICAgICAgIC8vIHByZXNlcnZlIG9yaWdpbmFsIHRleHRcbiAgICAgICAgdmFyIG91dHB1dFRleHQgPSBzdHlsZS53b3JkV3JhcCA/IHRoaXMud29yZFdyYXAodGhpcy5fdGV4dCkgOiB0aGlzLl90ZXh0O1xuXG4gICAgICAgIC8vIHNwbGl0IHRleHQgaW50byBsaW5lc1xuICAgICAgICB2YXIgbGluZXMgPSBvdXRwdXRUZXh0LnNwbGl0KC8oPzpcXHJcXG58XFxyfFxcbikvKTtcblxuICAgICAgICAvLyBjYWxjdWxhdGUgdGV4dCB3aWR0aFxuICAgICAgICB2YXIgbGluZVdpZHRocyA9IG5ldyBBcnJheShsaW5lcy5sZW5ndGgpO1xuICAgICAgICB2YXIgbWF4TGluZVdpZHRoID0gMDtcbiAgICAgICAgdmFyIGZvbnRQcm9wZXJ0aWVzID0gdGhpcy5kZXRlcm1pbmVGb250UHJvcGVydGllcyhzdHlsZS5mb250KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGxpbmVXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChsaW5lc1tpXSkud2lkdGg7XG4gICAgICAgICAgICBsaW5lV2lkdGhzW2ldID0gbGluZVdpZHRoO1xuICAgICAgICAgICAgbWF4TGluZVdpZHRoID0gTWF0aC5tYXgobWF4TGluZVdpZHRoLCBsaW5lV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoID0gbWF4TGluZVdpZHRoICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgd2lkdGggKz0gc3R5bGUuZHJvcFNoYWRvd0Rpc3RhbmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAoIHdpZHRoICsgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCApO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IGhlaWdodFxuICAgICAgICB2YXIgbGluZUhlaWdodCA9IHRoaXMuc3R5bGUubGluZUhlaWdodCB8fCBmb250UHJvcGVydGllcy5mb250U2l6ZSArIHN0eWxlLnN0cm9rZVRoaWNrbmVzcztcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gbGluZUhlaWdodCAqIGxpbmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAoIGhlaWdodCArIHRoaXMuX3N0eWxlLnBhZGRpbmcgKiAyICk7XG5cbiAgICAgICAgaWYgKG5hdmlnYXRvci5pc0NvY29vbkpTKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzdHlsZS5mb250O1xuICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBzdHlsZS5zdHJva2U7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSBzdHlsZS5zdHJva2VUaGlja25lc3M7XG4gICAgICAgIHRoaXMuY29udGV4dC50ZXh0QmFzZWxpbmUgPSBzdHlsZS50ZXh0QmFzZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9IHN0eWxlLmxpbmVKb2luO1xuICAgICAgICB0aGlzLmNvbnRleHQubWl0ZXJMaW1pdCA9IHN0eWxlLm1pdGVyTGltaXQ7XG5cbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblg7XG4gICAgICAgIHZhciBsaW5lUG9zaXRpb25ZO1xuXG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gc3R5bGUuZHJvcFNoYWRvd0NvbG9yO1xuXG4gICAgICAgICAgICB2YXIgeFNoYWRvd09mZnNldCA9IE1hdGguY29zKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgICAgICB2YXIgeVNoYWRvd09mZnNldCA9IE1hdGguc2luKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMjtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25ZID0gKHN0eWxlLnN0cm9rZVRoaWNrbmVzcyAvIDIgKyBpICogbGluZUhlaWdodCkgKyBmb250UHJvcGVydGllcy5hc2NlbnQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuZmlsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCArIHhTaGFkb3dPZmZzZXQsIGxpbmVQb3NpdGlvblkgKyB5U2hhZG93T2Zmc2V0ICsgdGhpcy5fc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9zZXQgY2FudmFzIHRleHQgc3R5bGVzXG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBzdHlsZS5maWxsO1xuXG4gICAgICAgIC8vZHJhdyBsaW5lcyBsaW5lIGJ5IGxpbmVcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBsaW5lUG9zaXRpb25YID0gc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMjtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblkgPSAoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMiArIGkgKiBsaW5lSGVpZ2h0KSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuICAgICAgICAgICAgaWYgKHN0eWxlLmFsaWduID09PSAncmlnaHQnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gbWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlLmFsaWduID09PSAnY2VudGVyJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsaW5lUG9zaXRpb25YICs9IChtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldKSAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5zdHJva2UgJiYgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgdGhpcy5fc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHlsZS5maWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChsaW5lc1tpXSwgbGluZVBvc2l0aW9uWCwgbGluZVBvc2l0aW9uWSArIHRoaXMuX3N0eWxlLnBhZGRpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVUZXh0dXJlKCk7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGV4dHVyZSBzaXplIGJhc2VkIG9uIGNhbnZhcyBzaXplXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUudXBkYXRlVGV4dHVyZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIHRleHR1cmUgPSB0aGlzLl90ZXh0dXJlO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVEaXJ0eSlcbiAgICB7XG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUuaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5yZXNvbHV0aW9uID0gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgICAgIHRleHR1cmUuYmFzZVRleHR1cmUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG4gICAgfVxuXG4gICAgdGV4dHVyZS5jcm9wLndpZHRoID0gdGV4dHVyZS5fZnJhbWUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0ZXh0dXJlLmNyb3AuaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuXG4gICAgdGV4dHVyZS50cmltLnggPSAwO1xuICAgIHRleHR1cmUudHJpbS55ID0gLXRoaXMuX3N0eWxlLnBhZGRpbmc7XG5cbiAgICB0ZXh0dXJlLnRyaW0ud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICB0ZXh0dXJlLnRyaW0uaGVpZ2h0ID0gdGV4dHVyZS5fZnJhbWUuaGVpZ2h0IC0gdGhpcy5fc3R5bGUucGFkZGluZyoyO1xuXG4gICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0aGlzLnNjYWxlLnggPSAxO1xuICAgIHRoaXMuc2NhbGUueSA9IDE7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5lbWl0KCd1cGRhdGUnLCAgdGV4dHVyZS5iYXNlVGV4dHVyZSk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhc2NlbnQsIGRlc2NlbnQgYW5kIGZvbnRTaXplIG9mIGEgZ2l2ZW4gZm9udFN0eWxlXG4gKlxuICogQHBhcmFtIGZvbnRTdHlsZSB7b2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZGV0ZXJtaW5lRm9udFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoZm9udFN0eWxlKVxue1xuICAgIHZhciBwcm9wZXJ0aWVzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FjaGVbZm9udFN0eWxlXTtcblxuICAgIGlmICghcHJvcGVydGllcylcbiAgICB7XG4gICAgICAgIHByb3BlcnRpZXMgPSB7fTtcblxuICAgICAgICB2YXIgY2FudmFzID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FudmFzO1xuICAgICAgICB2YXIgY29udGV4dCA9IFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NvbnRleHQ7XG5cbiAgICAgICAgY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbChjb250ZXh0Lm1lYXN1cmVUZXh0KCd8TcOJcScpLndpZHRoKTtcbiAgICAgICAgdmFyIGJhc2VsaW5lID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ00nKS53aWR0aCk7XG4gICAgICAgIHZhciBoZWlnaHQgPSAyICogYmFzZWxpbmU7XG5cbiAgICAgICAgYmFzZWxpbmUgPSBiYXNlbGluZSAqIDEuNiB8IDA7XG5cbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnI2YwMCc7XG4gICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICAgICAgY29udGV4dC5mb250ID0gZm9udFN0eWxlO1xuXG4gICAgICAgIGNvbnRleHQudGV4dEJhc2VsaW5lID0gJ2FscGhhYmV0aWMnO1xuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjMDAwJztcbiAgICAgICAgY29udGV4dC5maWxsVGV4dCgnfE3DiXEnLCAwLCBiYXNlbGluZSk7XG5cbiAgICAgICAgdmFyIGltYWdlZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpLmRhdGE7XG4gICAgICAgIHZhciBwaXhlbHMgPSBpbWFnZWRhdGEubGVuZ3RoO1xuICAgICAgICB2YXIgbGluZSA9IHdpZHRoICogNDtcblxuICAgICAgICB2YXIgaSwgajtcblxuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIHN0b3AgPSBmYWxzZTtcblxuICAgICAgICAvLyBhc2NlbnQuIHNjYW4gZnJvbSB0b3AgdG8gYm90dG9tIHVudGlsIHdlIGZpbmQgYSBub24gcmVkIHBpeGVsXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBiYXNlbGluZTsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbGluZTsgaiArPSA0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChpbWFnZWRhdGFbaWR4ICsgal0gIT09IDI1NSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN0b3ApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWR4ICs9IGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wZXJ0aWVzLmFzY2VudCA9IGJhc2VsaW5lIC0gaTtcblxuICAgICAgICBpZHggPSBwaXhlbHMgLSBsaW5lO1xuICAgICAgICBzdG9wID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZGVzY2VudC4gc2NhbiBmcm9tIGJvdHRvbSB0byB0b3AgdW50aWwgd2UgZmluZCBhIG5vbiByZWQgcGl4ZWxcbiAgICAgICAgZm9yIChpID0gaGVpZ2h0OyBpID4gYmFzZWxpbmU7IGktLSlcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmU7IGogKz0gNClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VkYXRhW2lkeCArIGpdICE9PSAyNTUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkeCAtPSBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5kZXNjZW50ID0gaSAtIGJhc2VsaW5lO1xuICAgICAgICBwcm9wZXJ0aWVzLmZvbnRTaXplID0gcHJvcGVydGllcy5hc2NlbnQgKyBwcm9wZXJ0aWVzLmRlc2NlbnQ7XG5cbiAgICAgICAgUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ2FjaGVbZm9udFN0eWxlXSA9IHByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgbmV3bGluZXMgdG8gYSBzdHJpbmcgdG8gaGF2ZSBpdCBvcHRpbWFsbHkgZml0IGludG8gdGhlIGhvcml6b250YWxcbiAqIGJvdW5kcyBzZXQgYnkgdGhlIFRleHQgb2JqZWN0J3Mgd29yZFdyYXBXaWR0aCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gdGV4dCB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUud29yZFdyYXAgPSBmdW5jdGlvbiAodGV4dClcbntcbiAgICAvLyBHcmVlZHkgd3JhcHBpbmcgYWxnb3JpdGhtIHRoYXQgd2lsbCB3cmFwIHdvcmRzIGFzIHRoZSBsaW5lIGdyb3dzIGxvbmdlclxuICAgIC8vIHRoYW4gaXRzIGhvcml6b250YWwgYm91bmRzLlxuICAgIHZhciByZXN1bHQgPSAnJztcbiAgICB2YXIgbGluZXMgPSB0ZXh0LnNwbGl0KCdcXG4nKTtcbiAgICB2YXIgd29yZFdyYXBXaWR0aCA9IHRoaXMuX2dlbmVyYXRlZFN0eWxlLndvcmRXcmFwV2lkdGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICAgIHZhciBzcGFjZUxlZnQgPSB3b3JkV3JhcFdpZHRoO1xuICAgICAgICB2YXIgd29yZHMgPSBsaW5lc1tpXS5zcGxpdCgnICcpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHdvcmRzLmxlbmd0aDsgaisrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgd29yZFdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KHdvcmRzW2pdKS53aWR0aDtcbiAgICAgICAgICAgIHZhciB3b3JkV2lkdGhXaXRoU3BhY2UgPSB3b3JkV2lkdGggKyB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoJyAnKS53aWR0aDtcbiAgICAgICAgICAgIGlmIChqID09PSAwIHx8IHdvcmRXaWR0aFdpdGhTcGFjZSA+IHNwYWNlTGVmdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHByaW50aW5nIHRoZSBuZXdsaW5lIGlmIGl0J3MgdGhlIGZpcnN0IHdvcmQgb2YgdGhlIGxpbmUgdGhhdCBpc1xuICAgICAgICAgICAgICAgIC8vIGdyZWF0ZXIgdGhhbiB0aGUgd29yZCB3cmFwIHdpZHRoLlxuICAgICAgICAgICAgICAgIGlmIChqID4gMClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHdvcmRzW2pdO1xuICAgICAgICAgICAgICAgIHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGggLSB3b3JkV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3BhY2VMZWZ0IC09IHdvcmRXaWR0aFdpdGhTcGFjZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJyAnICsgd29yZHNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaSA8IGxpbmVzLmxlbmd0aC0xKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgb2JqZWN0IHVzaW5nIHRoZSBXZWJHTCByZW5kZXJlclxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB7V2ViR0xSZW5kZXJlcn1cbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucmVuZGVyV2ViR0wgPSBmdW5jdGlvbiAocmVuZGVyZXIpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICBQSVhJLlNwcml0ZS5wcm90b3R5cGUucmVuZGVyV2ViR0wuY2FsbCh0aGlzLCByZW5kZXJlcik7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIG9iamVjdCB1c2luZyB0aGUgQ2FudmFzIHJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHtDYW52YXNSZW5kZXJlcn1cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLl9yZW5kZXJDYW52YXMgPSBmdW5jdGlvbiAocmVuZGVyZXIpXG57XG4gICAgaWYgKHRoaXMuZGlydHkpXG4gICAge1xuICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICB9XG5cbiAgICBQSVhJLlNwcml0ZS5wcm90b3R5cGUuX3JlbmRlckNhbnZhcy5jYWxsKHRoaXMsIHJlbmRlcmVyKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYm91bmRzIG9mIHRoZSBUZXh0IGFzIGEgcmVjdGFuZ2xlLiBUaGUgYm91bmRzIGNhbGN1bGF0aW9uIHRha2VzIHRoZSB3b3JsZFRyYW5zZm9ybSBpbnRvIGFjY291bnQuXG4gKlxuICogQHBhcmFtIG1hdHJpeCB7TWF0cml4fSB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IG9mIHRoZSBUZXh0XG4gKiBAcmV0dXJuIHtSZWN0YW5nbGV9IHRoZSBmcmFtaW5nIHJlY3RhbmdsZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5nZXRCb3VuZHMgPSBmdW5jdGlvbiAobWF0cml4KVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFBJWEkuU3ByaXRlLnByb3RvdHlwZS5nZXRCb3VuZHMuY2FsbCh0aGlzLCBtYXRyaXgpO1xufTtcblxuLyoqXG4gKiBEZXN0cm95cyB0aGlzIHRleHQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBbZGVzdHJveUJhc2VUZXh0dXJlPXRydWVdIHtib29sZWFufSB3aGV0aGVyIHRvIGRlc3Ryb3kgdGhlIGJhc2UgdGV4dHVyZSBhcyB3ZWxsXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoZGVzdHJveUJhc2VUZXh0dXJlKVxue1xuICAgIC8vIG1ha2Ugc3VyZSB0byByZXNldCB0aGUgdGhlIGNvbnRleHQgYW5kIGNhbnZhcy4uIGRvbnQgd2FudCB0aGlzIGhhbmdpbmcgYXJvdW5kIGluIG1lbW9yeSFcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIHRoaXMuX3N0eWxlID0gbnVsbDtcblxuICAgIHRoaXMuX3RleHR1cmUuZGVzdHJveShkZXN0cm95QmFzZVRleHR1cmUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBkZXN0cm95QmFzZVRleHR1cmUpO1xufTtcbiJdfQ==
