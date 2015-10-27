/* global Promise */
'use strict';
(function(){
	
	var PREFIXES = ['webkit', 'moz', 'MS', 'o', ''];
	var ANIMATION_PREFIXES = {
		'animation': 'animationend',
		'OAnimation': 'oanimationend',
		'MSAnimation': 'MSAnimationEnd',
		'WebkitAnimation': 'webkitAnimationEnd'
	};
	
	function prefixedEvent(element, type, callback) {
		for (var i = 0; i < PREFIXES.length; i++) {
			var prefix = PREFIXES[i];
			if (!prefix) {
				type = type.toLowerCase();
			}
			element.addEventListener(prefix + type, callback, false);
		}
	}
	
	function addPrefixedStyle(element, property, style) {
		for (var i = 0; i < PREFIXES.length; i++) {
			var prefix = PREFIXES[i];
			if (!prefix) {
				property = property.toLowerCase();
			}
			element.style[prefix + property] = style;
		}
	}
	// Determine the prefix for the animation events
	// @see: http://davidwalsh.name/css-animation-callback
	
	function whichAnimationEvent() {
		var el = document.createElement('fakeelement');
		for (var animationPrefix in ANIMATION_PREFIXES) {
			if (el.style[animationPrefix] !== undefined) {
				return ANIMATION_PREFIXES[animationPrefix];
			}
		}
	}
	var animationEndPrefixed = whichAnimationEvent();
	var defaults = {
		attachTo: 'body',
		ignoreScroll: false,
		useActualMax: false
	};
	
	function Zoomable(element) {
		this.element = element;
		this.config = Object.assign({}, defaults, {
			element: element
		});
		
		this.wrap = function() {
			var wrapper = document.createElement('div');
			wrapper.className = 'media-placeholder';
			var parent = this.element.parentNode;
			var sibling = this.element.nextElementSibling;
			wrapper.appendChild(this.element);
			if (sibling) {
				parent.insertBefore(wrapper, sibling);
			} else {
				parent.appendChild(wrapper);
			}
		}
		
		this.toggleZoom = function(zoomOut) {
			var element = this.element;
			var isZoomed = typeof zoomOut === 'boolean' ? zoomOut : element.classList.contains('zoomed');
			var scrollFn = this.onScroll.bind(this);
			// clear all other elements caught in transition (not sure how this happens)
			var siblings = document.querySelectorAll('.zooming');
			for (var i = 0; i < siblings.length; i++) {
				siblings[i].classList.remove('zooming');
			}
			if (isZoomed) {
				addPrefixedStyle(element, 'Transform', '');
				element.classList.add('zooming-out');
				element.classList.remove('zoomed');
				// remove the next sibling (the overlay)
				if (element.nextElementSibling) {
					var overlay = element.nextElementSibling;
					overlay.classList.add('fade-out');
					overlay.addEventListener(animationEndPrefixed, function(){
						if (overlay.parentNode) {
							overlay.parentNode.removeChild(overlay); // element.remove() is not supported on ie
						}
					});
				}
				// remove scroll listener on this element
				if (!this.config.ignoreScroll) {
					document.removeEventListener('scroll', scrollFn);
				}
			} else {
				var translate = getTranslate(element);
				var scale = getZoom(element, this.useActualMax);
				var overlay = document.createElement('div');
				// prepare overlay element
				overlay.classList.add('zoom-overlay', 'fade-in');
				addPrefixedStyle(element, 'Transform', translate + " scale(" + scale + ")");
				element.classList.add('zoomed', 'zooming-in');
				this._ignoreScroll = false;
				// insert the overlay after this element
				element.parentNode.insertBefore(overlay, element.nextElementSibling);
				// bind click on overlay
				once(overlay, 'click', this.toggleZoom.bind(this));
				// listen for scroll, bound to this element
				if (!this.config.ignoreScroll) {
					document.addEventListener('scroll', scrollFn);
				}
			}
			element.classList.add('zooming');
		}
		this.onScroll = function() {
			if (!this._ignoreScroll) {
				this._ignoreScroll = true;
				this.toggleZoom.call(this, true);
			}
		}
		this.removeZoomClass = function() {
			console.log(this.element);
			this.element.classList.remove('zooming');
			this.element.classList.remove('zooming-in');
			this.element.classList.remove('zooming-out');
		}
		
		// bind element to do things when the image has loaded
		onImageLoad.call(element);
		// bind click to toggle zoom
		element.addEventListener('click', this.toggleZoom.bind(this), false);
		prefixedEvent(element, 'TransitionEnd', this.removeZoomClass.bind(this));
		// wrap with container
		this.wrap();
	}
	// create a one-time event
	
	function once(node, type, callback) {
		// create event
		node.addEventListener(type, function(e) {
			// remove event
			e.target.removeEventListener(e.type, node);
			// call handler
			return callback(e);
		});
	}
	
	function getActualImageSize(src, callback) {
		var image = new Image();
		image.src = src;
		image.onload = function() {
			callback({
				width: this.width,
				height: this.height
			});
		};
	}
	
	function onImageLoad() {
		var element = this;
		var src = element.src;
		if (!src && element.style.backgroundImage) {
			// finds the first background image matching the url pattern
			src = element.style.backgroundImage.replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');
		}
		if (src) {
			getActualImageSize(src, function(){
				createFillerElement.bind(element);
			});
		}
	}
	/**
	 * insert filler element before element
	 */
	
	function createFillerElement(dimensions) {
		var element = this;
		var height = element.offsetHeight;
		var width = element.offsetWidth;
		var ratio = Math.round(height / width * 100);
		// var actualRatio = Math.round(dimensions.height / dimensions.width * 100);
		// if (ratio !== actualRatio) {
		element.setAttribute('data-width', width);
		element.setAttribute('data-height', height);
		element.setAttribute('data-actual-width', dimensions.width);
		element.setAttribute('data-actual-height', dimensions.height);
		// }
		element.insertAdjacentHTML('beforebegin', '<div class="media-fill" style="width:${width}px;height:${height}px"></div>');
	  element.classList.add('media-image');
	}
	
	function getViewportDimensions() {
		var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		return {
			width: viewportWidth,
			height: viewportHeight
		};
	}

	function offset(node) {
		var rect = node.getBoundingClientRect()
		return {
			top: rect.top + (document.documentElement.scrollTop || document.body.scrollTop),
			left: rect.left + (document.documentElement.scrollLeft || document.body.scrollLeft)
		};
	}

	function getZoom(element, useActualMax) {
		var scale = 1;
		// margin between full viewport and full image
		var margin = 20;
		var totalOffset = margin * 2;
		var viewport = getViewportDimensions();
		var scaleX = viewport.width / (getWidth(element) + totalOffset);
		var scaleY = viewport.height / (getHeight(element) + totalOffset);
		if (useActualMax) {
			scaleX = Math.min(scaleX, element.dataset.actualWidth / getWidth(element));
			scaleY = Math.min(scaleY, element.dataset.actualHeight / getHeight(element));
		}
		return Math.min(scaleY, scaleX);
	}

	function getWidth(element) {
		return element.offsetWidth;
		// @todo grow to actual width/height ratio
		// var width = element.offsetWidth;
		// if (element.dataset.width && element.dataset.height) {
		//   width = Number(element.dataset.width / element.dataset.height * getHeight(element));
		// }
		// return width;
	}

	function getHeight(element) {
		return element.offsetHeight;
	}

	function getTranslate(element) {
		var viewport = getViewportDimensions();
		/**
		 * get the actual image width and height
		 */
		var imageWidth = getWidth(element);
		var imageHeight = getHeight(element);
		// compute distance from image center to viewport center
		var imageCenterScrolltop = offset(element).top + (imageHeight / 2) - window.scrollY;
		var translateY = (viewport.height / 2) - imageCenterScrolltop;
		var imageCenterWidth = offset(element).left + (imageWidth / 2);
		var translateX = (viewport.width / 2) - imageCenterWidth;
		return "translate(" + translateX + "px, " + translateY + "px) translateZ(10px)";
	}
	/**
	 * bind to all elements with `data-action=zoom`
	 */
	document.addEventListener('DOMContentLoaded', function() {
		var elements = document.querySelectorAll('[data-action=zoom]');
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			element.__zoomable__ = new Zoomable(element);
		}
	});

})();
	