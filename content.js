// hand cursor
$('body').append('<div id="hand"><\/div>');
$('#hand').css({
	'width': '20px',
	'height': '20px',
	'position': 'absolute',
	'background': 'red',
	'left': 0,
	'bottom': 0,
	'z-index': 10000,
	'pointer-events': 'none'
});

// text hint
$('body').append('<div id="hint"><\/div>');
$('#hint').css({
	'position': 'absolute',
	'left': 0,
	'top': 0,
	'width': '100%',
	'margin-top': '100px',
	'text-align': 'center',
	'font-size': '80px',
	'color': '#aaaaaa',
	'z-index': 10000,
	'opacity': 0,
	'pointer-events': 'none'
});


// debug hint
$('body').append('<div id="debughint"><\/div>');
$('#debughint').css({
	'position': 'absolute',
	'left': 0,
	'top': 0,
	'width': '100%',
	'margin-top': '200px',
	'text-align': 'center',
	'font-size': '80px',
	'color': '#aaaaaa',
	'z-index': 10000,
	'opacity': 1,
	'pointer-events': 'none'
});

function clickableElementsFromPoint(x, y) {
	let element, elementList = [];
	let old_visibility = [];
	let foundElement;
	while (true) {
		// get element under point x, y
		// element with 'pointer-events': 'none' won't be catch
		element = document.elementFromPoint(x, y);
		if (!element || element === document.documentElement) {
			foundElement = false;
			break;
		}
		if('click' in element) {
			foundElement = true;
			break;
		}
		elementList.push(element);
		old_visibility.push(element.style.visibility);
		element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)

	}
	for (var k = 0; k < elementList.length; k++) {
		elementList[k].style.visibility = old_visibility[k];
	}
	// if(debugoutput) {
	// 	console.log('list length: ', elementList.length);
	// 	if(elementList.length > 1) {
	// 		for(let x of elementList) {
	// 			console.log(x);
	// 		}
	// 		leapdebug = elementList;
	// 	}
	// }
	if(foundElement) {
		return element;
	} else {
		return null;
	}
}
function mapScrollSpeed(dist) {
	const deadzone = 100;
	if(dist <= deadzone)
		return 0;
	else {
		return Math.ceil((dist-deadzone)/200) * 10;
	}
}

// positions
const CENTER = 0
const UPPER_LEFT = 1;
const UPPER_RIGHT = 2;
const LOWER_LEFT = 3;
const LOWER_RIGHT = 4;
const UP = 5;
const DOWN = 6;
currentPointingHref = null; // New feature!
currentHandArea = CENTER; // New feature!
var myOnFrameHook = function(frame) {
	console.log('fuck');
	var hand;
	if(hand = frame.hands[0]) {
		// 0 left-right 1 up-down 2 front-back
		let pos = hand.screenPosition();
		// console.log(pos);
		let pos_x = (pos[0] - 0.5 * window.innerWidth) * 4.5 + window.innerWidth * 0.5;
		let pos_y = pos[1] * 2.5 + window.innerHeight;
		// let pos_y = pos[2] * 2.5;

		let area = CENTER;
		if(pos_x < window.innerWidth * 0.2 && pos_y < 0) {
			area = UPPER_LEFT;
		} else if(pos_x > window.innerWidth * 0.8 && pos_y < 0) {
			area = UPPER_RIGHT;
		} else if(pos_x < window.innerWidth * 0.2 && pos_y > window.innerHeight) {
			area = LOWER_LEFT;
		} else if(pos_x > window.innerWidth * 0.8 && pos_y > window.innerHeight) {
			area = LOWER_RIGHT;
		} else if(pos_x > window.innerWidth * 0.3 && pos_x < window.innerWidth * 0.7) {
			let dist = 0;
			if(pos_y < 0) {
				area = UP;
				dist = mapScrollSpeed(-pos_y);

				chrome.runtime.sendMessage({
					"message": "scroll_up_current_tab", 
					"speed": mapScrollSpeed(-pos_y)
				});
			} 
			else if(pos_y > window.innerHeight) {
				area = DOWN;
				dist = mapScrollSpeed(pos_y - window.innerHeight);

				chrome.runtime.sendMessage({
					"message": "scroll_down_current_tab",
					"speed": mapScrollSpeed(pos_y - window.innerHeight)
				});
			}

			$('#debughint').html(String(dist));
			$('#debughint').css({
				left: ($(window).scrollLeft()) + 'px',
				top: ($(window).scrollTop()) + 'px'
			});
		}

		if(area != currentHandArea) {
			currentHandArea = area;
			console.log(area);
			if(area == UPPER_LEFT) {
				$('#hint').html('向后');
			} else if(area == UPPER_RIGHT) {
				$('#hint').html('向前');
			} else if(area == LOWER_LEFT) {
				$('#hint').html('某个功能');
			} else if(area == LOWER_RIGHT) {
				$('#hint').html('关闭标签页');
			}
			if(area != CENTER && area != UP && area != DOWN) {
				$('#hint').animate({
					'opacity': '1'
				}, 'slow');
			} else {
				$('#hint').animate({
					'opacity': '0'
				}, 'slow');
			}
			$('#hint').css({
				left: ($(window).scrollLeft()) + 'px',
				top: ($(window).scrollTop()) + 'px'
			});
		}

		let handEle = $('#hand');
		handEle.css({
			left: (pos_x + $(window).scrollLeft()) + 'px',
			top: (pos_y + $(window).scrollTop()) + 'px'
		});

		// handEle[0].style.visibility = 'hidden';
		currentPointingHref = clickableElementsFromPoint(pos_x, pos_y);
		// handEle[0].style.visibility = '';

		// _this.currentPointingHref = null;
		// $('a').each(function() {
		// 	let href_pos = this.getBoundingClientRect();
		// 	if(pos_x > href_pos.x && pos_x < href_pos.x + href_pos.width &&
		// 	   pos_y > href_pos.y && pos_y < href_pos.y + href_pos.height) {
		// 		$(this).css({
		// 			'color': 'green'
		// 		});
		// 		if(this.href) {
		// 			// _this.currentPointingHref = this.href;
		// 			_this.currentPointingHref = this;
		// 		}
		// 	}
		// });
	}
}

var leapController = new Leap.Controller();
leapController.use('screenPosition', {});
// var trainer = new LeapTrainer.ANNController();
var trainer = new LeapTrainer.CorrelationController({customizedOnFrame: myOnFrameHook});
// trainer.fromJSON(swipe_left);
// trainer.fromJSON(swipe_right);
trainer.fromJSON(stop1);
trainer.fromJSON(stop2);
trainer.fromJSON(stop3);
trainer.fromJSON(stop4);
trainer.fromJSON(stop5);
trainer.on('SWIPE_LEFT', function() { 
	console.log('swipe-left');
	// chrome.runtime.sendMessage({"message": "go_forward_current_tab"});
});
trainer.on('SWIPE_RIGHT', function() { 
	console.log('swipe-right');
	// chrome.runtime.sendMessage({"message": "go_back_current_tab"});
});

function stop_function() {
	console.log('stop');
	switch(trainer.currentHandArea) {
		case UPPER_LEFT:
			chrome.runtime.sendMessage({"message": "go_back_current_tab"});
			break;
		case UPPER_RIGHT:
			chrome.runtime.sendMessage({"message": "go_forward_current_tab"});
			break;
		case LOWER_LEFT:

			break;
		case LOWER_RIGHT:
			chrome.runtime.sendMessage({"message": "close_current_tab"});
			break;
		case CENTER:
			// chrome.runtime.sendMessage({"message": "open_new_tab", "url": trainer.currentPointingHref});
			if(trainer.currentPointingHref) {
				// window.location.href = trainer.currentPointingHref;
				trainer.currentPointingHref.click();
			}
			break;
	}
}

trainer.on('STOP1', stop_function);
trainer.on('STOP2', stop_function);
trainer.on('STOP3', stop_function);
trainer.on('STOP4', stop_function);
trainer.on('STOP5', stop_function);
