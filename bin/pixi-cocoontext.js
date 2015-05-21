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

        this.canvas.height = ( height + style.padding * 2 );

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
                    this.context.fillText(lines[i], linePositionX + xShadowOffset, linePositionY + yShadowOffset + style.padding);
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
                this.context.strokeText(lines[i], linePositionX, linePositionY + style.padding);
            }

            if (style.fill)
            {
                this.context.fillText(lines[i], linePositionX, linePositionY + style.padding);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgiLCJzcmMvQ29jb29uVGV4dFV0aWwvaW5kZXguanMiLCJzcmMvQ29jb29uVGV4dC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBuYW1lc3BhY2UgUElYSS5jb2Nvb25UZXh0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUElYSS5jb2Nvb250ZXh0ID0ge1xuICAgIENvY29vblRleHQ6ICAgIHJlcXVpcmUoJy4vQ29jb29uVGV4dCcpLFxuICAgIENPTlNUOiAgICByZXF1aXJlKCcuL0NvY29vblRleHRVdGlsJylcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gVEVYVF9SRVNPTFVUSU9OIC0gRGVmYXVsdCByZXNvbHV0aW9uIG9mIGEgbmV3IENvY29vblRleHRcbiAgICAgKiBAY29uc3RhbnRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgVEVYVF9SRVNPTFVUSU9OOjFcbn07XG4iLCJ2YXIgQ09OU1QgPSByZXF1aXJlKCcuLi9Db2Nvb25UZXh0VXRpbCcpO1xuXG4vKipcbiAqIEEgQ29jb29uVGV4dCBPYmplY3Qgd2lsbCBjcmVhdGUgYSBsaW5lIG9yIG11bHRpcGxlIGxpbmVzIG9mIHRleHQuIFRvIHNwbGl0IGEgbGluZSB5b3UgY2FuIHVzZSAnXFxuJyBpbiB5b3VyIHRleHQgc3RyaW5nLFxuICogb3IgYWRkIGEgd29yZFdyYXAgcHJvcGVydHkgc2V0IHRvIHRydWUgYW5kIGFuZCB3b3JkV3JhcFdpZHRoIHByb3BlcnR5IHdpdGggYSB2YWx1ZSBpbiB0aGUgc3R5bGUgb2JqZWN0LlxuICpcbiAqIE9uY2UgYSBDb2Nvb25UZXh0IGlzIGdlbmVyYXRlZCwgaXQgaXMgc3RvcmVkIGFzIGEgQmFzZVRleHR1cmUgYW5kIHdpbGwgYmUgdXNlZCBpZiBhIG5ldyBUZXh0IGlzXG4gKiBjcmVhdGVkIHdpdGggdGhlIGV4YWN0IHNhbWUgcGFyYW1ldGVycy5cbiAqXG4gKiBBIENvY29vblRleHQgY2FuIGJlIGNyZWF0ZWQgZGlyZWN0bHkgZnJvbSBhIHN0cmluZyBhbmQgYSBzdHlsZSBvYmplY3RcbiAqXG4gKiBgYGBqc1xuICogdmFyIHRleHQgPSBuZXcgUElYSS5leHRyYXMuQ29jb29uVGV4dCgnVGhpcyBpcyBhIENvY29vblRleHQnLHtmb250IDogJzI0cHggQXJpYWwnLCBmaWxsIDogMHhmZjEwMTAsIGFsaWduIDogJ2NlbnRlcid9KTtcbiAqIGBgYFxuICpcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgU3ByaXRlXG4gKiBAbWVtYmVyb2YgUElYSS5leHRyYXNcbiAqIEBwYXJhbSB0ZXh0IHtzdHJpbmd9IFRoZSBjb3B5IHRoYXQgeW91IHdvdWxkIGxpa2UgdGhlIHRleHQgdG8gZGlzcGxheVxuICogQHBhcmFtIFtzdHlsZV0ge29iamVjdH0gVGhlIHN0eWxlIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBbc3R5bGUuZm9udF0ge3N0cmluZ30gZGVmYXVsdCAnYm9sZCAyMHB4IEFyaWFsJyBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAqIEBwYXJhbSBbc3R5bGUuZmlsbD0nYmxhY2snXSB7U3RyaW5nfE51bWJlcn0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGUuZyAncmVkJywgJyMwMEZGMDAnXG4gKiBAcGFyYW0gW3N0eWxlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlXSB7U3RyaW5nfE51bWJlcn0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IHN0cm9rZSBlLmcgJ2JsdWUnLCAnI0ZDRkYwMCdcbiAqIEBwYXJhbSBbc3R5bGUuc3Ryb2tlVGhpY2tuZXNzPTBdIHtudW1iZXJ9IEEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2UuIERlZmF1bHQgaXMgMCAobm8gc3Ryb2tlKVxuICogQHBhcmFtIFtzdHlsZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAqIEBwYXJhbSBbc3R5bGUud29yZFdyYXBXaWR0aD0xMDBdIHtudW1iZXJ9IFRoZSB3aWR0aCBhdCB3aGljaCB0ZXh0IHdpbGwgd3JhcCwgaXQgbmVlZHMgd29yZFdyYXAgdG8gYmUgc2V0IHRvIHRydWVcbiAqIEBwYXJhbSBbc3R5bGUubGluZUhlaWdodF0ge251bWJlcn0gVGhlIGxpbmUgaGVpZ2h0LCBhIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIHZlcnRpY2FsIHNwYWNlIHRoYXQgYSBsZXR0ZXIgdXNlc1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93PWZhbHNlXSB7Ym9vbGVhbn0gU2V0IGEgZHJvcCBzaGFkb3cgZm9yIHRoZSB0ZXh0XG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtzdHJpbmd9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93IGUuZyAncmVkJywgJyMwMEZGMDAnXG4gKiBAcGFyYW0gW3N0eWxlLmRyb3BTaGFkb3dBbmdsZT1NYXRoLlBJLzRdIHtudW1iZXJ9IFNldCBhIGFuZ2xlIG9mIHRoZSBkcm9wIHNoYWRvd1xuICogQHBhcmFtIFtzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U9NV0ge251bWJlcn0gU2V0IGEgZGlzdGFuY2Ugb2YgdGhlIGRyb3Agc2hhZG93XG4gKiBAcGFyYW0gW3N0eWxlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAqIEBwYXJhbSBbc3R5bGUudGV4dEJhc2VsaW5lPSdhbHBoYWJldGljJ10ge3N0cmluZ30gVGhlIGJhc2VsaW5lIG9mIHRoZSB0ZXh0IHRoYXQgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gW3N0eWxlLmxpbmVKb2luPSdtaXRlciddIHtzdHJpbmd9IFRoZSBsaW5lSm9pbiBwcm9wZXJ0eSBzZXRzIHRoZSB0eXBlIG9mIGNvcm5lciBjcmVhdGVkLCBpdCBjYW4gcmVzb2x2ZVxuICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gKiBAcGFyYW0gW3N0eWxlLm1pdGVyTGltaXQ9MTBdIHtudW1iZXJ9IFRoZSBtaXRlciBsaW1pdCB0byB1c2Ugd2hlbiB1c2luZyB0aGUgJ21pdGVyJyBsaW5lSm9pbiBtb2RlLiBUaGlzIGNhbiByZWR1Y2VcbiAqICAgICAgb3IgaW5jcmVhc2UgdGhlIHNwaWtpbmVzcyBvZiByZW5kZXJlZCB0ZXh0LlxuICovXG5mdW5jdGlvbiBDb2Nvb25UZXh0KHRleHQsIHN0eWxlLCByZXNvbHV0aW9uKVxue1xuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgZWxlbWVudCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gdG9cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYW52YXMgMmQgY29udGV4dCB0aGF0IGV2ZXJ5dGhpbmcgaXMgZHJhd24gd2l0aFxuICAgICAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVzb2x1dGlvbiBvZiB0aGUgY2FudmFzLlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnJlc29sdXRpb24gPSByZXNvbHV0aW9uIHx8IENPTlNULlRFWFRfUkVTT0xVVElPTiB8fCBQSVhJLlJFU09MVVRJT047XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBjdXJyZW50IHRleHQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgdHJhY2tlciBmb3IgdGhlIGN1cnJlbnQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIHRyYWNrZXIgZm9yIHRoZSBnZW5lcmF0ZWQgc3R5bGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0K0pTT04uc3RyaW5naWZ5KHN0eWxlKSt0aGlzLnJlc29sdXRpb247XG5cbiAgICB2YXIgYmFzZVRleHR1cmUgPSBQSVhJLnV0aWxzLkJhc2VUZXh0dXJlQ2FjaGVbdGhpcy5fcGl4aUlkXTtcbiAgICBpZiAoIWJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jYW52YXMuX3BpeGlJZCA9IHRoaXMuX3BpeGlJZDtcbiAgICAgICAgdGhpcy5jYWNoZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBiYXNlVGV4dHVyZS5zb3VyY2U7XG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB2YXIgdGV4dHVyZSA9IFBJWEkuVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKTtcbiAgICB0ZXh0dXJlLnRyaW0gPSBuZXcgUElYSS5tYXRoLlJlY3RhbmdsZSgpO1xuICAgIFBJWEkuU3ByaXRlLmNhbGwodGhpcywgdGV4dHVyZSk7XG5cbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAgIHRoaXMuc3dpdGNoTmVlZGVkID0gZmFsc2U7XG59XG5cbi8vIGNvbnN0cnVjdG9yXG5Db2Nvb25UZXh0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUElYSS5TcHJpdGUucHJvdG90eXBlKTtcbkNvY29vblRleHQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29jb29uVGV4dDtcbm1vZHVsZS5leHBvcnRzID0gQ29jb29uVGV4dDtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoQ29jb29uVGV4dC5wcm90b3R5cGUsIHtcbiAgICAvKipcbiAgICAgKiBUaGUgd2lkdGggb2YgdGhlIENvY29vblRleHQsIHNldHRpbmcgdGhpcyB3aWxsIGFjdHVhbGx5IG1vZGlmeSB0aGUgc2NhbGUgdG8gYWNoaWV2ZSB0aGUgdmFsdWUgc2V0XG4gICAgICpcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgd2lkdGg6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUueCAqIHRoaXMuX3RleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS54ID0gdmFsdWUgLyB0aGlzLl90ZXh0dXJlLl9mcmFtZS53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuX3dpZHRoID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgQ29jb29uVGV4dCwgc2V0dGluZyB0aGlzIHdpbGwgYWN0dWFsbHkgbW9kaWZ5IHRoZSBzY2FsZSB0byBhY2hpZXZlIHRoZSB2YWx1ZSBzZXRcbiAgICAgKlxuICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgKiBAbWVtYmVyb2YgQ29jb29uVGV4dCNcbiAgICAgKi9cbiAgICBoZWlnaHQ6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICB0aGlzLnNjYWxlLnkgKiB0aGlzLl90ZXh0dXJlLl9mcmFtZS5oZWlnaHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnkgPSB2YWx1ZSAvIHRoaXMuX3RleHR1cmUuX2ZyYW1lLmhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX2hlaWdodCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc3R5bGUgb2YgdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBbdmFsdWVdIHtvYmplY3R9IFRoZSBzdHlsZSBwYXJhbWV0ZXJzXG4gICAgICogQHBhcmFtIFt2YWx1ZS5mb250PSdib2xkIDIwcHQgQXJpYWwnXSB7c3RyaW5nfSBUaGUgc3R5bGUgYW5kIHNpemUgb2YgdGhlIGZvbnRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmZpbGw9J2JsYWNrJ10ge29iamVjdH0gQSBjYW52YXMgZmlsbHN0eWxlIHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZSB0ZXh0IGVnICdyZWQnLCAnIzAwRkYwMCdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmFsaWduPSdsZWZ0J10ge3N0cmluZ30gQWxpZ25tZW50IGZvciBtdWx0aWxpbmUgdGV4dCAoJ2xlZnQnLCAnY2VudGVyJyBvciAncmlnaHQnKSwgZG9lcyBub3QgYWZmZWN0IHNpbmdsZSBsaW5lIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnN0cm9rZT0nYmxhY2snXSB7c3RyaW5nfSBBIGNhbnZhcyBmaWxsc3R5bGUgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlIHRleHQgc3Ryb2tlIGVnICdibHVlJywgJyNGQ0ZGMDAnXG4gICAgICogQHBhcmFtIFt2YWx1ZS5zdHJva2VUaGlja25lc3M9MF0ge251bWJlcn0gQSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB0aGlja25lc3Mgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdCBpcyAwIChubyBzdHJva2UpXG4gICAgICogQHBhcmFtIFt2YWx1ZS53b3JkV3JhcD1mYWxzZV0ge2Jvb2xlYW59IEluZGljYXRlcyBpZiB3b3JkIHdyYXAgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLndvcmRXcmFwV2lkdGg9MTAwXSB7bnVtYmVyfSBUaGUgd2lkdGggYXQgd2hpY2ggdGV4dCB3aWxsIHdyYXBcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmxpbmVIZWlnaHRdIHtudW1iZXJ9IFRoZSBsaW5lIGhlaWdodCwgYSBudW1iZXIgdGhhdCByZXByZXNlbnRzIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0aGF0IGEgbGV0dGVyIHVzZXNcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3c9ZmFsc2VdIHtib29sZWFufSBTZXQgYSBkcm9wIHNoYWRvdyBmb3IgdGhlIHRleHRcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dDb2xvcj0nIzAwMDAwMCddIHtzdHJpbmd9IEEgZmlsbCBzdHlsZSB0byBiZSB1c2VkIG9uIHRoZSBkcm9wc2hhZG93IGUuZyAncmVkJywgJyMwMEZGMDAnXG4gICAgICogQHBhcmFtIFt2YWx1ZS5kcm9wU2hhZG93QW5nbGU9TWF0aC5QSS82XSB7bnVtYmVyfSBTZXQgYSBhbmdsZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLmRyb3BTaGFkb3dEaXN0YW5jZT01XSB7bnVtYmVyfSBTZXQgYSBkaXN0YW5jZSBvZiB0aGUgZHJvcCBzaGFkb3dcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnBhZGRpbmc9MF0ge251bWJlcn0gT2NjYXNpb25hbGx5IHNvbWUgZm9udHMgYXJlIGNyb3BwZWQuIEFkZGluZyBzb21lIHBhZGRpbmcgd2lsbCBwcmV2ZW50IHRoaXMgZnJvbSBoYXBwZW5pbmdcbiAgICAgKiBAcGFyYW0gW3ZhbHVlLnRleHRCYXNlbGluZT0nYWxwaGFiZXRpYyddIHtzdHJpbmd9IFRoZSBiYXNlbGluZSBvZiB0aGUgdGV4dCB0aGF0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSBbdmFsdWUubGluZUpvaW49J21pdGVyJ10ge3N0cmluZ30gVGhlIGxpbmVKb2luIHByb3BlcnR5IHNldHMgdGhlIHR5cGUgb2YgY29ybmVyIGNyZWF0ZWQsIGl0IGNhbiByZXNvbHZlXG4gICAgICogICAgICBzcGlrZWQgdGV4dCBpc3N1ZXMuIERlZmF1bHQgaXMgJ21pdGVyJyAoY3JlYXRlcyBhIHNoYXJwIGNvcm5lcikuXG4gICAgICogQHBhcmFtIFt2YWx1ZS5taXRlckxpbWl0PTEwXSB7bnVtYmVyfSBUaGUgbWl0ZXIgbGltaXQgdG8gdXNlIHdoZW4gdXNpbmcgdGhlICdtaXRlcicgbGluZUpvaW4gbW9kZS4gVGhpcyBjYW4gcmVkdWNlXG4gICAgICogICAgICBvciBpbmNyZWFzZSB0aGUgc3Bpa2luZXNzIG9mIHJlbmRlcmVkIHRleHQuXG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgc3R5bGU6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3R5bGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB7fTtcbiAgICAgICAgICAgIHN0eWxlLmZvbnQgPSB2YWx1ZS5mb250IHx8ICdib2xkIDIwcHggQXJpYWwnO1xuICAgICAgICAgICAgc3R5bGUuZmlsbCA9IHZhbHVlLmZpbGwgfHwgJ2JsYWNrJztcbiAgICAgICAgICAgIHN0eWxlLmFsaWduID0gdmFsdWUuYWxpZ24gfHwgJ2xlZnQnO1xuICAgICAgICAgICAgc3R5bGUuc3Ryb2tlID0gdmFsdWUuc3Ryb2tlIHx8ICdibGFjayc7IC8vcHJvdmlkZSBhIGRlZmF1bHQsIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL0dvb2RCb3lEaWdpdGFsL3BpeGkuanMvaXNzdWVzLzEzNlxuICAgICAgICAgICAgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzID0gdmFsdWUuc3Ryb2tlVGhpY2tuZXNzIHx8IDA7XG4gICAgICAgICAgICBzdHlsZS53b3JkV3JhcCA9IHZhbHVlLndvcmRXcmFwIHx8IGZhbHNlO1xuICAgICAgICAgICAgc3R5bGUud29yZFdyYXBXaWR0aCA9IHZhbHVlLndvcmRXcmFwV2lkdGggfHwgMTAwO1xuXG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93ID0gdmFsdWUuZHJvcFNoYWRvdyB8fCBmYWxzZTtcbiAgICAgICAgICAgIHN0eWxlLmRyb3BTaGFkb3dDb2xvciA9IHZhbHVlLmRyb3BTaGFkb3dDb2xvciB8fCAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93QW5nbGUgPSB2YWx1ZS5kcm9wU2hhZG93QW5nbGUgfHwgTWF0aC5QSSAvIDY7XG4gICAgICAgICAgICBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgPSB2YWx1ZS5kcm9wU2hhZG93RGlzdGFuY2UgfHwgNTtcblxuICAgICAgICAgICAgc3R5bGUucGFkZGluZyA9IHZhbHVlLnBhZGRpbmcgfHwgMDtcblxuICAgICAgICAgICAgc3R5bGUudGV4dEJhc2VsaW5lID0gdmFsdWUudGV4dEJhc2VsaW5lIHx8ICdhbHBoYWJldGljJztcblxuICAgICAgICAgICAgc3R5bGUubGluZUpvaW4gPSB2YWx1ZS5saW5lSm9pbiB8fCAnbWl0ZXInO1xuICAgICAgICAgICAgc3R5bGUubWl0ZXJMaW1pdCA9IHZhbHVlLm1pdGVyTGltaXQgfHwgMTA7XG5cbiAgICAgICAgICAgIC8vbXVsdGlwbHkgdGhlIGZvbnQgc3R5bGUgYnkgdGhlIHJlc29sdXRpb25cbiAgICAgICAgICAgIC8vVE9ETyA6IHdhcm4gaWYgZm9udCBzaXplIG5vdCBpbiBweCB1bml0XG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZWRTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBmb250IDogc3R5bGUuZm9udC5yZXBsYWNlKC9bMC05XSsvLE1hdGgucm91bmQocGFyc2VJbnQoc3R5bGUuZm9udC5tYXRjaCgvWzAtOV0rLylbMF0sMTApKnRoaXMucmVzb2x1dGlvbikpLFxuICAgICAgICAgICAgICAgIGZpbGwgOiBzdHlsZS5maWxsLFxuICAgICAgICAgICAgICAgIGFsaWduIDogc3R5bGUuYWxpZ24sXG4gICAgICAgICAgICAgICAgc3Ryb2tlIDogc3R5bGUuc3Ryb2tlLFxuICAgICAgICAgICAgICAgIHN0cm9rZVRoaWNrbmVzcyA6IE1hdGgucm91bmQoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgd29yZFdyYXAgOiBzdHlsZS53b3JkV3JhcCxcbiAgICAgICAgICAgICAgICB3b3JkV3JhcFdpZHRoIDogTWF0aC5yb3VuZChzdHlsZS53b3JkV3JhcFdpZHRoKnRoaXMucmVzb2x1dGlvbiksXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvdyA6IHN0eWxlLmRyb3BTaGFkb3csXG4gICAgICAgICAgICAgICAgZHJvcFNoYWRvd0NvbG9yIDogc3R5bGUuZHJvcFNoYWRvd0NvbG9yLFxuICAgICAgICAgICAgICAgIGRyb3BTaGFkb3dBbmdsZSA6IHN0eWxlLmRyb3BTaGFkb3dBbmdsZSxcbiAgICAgICAgICAgICAgICBkcm9wU2hhZG93RGlzdGFuY2UgOiBNYXRoLnJvdW5kKHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZSp0aGlzLnJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIHBhZGRpbmcgOiBNYXRoLnJvdW5kKHN0eWxlLnBhZGRpbmcqdGhpcy5yZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICB0ZXh0QmFzZWxpbmUgOiBzdHlsZS50ZXh0QmFzZWxpbmUsXG4gICAgICAgICAgICAgICAgbGluZUpvaW4gOiBzdHlsZS5saW5lSm9pbixcbiAgICAgICAgICAgICAgICBtaXRlckxpbWl0IDogc3R5bGUubWl0ZXJMaW1pdFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0eWxlICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlcGFyZVVwZGF0ZVRleHQodGhpcy5fdGV4dCx2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3N0eWxlID0gc3R5bGU7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGNvcHkgZm9yIHRoZSB0ZXh0IG9iamVjdC4gVG8gc3BsaXQgYSBsaW5lIHlvdSBjYW4gdXNlICdcXG4nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQge3N0cmluZ30gVGhlIGNvcHkgdGhhdCB5b3Ugd291bGQgbGlrZSB0aGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQG1lbWJlcm9mIENvY29vblRleHQjXG4gICAgICovXG4gICAgdGV4dDoge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHRleHQpe1xuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9TdHJpbmcoKSB8fCAnICc7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGV4dCAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXBhcmVVcGRhdGVUZXh0KHRleHQsdGhpcy5fc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIGNhbnZhcyBmb3IgYW4gdXBkYXRlIGFuZCB0cnkgdG8gZ2V0IGEgY2FjaGVkIHRleHQgZmlyc3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUucHJlcGFyZVVwZGF0ZVRleHQgPSBmdW5jdGlvbiAodGV4dCxzdHlsZSlcbntcbiAgICB0aGlzLl9waXhpSWQgPSB0ZXh0K0pTT04uc3RyaW5naWZ5KHN0eWxlKSt0aGlzLnJlc29sdXRpb247XG4gICAgdGhpcy5zd2l0Y2hOZWVkZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSBjYW52YXMgZm9yIGFuIHVwZGF0ZSBhbmQgdHJ5IHRvIGdldCBhIGNhY2hlZCB0ZXh0IGZpcnN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnN3aXRjaENhbnZhcyA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGJhc2VUZXh0dXJlID0gUElYSS51dGlscy5CYXNlVGV4dHVyZUNhY2hlW3RoaXMuX3BpeGlJZF07XG4gICAgaWYgKGJhc2VUZXh0dXJlKVxuICAgIHtcbiAgICAgICAgLy90aGVyZSBpcyBhIGNhY2hlZCB0ZXh0IGZvciB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY2FudmFzID0gYmFzZVRleHR1cmUuc291cmNlO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNhbnZhcy5fcGl4aUlkID0gdGhpcy5fcGl4aUlkO1xuXG4gICAgICAgIHRoaXMuY2FjaGVEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHZhciB0ZXh0dXJlID0gUElYSS5UZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpO1xuICAgIHRleHR1cmUudHJpbSA9IG5ldyBQSVhJLm1hdGguUmVjdGFuZ2xlKCk7XG4gICAgdGhpcy50ZXh0dXJlID0gdGV4dHVyZTtcbiAgICB0aGlzLl90ZXh0dXJlID0gdGV4dHVyZTtcbiAgICB0aGlzLnN3aXRjaE5lZWRlZCA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRleHQgYW5kIHVwZGF0ZXMgaXQgd2hlbiBuZWVkZWRcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0ID0gZnVuY3Rpb24gKClcbntcbiAgICBpZiAodGhpcy5zd2l0Y2hOZWVkZWQpXG4gICAge1xuICAgICAgICB0aGlzLnN3aXRjaENhbnZhcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdmFyIHN0eWxlID0gdGhpcy5fZ2VuZXJhdGVkU3R5bGU7XG4gICAgICAgIHRoaXMuY29udGV4dC5mb250ID0gc3R5bGUuZm9udDtcblxuICAgICAgICAvLyB3b3JkIHdyYXBcbiAgICAgICAgLy8gcHJlc2VydmUgb3JpZ2luYWwgdGV4dFxuICAgICAgICB2YXIgb3V0cHV0VGV4dCA9IHN0eWxlLndvcmRXcmFwID8gdGhpcy53b3JkV3JhcCh0aGlzLl90ZXh0KSA6IHRoaXMuX3RleHQ7XG5cbiAgICAgICAgLy8gc3BsaXQgdGV4dCBpbnRvIGxpbmVzXG4gICAgICAgIHZhciBsaW5lcyA9IG91dHB1dFRleHQuc3BsaXQoLyg/OlxcclxcbnxcXHJ8XFxuKS8pO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0ZXh0IHdpZHRoXG4gICAgICAgIHZhciBsaW5lV2lkdGhzID0gbmV3IEFycmF5KGxpbmVzLmxlbmd0aCk7XG4gICAgICAgIHZhciBtYXhMaW5lV2lkdGggPSAwO1xuICAgICAgICB2YXIgZm9udFByb3BlcnRpZXMgPSB0aGlzLmRldGVybWluZUZvbnRQcm9wZXJ0aWVzKHN0eWxlLmZvbnQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgbGluZVdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KGxpbmVzW2ldKS53aWR0aDtcbiAgICAgICAgICAgIGxpbmVXaWR0aHNbaV0gPSBsaW5lV2lkdGg7XG4gICAgICAgICAgICBtYXhMaW5lV2lkdGggPSBNYXRoLm1heChtYXhMaW5lV2lkdGgsIGxpbmVXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkdGggPSBtYXhMaW5lV2lkdGggKyBzdHlsZS5zdHJva2VUaGlja25lc3M7XG4gICAgICAgIGlmIChzdHlsZS5kcm9wU2hhZG93KVxuICAgICAgICB7XG4gICAgICAgICAgICB3aWR0aCArPSBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9ICggd2lkdGggKyB0aGlzLmNvbnRleHQubGluZVdpZHRoICk7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHRleHQgaGVpZ2h0XG4gICAgICAgIHZhciBsaW5lSGVpZ2h0ID0gdGhpcy5zdHlsZS5saW5lSGVpZ2h0IHx8IGZvbnRQcm9wZXJ0aWVzLmZvbnRTaXplICsgc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO1xuXG4gICAgICAgIHZhciBoZWlnaHQgPSBsaW5lSGVpZ2h0ICogbGluZXMubGVuZ3RoO1xuICAgICAgICBpZiAoc3R5bGUuZHJvcFNoYWRvdylcbiAgICAgICAge1xuICAgICAgICAgICAgaGVpZ2h0ICs9IHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9ICggaGVpZ2h0ICsgc3R5bGUucGFkZGluZyAqIDIgKTtcblxuICAgICAgICBpZiAobmF2aWdhdG9yLmlzQ29jb29uSlMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRleHQuZm9udCA9IHN0eWxlLmZvbnQ7XG4gICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHN0eWxlLnN0cm9rZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHN0eWxlLnN0cm9rZVRoaWNrbmVzcztcbiAgICAgICAgdGhpcy5jb250ZXh0LnRleHRCYXNlbGluZSA9IHN0eWxlLnRleHRCYXNlbGluZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVKb2luID0gc3R5bGUubGluZUpvaW47XG4gICAgICAgIHRoaXMuY29udGV4dC5taXRlckxpbWl0ID0gc3R5bGUubWl0ZXJMaW1pdDtcblxuICAgICAgICB2YXIgbGluZVBvc2l0aW9uWDtcbiAgICAgICAgdmFyIGxpbmVQb3NpdGlvblk7XG5cbiAgICAgICAgaWYgKHN0eWxlLmRyb3BTaGFkb3cpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBzdHlsZS5kcm9wU2hhZG93Q29sb3I7XG5cbiAgICAgICAgICAgIHZhciB4U2hhZG93T2Zmc2V0ID0gTWF0aC5jb3Moc3R5bGUuZHJvcFNoYWRvd0FuZ2xlKSAqIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZTtcbiAgICAgICAgICAgIHZhciB5U2hhZG93T2Zmc2V0ID0gTWF0aC5zaW4oc3R5bGUuZHJvcFNoYWRvd0FuZ2xlKSAqIHN0eWxlLmRyb3BTaGFkb3dEaXN0YW5jZTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggPSBzdHlsZS5zdHJva2VUaGlja25lc3MgLyAyO1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblkgPSAoc3R5bGUuc3Ryb2tlVGhpY2tuZXNzIC8gMiArIGkgKiBsaW5lSGVpZ2h0KSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5hbGlnbiA9PT0gJ3JpZ2h0JylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gbWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGUuYWxpZ24gPT09ICdjZW50ZXInKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSAobWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXSkgLyAyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5maWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YICsgeFNoYWRvd09mZnNldCwgbGluZVBvc2l0aW9uWSArIHlTaGFkb3dPZmZzZXQgKyBzdHlsZS5wYWRkaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL3NldCBjYW52YXMgdGV4dCBzdHlsZXNcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHN0eWxlLmZpbGw7XG5cbiAgICAgICAgLy9kcmF3IGxpbmVzIGxpbmUgYnkgbGluZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxpbmVQb3NpdGlvblggPSBzdHlsZS5zdHJva2VUaGlja25lc3MgLyAyO1xuICAgICAgICAgICAgbGluZVBvc2l0aW9uWSA9IChzdHlsZS5zdHJva2VUaGlja25lc3MgLyAyICsgaSAqIGxpbmVIZWlnaHQpICsgZm9udFByb3BlcnRpZXMuYXNjZW50O1xuXG4gICAgICAgICAgICBpZiAoc3R5bGUuYWxpZ24gPT09ICdyaWdodCcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGluZVBvc2l0aW9uWCArPSBtYXhMaW5lV2lkdGggLSBsaW5lV2lkdGhzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGUuYWxpZ24gPT09ICdjZW50ZXInKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmVQb3NpdGlvblggKz0gKG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV0pIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLnN0cm9rZSAmJiBzdHlsZS5zdHJva2VUaGlja25lc3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVRleHQobGluZXNbaV0sIGxpbmVQb3NpdGlvblgsIGxpbmVQb3NpdGlvblkgKyBzdHlsZS5wYWRkaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0eWxlLmZpbGwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KGxpbmVzW2ldLCBsaW5lUG9zaXRpb25YLCBsaW5lUG9zaXRpb25ZICsgc3R5bGUucGFkZGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVRleHR1cmUoKTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0ZXh0dXJlIHNpemUgYmFzZWQgb24gY2FudmFzIHNpemVcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS51cGRhdGVUZXh0dXJlID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgdGV4dHVyZSA9IHRoaXMuX3RleHR1cmU7XG5cbiAgICBpZiAodGhpcy5jYWNoZURpcnR5KVxuICAgIHtcbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLnJlc29sdXRpb24gPSB0aGlzLnJlc29sdXRpb247XG5cbiAgICAgICAgdGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcbiAgICB9XG5cbiAgICB0ZXh0dXJlLmNyb3Aud2lkdGggPSB0ZXh0dXJlLl9mcmFtZS53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRleHR1cmUuY3JvcC5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnJlc29sdXRpb247XG5cbiAgICB0ZXh0dXJlLnRyaW0ueCA9IDA7XG4gICAgdGV4dHVyZS50cmltLnkgPSAtdGhpcy5fc3R5bGUucGFkZGluZztcblxuICAgIHRleHR1cmUudHJpbS53aWR0aCA9IHRleHR1cmUuX2ZyYW1lLndpZHRoO1xuICAgIHRleHR1cmUudHJpbS5oZWlnaHQgPSB0ZXh0dXJlLl9mcmFtZS5oZWlnaHQgLSB0aGlzLl9zdHlsZS5wYWRkaW5nKjI7XG5cbiAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5yZXNvbHV0aW9uO1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuc2NhbGUueCA9IDE7XG4gICAgdGhpcy5zY2FsZS55ID0gMTtcblxuICAgIGlmICh0aGlzLmNhY2hlRGlydHkpXG4gICAge1xuICAgICAgICB0ZXh0dXJlLmJhc2VUZXh0dXJlLmVtaXQoJ3VwZGF0ZScsICB0ZXh0dXJlLmJhc2VUZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZURpcnR5ID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFzY2VudCwgZGVzY2VudCBhbmQgZm9udFNpemUgb2YgYSBnaXZlbiBmb250U3R5bGVcbiAqXG4gKiBAcGFyYW0gZm9udFN0eWxlIHtvYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXRlcm1pbmVGb250UHJvcGVydGllcyA9IGZ1bmN0aW9uIChmb250U3R5bGUpXG57XG4gICAgdmFyIHByb3BlcnRpZXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYWNoZVtmb250U3R5bGVdO1xuXG4gICAgaWYgKCFwcm9wZXJ0aWVzKVxuICAgIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuXG4gICAgICAgIHZhciBjYW52YXMgPSBQSVhJLlRleHQuZm9udFByb3BlcnRpZXNDYW52YXM7XG4gICAgICAgIHZhciBjb250ZXh0ID0gUElYSS5UZXh0LmZvbnRQcm9wZXJ0aWVzQ29udGV4dDtcblxuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250U3R5bGU7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKGNvbnRleHQubWVhc3VyZVRleHQoJ3xNw4lxJykud2lkdGgpO1xuICAgICAgICB2YXIgYmFzZWxpbmUgPSBNYXRoLmNlaWwoY29udGV4dC5tZWFzdXJlVGV4dCgnTScpLndpZHRoKTtcbiAgICAgICAgdmFyIGhlaWdodCA9IDIgKiBiYXNlbGluZTtcblxuICAgICAgICAvLyBiYXNlbGluZSBmYWN0b3IgZGVwZW5kcyBhIGxvdCBvZiB0aGUgZm9udC4gdG9kbyA6IGxldCB1c2VyIHNwZWNpZnkgYSBmYWN0b3IgcGVyIGZvbnQgbmFtZSA/XG4gICAgICAgIGJhc2VsaW5lID0gYmFzZWxpbmUgKiAxLjIgfCAwO1xuXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmMDAnO1xuICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIGNvbnRleHQuZm9udCA9IGZvbnRTdHlsZTtcblxuICAgICAgICBjb250ZXh0LnRleHRCYXNlbGluZSA9ICdhbHBoYWJldGljJztcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnIzAwMCc7XG4gICAgICAgIGNvbnRleHQuZmlsbFRleHQoJ3xNw4lxJywgMCwgYmFzZWxpbmUpO1xuXG4gICAgICAgIHZhciBpbWFnZWRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhO1xuICAgICAgICB2YXIgcGl4ZWxzID0gaW1hZ2VkYXRhLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmUgPSB3aWR0aCAqIDQ7XG5cbiAgICAgICAgdmFyIGksIGo7XG5cbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBzdG9wID0gZmFsc2U7XG5cbiAgICAgICAgLy8gYXNjZW50LiBzY2FuIGZyb20gdG9wIHRvIGJvdHRvbSB1bnRpbCB3ZSBmaW5kIGEgbm9uIHJlZCBwaXhlbFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYmFzZWxpbmU7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmU7IGogKz0gNClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VkYXRhW2lkeCArIGpdICE9PSAyNTUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkeCArPSBsaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5hc2NlbnQgPSBiYXNlbGluZSAtIGk7XG5cbiAgICAgICAgaWR4ID0gcGl4ZWxzIC0gbGluZTtcbiAgICAgICAgc3RvcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc2NlbnQuIHNjYW4gZnJvbSBib3R0b20gdG8gdG9wIHVudGlsIHdlIGZpbmQgYSBub24gcmVkIHBpeGVsXG4gICAgICAgIGZvciAoaSA9IGhlaWdodDsgaSA+IGJhc2VsaW5lOyBpLS0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lOyBqICs9IDQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGltYWdlZGF0YVtpZHggKyBqXSAhPT0gMjU1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZHggLT0gbGluZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMuZGVzY2VudCA9IGkgLSBiYXNlbGluZTtcbiAgICAgICAgcHJvcGVydGllcy5mb250U2l6ZSA9IHByb3BlcnRpZXMuYXNjZW50ICsgcHJvcGVydGllcy5kZXNjZW50O1xuXG4gICAgICAgIFBJWEkuVGV4dC5mb250UHJvcGVydGllc0NhY2hlW2ZvbnRTdHlsZV0gPSBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIG5ld2xpbmVzIHRvIGEgc3RyaW5nIHRvIGhhdmUgaXQgb3B0aW1hbGx5IGZpdCBpbnRvIHRoZSBob3Jpem9udGFsXG4gKiBib3VuZHMgc2V0IGJ5IHRoZSBUZXh0IG9iamVjdCdzIHdvcmRXcmFwV2lkdGggcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHRleHQge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLndvcmRXcmFwID0gZnVuY3Rpb24gKHRleHQpXG57XG4gICAgLy8gR3JlZWR5IHdyYXBwaW5nIGFsZ29yaXRobSB0aGF0IHdpbGwgd3JhcCB3b3JkcyBhcyB0aGUgbGluZSBncm93cyBsb25nZXJcbiAgICAvLyB0aGFuIGl0cyBob3Jpem9udGFsIGJvdW5kcy5cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIHdvcmRXcmFwV2lkdGggPSB0aGlzLl9nZW5lcmF0ZWRTdHlsZS53b3JkV3JhcFdpZHRoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgICB2YXIgc3BhY2VMZWZ0ID0gd29yZFdyYXBXaWR0aDtcbiAgICAgICAgdmFyIHdvcmRzID0gbGluZXNbaV0uc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB3b3Jkcy5sZW5ndGg7IGorKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHdvcmRXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCh3b3Jkc1tqXSkud2lkdGg7XG4gICAgICAgICAgICB2YXIgd29yZFdpZHRoV2l0aFNwYWNlID0gd29yZFdpZHRoICsgdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KCcgJykud2lkdGg7XG4gICAgICAgICAgICBpZiAoaiA9PT0gMCB8fCB3b3JkV2lkdGhXaXRoU3BhY2UgPiBzcGFjZUxlZnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwcmludGluZyB0aGUgbmV3bGluZSBpZiBpdCdzIHRoZSBmaXJzdCB3b3JkIG9mIHRoZSBsaW5lIHRoYXQgaXNcbiAgICAgICAgICAgICAgICAvLyBncmVhdGVyIHRoYW4gdGhlIHdvcmQgd3JhcCB3aWR0aC5cbiAgICAgICAgICAgICAgICBpZiAoaiA+IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB3b3Jkc1tqXTtcbiAgICAgICAgICAgICAgICBzcGFjZUxlZnQgPSB3b3JkV3JhcFdpZHRoIC0gd29yZFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNwYWNlTGVmdCAtPSB3b3JkV2lkdGhXaXRoU3BhY2U7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcgJyArIHdvcmRzW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCBsaW5lcy5sZW5ndGgtMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIG9iamVjdCB1c2luZyB0aGUgV2ViR0wgcmVuZGVyZXJcbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIge1dlYkdMUmVuZGVyZXJ9XG4gKi9cbkNvY29vblRleHQucHJvdG90eXBlLnJlbmRlcldlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLnJlbmRlcldlYkdMLmNhbGwodGhpcywgcmVuZGVyZXIpO1xufTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBvYmplY3QgdXNpbmcgdGhlIENhbnZhcyByZW5kZXJlclxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB7Q2FudmFzUmVuZGVyZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5fcmVuZGVyQ2FudmFzID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxue1xuICAgIGlmICh0aGlzLmRpcnR5KVxuICAgIHtcbiAgICAgICAgdGhpcy51cGRhdGVUZXh0KCk7XG4gICAgfVxuXG4gICAgUElYSS5TcHJpdGUucHJvdG90eXBlLl9yZW5kZXJDYW52YXMuY2FsbCh0aGlzLCByZW5kZXJlcik7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGUgVGV4dCBhcyBhIHJlY3RhbmdsZS4gVGhlIGJvdW5kcyBjYWxjdWxhdGlvbiB0YWtlcyB0aGUgd29ybGRUcmFuc2Zvcm0gaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBtYXRyaXgge01hdHJpeH0gdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGUgVGV4dFxuICogQHJldHVybiB7UmVjdGFuZ2xlfSB0aGUgZnJhbWluZyByZWN0YW5nbGVcbiAqL1xuQ29jb29uVGV4dC5wcm90b3R5cGUuZ2V0Qm91bmRzID0gZnVuY3Rpb24gKG1hdHJpeClcbntcbiAgICBpZiAodGhpcy5kaXJ0eSlcbiAgICB7XG4gICAgICAgIHRoaXMudXBkYXRlVGV4dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBQSVhJLlNwcml0ZS5wcm90b3R5cGUuZ2V0Qm91bmRzLmNhbGwodGhpcywgbWF0cml4KTtcbn07XG5cbi8qKlxuICogRGVzdHJveXMgdGhpcyB0ZXh0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gW2Rlc3Ryb3lCYXNlVGV4dHVyZT10cnVlXSB7Ym9vbGVhbn0gd2hldGhlciB0byBkZXN0cm95IHRoZSBiYXNlIHRleHR1cmUgYXMgd2VsbFxuICovXG5Db2Nvb25UZXh0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKGRlc3Ryb3lCYXNlVGV4dHVyZSlcbntcbiAgICAvLyBtYWtlIHN1cmUgdG8gcmVzZXQgdGhlIHRoZSBjb250ZXh0IGFuZCBjYW52YXMuLiBkb250IHdhbnQgdGhpcyBoYW5naW5nIGFyb3VuZCBpbiBtZW1vcnkhXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLmNhbnZhcyA9IG51bGw7XG5cbiAgICB0aGlzLl9zdHlsZSA9IG51bGw7XG5cbiAgICB0aGlzLl90ZXh0dXJlLmRlc3Ryb3koZGVzdHJveUJhc2VUZXh0dXJlID09PSB1bmRlZmluZWQgPyB0cnVlIDogZGVzdHJveUJhc2VUZXh0dXJlKTtcbn07XG4iXX0=
