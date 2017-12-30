chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		let activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
	});
});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.message) {
			case "open_new_tab":
				chrome.tabs.create({"url": request.url});
			case "close_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.remove(activeTab.id);
				});
			case "reload_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.reload(activeTab.id);
				});
			case "zoom_in_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.getZoom(activeTab.id, function(current_zoom) {
						let new_zoom = current_zoom + 0.1;
						if(new_zoom < 2)
							chrome.tabs.setZoom(activeTab.id, new_zoom);
					});
				});
			case "zoom_out_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.getZoom(activeTab.id, function(current_zoom) {
						let new_zoom = current_zoom - 0.1;
						if(new_zoom > 0.5)
							chrome.tabs.setZoom(activeTab.id, new_zoom);
					});
				});
			case "go_back_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.executeScript(activeTab.id, {
						code: 'history.back()'
					});
				});
			case "go_forward_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.executeScript(activeTab.id, {
						code: 'history.forward()'
					});
				});
			case "scroll_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					// use window.scrollBy(dx, dy);
					chrome.tabs.executeScript(activeTab.id, {
						code: 'window.scrollBy(0, 100)'
					});
				});
		}
	}
);