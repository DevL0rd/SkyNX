//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
var offset = 0;
//IE support
if (!String.prototype.includes) {
	String.prototype.includes = function (search, start) {
		'use strict';
		if (typeof start !== 'number') {
			start = 0;
		}

		if (start + search.length > this.length) {
			return false;
		} else {
			return this.indexOf(search, start) !== -1;
		}
	};
}
function getAnimations(styleSheetName) {
	var anims = [];
	for (i in document.styleSheets) {
		var styleSheet = document.styleSheets[i];
		var filePath = styleSheet.href;
		if (!filePath) continue;
		var filePathSplit = filePath.split("/");
		var fileName = filePathSplit[filePathSplit.length - 1].split(".")[0];
		if (fileName != styleSheetName) continue;
		var rules = styleSheet.rules || styleSheet.cssRules;
		for (rI in rules) {
			var rule = rules[rI];
			if (!rule.selectorText) continue;
			if (!rule.selectorText.includes("_anim")) continue;
			var animStr = rule.selectorText.split(".").pop().split("_anim").shift();
			anims.push(animStr);
		}
	}
	return anims;
}
var animations = getAnimations("animations");
function htmlCollectionToArray(HTMLCollectionObj) {
	return Array.prototype.slice.call(HTMLCollectionObj);
}
var animatedElements = [];
function getAnimatedElements() {
	var animatedElementsList = [];
	animations.forEach(function (anim) {
		var els = document.getElementsByClassName(anim);
		animatedElementsList = animatedElementsList.concat(htmlCollectionToArray(els));
	});
	return animatedElementsList;
}

function refreshAnimatedElements() {
	animatedElements = [];
	animatedElements = getAnimatedElements();
	for (i in animatedElements) {
		animatedElements[i].parentElement.addEventListener("scroll", function (event) {
			if (!viewChanged) {
				viewChanged = true;
				(!window.requestAnimationFrame) ? setTimeout(updateElements, 250) : window.requestAnimationFrame(updateElements);
			}
		}, { passive: true });
	}

}
function hideElement(el) {
	el.classList.add("is-hidden");
	for (i in animations) {
		var anim = animations[i];
		if (el.classList.contains(anim)) {
			el.classList.remove(anim + "_anim");
			break;
		}
	}
}
function showElement(el) {
	for (i in animations) {
		var anim = animations[i];
		if (el.classList.contains(anim)) {
			el.classList.add(anim + "_anim");
			el.classList.remove("is-hidden");
			break;
		}
	}
}
function hideElements() {
	var currentParent
	var parentBounds
	animatedElements.forEach(function (el) {
		var bounds = el.getBoundingClientRect();
		if (el.parentElement != currentParent) {
			currentParent = el.parentElement;
			parentBounds = el.parentElement.getBoundingClientRect();
		}
		if (bounds.top > parentBounds.bottom || bounds.bottom < parentBounds.top) {
			hideElement(el);
		}
	});
}
hideElements();
var viewChanged = false;
window.addEventListener("resize", function (event) {
	if (!viewChanged) {
		viewChanged = true;
		(!window.requestAnimationFrame) ? setTimeout(updateElements, 250) : window.requestAnimationFrame(updateElements);
	}
}, { passive: true });

function updateElements() {
	var currentParent
	var parentBounds
	animatedElements.forEach(function (el) {
		try {
			var bounds = el.getBoundingClientRect();
			if (el.parentElement != currentParent) {
				currentParent = el.parentElement;
				parentBounds = el.parentElement.getBoundingClientRect();
			}
			if (el.classList.contains("is-hidden") && bounds.top <= parentBounds.bottom - offset && bounds.bottom >= parentBounds.top + offset) {
				showElement(el);
			} else if (bounds.top > parentBounds.bottom || bounds.bottom < parentBounds.top) {
				hideElement(el);
			}
		} catch (err) {

		}
	});
	viewChanged = false;
};

var r = 255, g = 0, b = 0;
var r2 = 225, g2 = 30, b2 = 0;
var r3 = 205, g3 = 50, b3 = 0;
var r4 = 175, g4 = 80, b4 = 0;
var rainbowAccentInterval
function rainbowAccent(delay = 40) {
	clearInterval(rainbowAccentInterval);
	r = 255, g = 0, b = 0;
	r2 = 225, g2 = 30, b2 = 0;
	r3 = 205, g3 = 50, b3 = 0;
	r4 = 175, g4 = 80, b4 = 0;
	rainbowAccentInterval = setInterval(function () {
		if (r > 0 && b == 0) {
			r--;
			g++;
		}
		if (g > 0 && r == 0) {
			g--;
			b++;
		}
		if (b > 0 && g == 0) {
			r++;
			b--;
		}
		if (r2 > 0 && b2 == 0) {
			r2--;
			g2++;
		}
		if (g2 > 0 && r2 == 0) {
			g2--;
			b2++;
		}
		if (b2 > 0 && g2 == 0) {
			r2++;
			b2--;
		}
		if (r3 > 0 && b3 == 0) {
			r3--;
			g3++;
		}
		if (g3 > 0 && r3 == 0) {
			g3--;
			b3++;
		}
		if (b3 > 0 && g3 == 0) {
			r3++;
			b3--;
		}
		if (r4 > 0 && b4 == 0) {
			r4--;
			g4++;
		}
		if (g4 > 0 && r4 == 0) {
			g4--;
			b4++;
		}
		if (b4 > 0 && g4 == 0) {
			r4++;
			b4--;
		}
		$(".rainbowFontColor").css("color", "rgb(" + r + "," + g + "," + b + ")");
		$(".rainbowBackgroundColor").css("background", "linear-gradient(to right, rgba(" + r + "," + g + "," + b + ", 0.8) 0%, rgba(" + r2 + "," + g2 + "," + b2 + ", 0.8) 100%)");
		$(".rainbowBackgroundColor2").css("background", "linear-gradient(to right, rgba(" + r3 + "," + g3 + "," + b3 + ", 0.8) 0%, rgba(" + r4 + "," + g4 + "," + b4 + ", 0.8) 100%)");
		// $(".customScroll::-webkit-scrollbar-thumb").css("background", "rgba(" + r + "," + g + "," + b + ", 0.8)");
		$("input:checked + .slider").css("background", "linear-gradient(to right, rgba(" + r + "," + g + "," + b + ", 0.7) 0%, rgba(" + r2 + "," + g2 + "," + b2 + ", 0.7) 100%)");
		$(":not(input:checked) + .slider").css("background", "rgba(0,0,0, 0.7)");
	}, delay);
}
function setAccentColor(r, g, b, a) {
	clearInterval(rainbowAccentInterval);
	$(".rainbowFontColor").css("color", "rgb(" + r + "," + g + "," + b + ")");
	$(".rainbowBackgroundColor").css("background", "rgba(" + r + "," + g + "," + b + ", " + a + ")");
	$(".rainbowBackgroundColor2").css("background", "rgba(" + r + "," + g + "," + b + ", " + a + ")");
	// $(".customScroll::-webkit-scrollbar-thumb").css("background", "rgba(" + r + "," + g + "," + b + ", 0.8)");
	$("input:checked + .slider").css("background", "rgba(" + r + "," + g + "," + b + ", " + a + ")");
	$(":not(input:checked) + .slider").css("background", "rgba(0,0,0, 0.7)");
}
