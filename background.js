chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		let activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
	});
});

chrome.tabs.onActivated.addListener(function(info) {
	chrome.tabs.sendMessage(info.tabId, {'message': 'reset comparator'});
})

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.message) {
			case "open_new_tab":
				if(request.url)
					chrome.tabs.create({"url": request.url});
				break;
			case "close_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.remove(activeTab.id);
				});
				break;
			case "reload_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.reload(activeTab.id);
				});
				break;
			case "zoom_in_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.getZoom(activeTab.id, function(current_zoom) {
						let new_zoom = current_zoom + 0.1;
						if(new_zoom < 2)
							chrome.tabs.setZoom(activeTab.id, new_zoom);
					});
				});
				break;
			case "zoom_out_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.getZoom(activeTab.id, function(current_zoom) {
						let new_zoom = current_zoom - 0.1;
						if(new_zoom > 0.5)
							chrome.tabs.setZoom(activeTab.id, new_zoom);
					});
				});
				break;
			case "go_back_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.executeScript(activeTab.id, {
						code: 'history.back()'
					});
				});
				break;
			case "go_forward_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					chrome.tabs.executeScript(activeTab.id, {
						code: 'history.forward()'
					});
				});
				break;
			case "scroll_up_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					// console.log(tabs);
					// use window.scrollBy(dx, dy);
					chrome.tabs.executeScript(activeTab.id, {
						code: `window.scrollBy(0, -${request.speed})`
					});
				});
				break;
			case "scroll_down_current_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTab = tabs[0];
					// use window.scrollBy(dx, dy);
					chrome.tabs.executeScript(activeTab.id, {
						code: `window.scrollBy(0, ${request.speed})`
					});
				});
				break;
			case "choose_left_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTabIndex = tabs[0].index;
					chrome.tabs.query({currentWindow: true}, function(tabs) {
						let idx = (activeTabIndex - 1) + (activeTabIndex == 0) * (tabs.length);
						let tabToActive = tabs[idx];
						chrome.tabs.update(tabToActive.id, {active: true});
					});
				});
				break;
			case "choose_right_tab":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					let activeTabIndex = tabs[0].index;
					chrome.tabs.query({currentWindow: true}, function(tabs) {
						let idx = (activeTabIndex + 1) % (tabs.length);
						let tabToActive = tabs[idx];
						chrome.tabs.update(tabToActive.id, {active: true});
					});
				});
				break;
		}
	}
);