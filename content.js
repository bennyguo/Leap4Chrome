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


var leapController = new Leap.Controller();
leapController.use('screenPosition', {});
// var trainer = new LeapTrainer.ANNController();
var trainer = new LeapTrainer.CorrelationController();
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