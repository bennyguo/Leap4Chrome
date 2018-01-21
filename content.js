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
	'margin-top': '10px',
	'text-align': 'left',
	'font-size': '20px',
	'color': '#808080',
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

// digital filter
function Filter(coeffB) {
	this.coeffB = coeffB;
	this.xlength = coeffB.length;
	this.xlist = []; 
	this.xlist.length = coeffB.length;
	this.xlist.fill(0);

	this.call = function(newx) {
		this.xlist.unshift(newx);
		this.xlist.pop();
		var y = 0;
		for(let i=0; i<this.xlength; i++) {
			y += this.coeffB[i] * this.xlist[i];
		}
		return y;
	}
}
function Filter3D() {
	const B = [0.0533, 0.0642, 0.0739, 0.0820, 0.0881, 0.0919, 0.0932, 0.0919, 0.0881, 0.0820, 0.0739, 0.0642, 0.0533];
	this.filters = [];
	for(let i=0; i<3; i++)
		this.filters.push(new Filter(B));
	this.call = function(newCord) {
		var ret = [];
		for(let i=0; i<3; i++) {
			ret.push(this.filters[i].call(newCord[i]));
		}
		return ret;
	}
}
var stablizer = new Filter3D();
// digital filter end

// positions
const CENTER = 0
const UPPER_LEFT = 1;
const UPPER_RIGHT = 2;
const LOWER_LEFT = 3;
const LOWER_RIGHT = 4;
const UP = 5;
const DOWN = 6;
const LEFT = 7;
const RIGHT = 8;
var currentPointingHref = null; // New feature!
var lastPointingHref = null;
var currentHandArea = CENTER; // New feature!
var isFist = false;
var clickTimeout = null;
var funcTimeout = null;
var closeCount = 0;
var closeDecLoop = setInterval(function() {
	console.log('close count: ' + closeCount);
	if(closeCount > 2) {
		chrome.runtime.sendMessage({"message": "close_current_tab"});
		closeCount = 0;
	} else if(closeCount > 0) {
		closeCount--;
	}	
}, 500);

var leapdebug = 0;
var startrecord = false;
var endrecord = false;
var record = [], frametimes = [];
var lasttime = null;

var myOnFrameHook = function(frame) {
	var hand;
	if(hand = frame.hands[0]) {
		leapdebug = frame;
		$('#debughint').html(
		`${hand.grabStrength}<br/>
		`);
		$('#debughint').css({
			left: ($(window).scrollLeft()) + 'px',
			top: ($(window).scrollTop()) + 'px'
		});
		if(startrecord) {
			record.push(hand.screenPosition());
			let time = new Date();
			if(lasttime) {
				frametimes.push(time - lasttime);
			}
			lasttime = time;
		}
		if(endrecord || frametimes.length >= 299) {
			console.log('record = [\n' + record.map(x => x.toString()).map(x => `[${x}]`).join('\n') + '];');
			console.log(frametimes.toString());
			console.log(`length: ${frametimes.length} mean: ${frametimes.reduce((x, y) => x+y) / frametimes.length}`);
			record = [];
			frametimes = [];
			startrecord = false;
			endrecord = false;
			lasttime = null;
		}

		isFist = (hand.grabStrength > 1 - 1e-5);
		// 0 left-right 1 up-down 2 front-back
		let pos = stablizer.call(hand.screenPosition());
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
		} else if(pos_x < 0 && pos_y > 0 && pos_y < window.innerHeight) {
			area = LEFT;
		} else if(pos_x > window.innerWidth && pos_y > 0 && pos_y < window.innerHeight) {
			area = RIGHT;
		} else if(pos_x > window.innerWidth * 0.3 && pos_x < window.innerWidth * 0.7) {
			let dist = 0;
			if(pos_y < 0) {
				area = UP;
				chrome.runtime.sendMessage({
					"message": "scroll_up_current_tab", 
					"speed": mapScrollSpeed(-pos_y)
				});
			} 
			else if(pos_y > window.innerHeight) {
				area = DOWN;
				chrome.runtime.sendMessage({
					"message": "scroll_down_current_tab",
					"speed": mapScrollSpeed(pos_y - window.innerHeight)
				});
			}
		}

		if(!isFist || currentHandArea != area) {
			clearTimeout(funcTimeout);
			funcTimeout = null;
		}
		else {
			if(area == LEFT && isFist && !funcTimeout) {
				funcTimeout = setTimeout(function() {
					chrome.runtime.sendMessage({"message": "go_back_current_tab"});
				}, 1000);
			} else if(area == RIGHT && isFist && !funcTimeout) {
				funcTimeout = setTimeout(function() {
					chrome.runtime.sendMessage({"message": "go_forward_current_tab"});
				}, 1000);
			}
		}

		if(area != currentHandArea) {
			currentHandArea = area;
			console.log(area);
			if(area == LEFT) {
				$('#hint').html('向后');
				closeCount++;
			} else if(area == RIGHT) {
				$('#hint').html('向前');
				closeCount++;
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
		if(currentHandArea == CENTER) {
			handEle.css({
				display: 'block'
			});
		} else {
			handEle.css({
				display: 'none'
			});
		}

		if(isFist)
			currentPointingHref = clickableElementsFromPoint(pos_x, pos_y);
		else
			currentPointingHref = null;
		if(currentPointingHref && currentPointingHref != lastPointingHref && isFist) {
			clearTimeout(clickTimeout);
			clickTimeout = setTimeout(function(clickable) {
				clickable.click();
			}, 500, currentPointingHref);
		} else if(currentPointingHref == null) {
			clearTimeout(clickTimeout);
		}
		lastPointingHref = currentPointingHref;
	}
}

LeapTrainer.MyController = LeapTrainer.CorrelationController.extend({
	costumizedOnFrame: myOnFrameHook,
	bindFrameListener: function() {
		/*
		 * Variables are declared locally here once in order to minimize variable creation and lookup in the high-speed frame listener.
		 */
		var recording = false, frameCount = 0, gesture = [],

		/*
		 * These two utility functions are used to push a vector (a 3-variable array of numbers) into the gesture array - which is the 
		 * array used to store activity in a gesture during recording. NaNs are replaced with 0.0, though they shouldn't occur!
		 */
		recordValue		 = function (val) 	{ gesture.push(isNaN(val) ? 0.0 : val); },
		recordVector	 = function (v) 	{ recordValue(v[0]); recordValue(v[1]); recordValue(v[2]); };

		this.onFrame = function(frame) {
			if(this.costumizedOnFrame) {
				this.costumizedOnFrame(frame);	
			}
			/*
			 * The pause() and resume() methods can be used to temporarily disable frame monitoring.
			 */
			if (this.paused) { return; }

			/*
			 * Frames are ignored if they occur too soon after a gesture was recognized.
			 */
			if (new Date().getTime() - this.lastHit < this.downtime) { return; }

			/*
			 * The recordableFrame function returns true or false - by default based on the overall velocity of the hands and pointables in the frame.  
			 * 
			 * If it returns true recording should either start, or the current frame should be added to the existing recording.  
			 * 
			 * If it returns false AND we're currently recording, then gesture recording has completed and the recognition function should be 
			 * called to see what it can do with the collected frames.
			 * 
			 */
			if (this.recordableFrame(frame, this.minRecordingVelocity, this.maxRecordingVelocity)) {
				/*
				 * If this is the first frame in a gesture, we clean up some running values and fire the 'started-recording' event.
				 */
				if (!recording) { 
					
					recording 				= true; 
					frameCount 				= 0; 
					gesture 				= []; 
					this.renderableGesture 	= []; 
					this.recordedPoseFrames = 0;

					this.fire('started-recording'); 
				}

				/*
				 * We count the number of frames recorded in a gesture in order to check that the 
				 * frame count is greater than minGestureFrames when recording is complete.
				 */
				frameCount++;
	
				/*
				 * The recordFrame function may be overridden, but in any case it's passed the current frame, the previous frame, and 
				 * utility functions for adding vectors and individual values to the recorded gesture activity.
				 */
				this.recordFrame(frame, this.controller.frame(1), recordVector, recordValue);

				/*
				 * Since renderable frame data is not necessarily the same as frame data used for recognition, a renderable frame will be 
				 * recorded here IF the implementation provides one.
				 */
				this.recordRenderableFrame(frame, this.controller.frame(1));
				
			} else if (recording) {

				/*
				 * If the frame should not be recorded but recording was active, then we deactivate recording and check to see if enough 
				 * frames have been recorded to qualify for gesture recognition.
				 */
				recording = false;
				
				/*
				 * As soon as we're no longer recording, we fire the 'stopped-recording' event
				 */
				this.fire('stopped-recording');
	
				if (this.recordingPose || frameCount >= this.minGestureFrames) {

					/*
					 * If a valid gesture was detected the 'gesture-detected' event fires, regardless of whether the gesture will be recognized or not.
					 */
					this.fire('gesture-detected', gesture, frameCount);
					
					/*
					 * Finally we pass the recorded gesture frames to either the saveTrainingGesture or recognize functions (either of which may also 
					 * be overridden) depending on whether we're currently training a gesture or not.
					 * the time of the last hit.
					 */
					var gestureName = this.trainingGesture;

					if (gestureName) { this.saveTrainingGesture(gestureName, gesture, this.recordingPose);

					} else { this.recognize(gesture, frameCount); }

					this.lastHit = new Date().getTime();

					this.recordingPose 		= false;
				};
			};
			
		}; // The frame listener is bound to the context of the LeapTrainer object

		/**
		 * This is the frame listening function, which will be called by the Leap.Controller on every frame.
		 */
		this.controller.on('frame',	this.onFrame.bind(this)); 
		
		/*
		 * If pauseOnWindowBlur is true, then we bind the pause function to the controller blur event and the resume 
		 * function to the controller focus event
		 */
		if (this.pauseOnWindowBlur) {

			this.controller.on('blur',	this.pause.bind(this));
			this.controller.on('focus',	this.resume.bind(this)); 			
		}
	},
});

var leapController = new Leap.Controller();
leapController.use('screenPosition', {});
// var trainer = new LeapTrainer.ANNController();
var trainer = new LeapTrainer.MyController();
// trainer.fromJSON(swipe_left);
// trainer.fromJSON(swipe_right);
// trainer.fromJSON(stop1);
// trainer.fromJSON(stop2);
// trainer.fromJSON(stop3);
// trainer.fromJSON(stop4);
// trainer.fromJSON(stop5);
// trainer.on('SWIPE_LEFT', function() { 
// 	console.log('swipe-left');
// 	// chrome.runtime.sendMessage({"message": "go_forward_current_tab"});
// });
// trainer.on('SWIPE_RIGHT', function() { 
// 	console.log('swipe-right');
// 	// chrome.runtime.sendMessage({"message": "go_back_current_tab"});
// });

function stop_function() {
	console.log('stop');
	switch(currentHandArea) {
		// case UPPER_LEFT:
		// 	chrome.runtime.sendMessage({"message": "go_back_current_tab"});
		// 	break;
		// case UPPER_RIGHT:
		// 	chrome.runtime.sendMessage({"message": "go_forward_current_tab"});
		// 	break;
		// case LOWER_LEFT:

		// 	break;
		// case LOWER_RIGHT:
		// 	chrome.runtime.sendMessage({"message": "close_current_tab"});
		// 	break;
		// case CENTER:
		// 	// chrome.runtime.sendMessage({"message": "open_new_tab", "url": trainer.currentPointingHref});
		// 	if(currentPointingHref) {
		// 		// window.location.href = trainer.currentPointingHref;
		// 		currentPointingHref.click();
		// 	}
		// 	break;
	}
}

// trainer.on('STOP1', stop_function);
// trainer.on('STOP2', stop_function);
// trainer.on('STOP3', stop_function);
// trainer.on('STOP4', stop_function);
// trainer.on('STOP5', stop_function);
