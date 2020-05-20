/*
---------------------
Copyright © Serdar Soy
---------------------
*/

var STRINGS= {
	'title':chrome.i18n.getMessage("extName")
};

var initTryCount=0;

var instanceCount=0;
var instancesArray=new Array();

var checkThingsInterval=null;
var saveListScrollPositionInterval=null;


var INIT_TRY_DELAY = 1000;
var CHECK_THINGS_DELAY=5000;
var MAX_INIT_TRY_COUNT=5;

var STORAGE_PREFIX = 'TWEEPLIST_v01_';
var STORAGE_LIST_ITEM_SPLIT = 20;

var MAX_LIST_ITEMS = 100;

var DELETE_DRAG_OFFSET = 12;

var LIST_ITEM_HEIGHT = 46;

var LIST_ITEM_PADDING = 12;
var DEFAULT_MENU_HEIGHT = 406;

var initExtensionInterval;


setTimeout(function(){
	initExtension();
}, 100);



function initExtension() {

	console.log('tweeplist init');
	
	
	if ($('.dashboard, .ProfileWTFAndTrends, .stream-container, .css-1dbjc4n.r-1l5qxre.r-m611by').length==0) {
	
		initTryCount++;
		if (initTryCount < MAX_INIT_TRY_COUNT) {
			initExtensionInterval=setTimeout(initExtension, INIT_TRY_DELAY);
		}
		return;
	}
	
	instancesArray[instanceCount]=new TweepList(instanceCount);
	
	
	
	checkThingsInterval=setTimeout(function() {
		checkThings('slow');
	}, CHECK_THINGS_DELAY);
	

}

function TweepListItem (userName, avatarUrl, userId) {
	this.userId = userId;
	this.userName = userName;
	this.avatarUrl = avatarUrl;
}

function TweepListStorage(myTweepList, userId, userName) {
	
	this.userId = userId;
	this.userName = userName;
	this.listItems = new Array();
	this.storageName = STORAGE_PREFIX + this.userId;
	this.myTweepList = myTweepList;
	
	this.menuHeight = DEFAULT_MENU_HEIGHT;
	this.menuFixedFlag = false;
	this.menuScrollTop = 0;
	
	this.listSliceCount = MAX_LIST_ITEMS/STORAGE_LIST_ITEM_SPLIT;
	
	TweepListStorage.prototype.saveToStorage = function() {
		var data = {
			userId : this.userId
			,userName : this.userName
			,totalListItems : this.listItems.length
			,menuFixedFlag: this.menuFixedFlag
			,menuHeight: this.menuHeight
			,menuScrollTop: this.menuScrollTop
		};
		
		
		
		
		
		
		var dataObj = {};
		dataObj[this.storageName+'_main'] = data;
		
		
		
		//slice the items array to fit Chrome storage's single item size limit
		var listItemsLength = this.listItems.length;
		var listItemSlices = new Array();
		
		for (var i=0; i < this.listSliceCount; i++) {
			var tempArray = this.listItems.slice(i*STORAGE_LIST_ITEM_SPLIT, (i+1)*STORAGE_LIST_ITEM_SPLIT);
			dataObj[this.storageName+'_list_'+i] = JSON.stringify(tempArray);
		}
		chrome.storage.sync.set(dataObj);
		
		
	};
	
	TweepListStorage.prototype.deleteListItem = function(itemIndex) {
	
		
		this.listItems.splice(itemIndex, 1);
		
		
		
		this.saveToStorage();
		
	};
	
	TweepListStorage.prototype.moveListItem = function(startIndex, endIndex) {
		
		
		var item = this.listItems[startIndex];
		this.listItems.splice(startIndex, 1);
		this.listItems.splice(endIndex, 0, item);
		
		this.saveToStorage();
	
	};
	
	TweepListStorage.prototype.hasItem = function(item) {
		var len = this.listItems.length;
		
		for (var i=0; i<len; i++) {
			if (this.listItems[i].userId == item.userId) {
				return true;
			}
		}
		
		return false;
	
	};
	
	TweepListStorage.prototype.getItemIndex = function(userId) {
		var len = this.listItems.length;
		
		for (var i=0; i<len; i++) {
			if (this.listItems[i].userId == userId) {
				return i;
			}
		}
		
		return false;
	};
	
	TweepListStorage.prototype.getTotalListItems = function() {
		return this.listItems.length;
	}
	
	
	
	
	//get data from storage
		var self = this;
		
		var storageKeys = new Array(
			this.storageName+'_main'
		);
		for (var i=0; i < this.listSliceCount; i++) {
			storageKeys.push(this.storageName+'_list_'+i);
		}
		
		chrome.storage.sync.get(storageKeys, function(result){
			var storageName = self.storageName;
			
			
			if (result && result[storageName+'_main']) {
				
				//merge list item slices into one array
				for (var i=0; i < self.listSliceCount; i++) {
					
					if (result[storageName+'_list_'+i]) {
						var tempArray = JSON.parse(  result[storageName+'_list_'+i] );
						if (tempArray.length) {
							self.listItems.push.apply(self.listItems, tempArray);
						}
					}
				
				}
				
				//set menuFixedFlag
				self.menuFixedFlag = result[storageName+'_main'].menuFixedFlag;
				self.menuHeight = result[storageName+'_main'].menuHeight;
				self.menuScrollTop = result[storageName+'_main'].menuScrollTop;
				
				
				
				
				
			}
			else {
				
				self.saveToStorage();
			}
			
			self.myTweepList.initTweepList(false);
			
		});
	
}

function addToStorage(userStorage, tweepListItem, targetIndex) {
	
	userStorage.listItems.splice(targetIndex, 0, tweepListItem);
	
	userStorage.saveToStorage();
	
}

function deleteFromStorage(userStorage, itemIndex) {
	userStorage.deleteListItem(itemIndex);
}


function generateItem(item) {
	return $('<a class="tweepListItem js-nav menuItem" title="'+item.userName+'" href="/'+item.userName+'"><img class="avatar" src="'+item.avatarUrl+'" alt=""></a>');
}

function generateListItems(listItems, menuId) {
	
	for (var i = 0; i < listItems.length; i++) {
		//if (!listItems[i]) { continue; }
		$('#'+menuId+' .tweepAvatars').append('<a class="tweepListItem js-nav menuItem" title="'+listItems[i].userName+'" href="/'+listItems[i].userName+'"><img class="avatar" src="'+listItems[i].avatarUrl+'" alt=""></a>');
	}
	
}

function setMenuFixedType(menuId, menuFixedFlag) {
	
	var menuFixedButton = $('.menuFixToggle');

	if (menuFixedFlag == true) {
		menuFixedButton.attr('title','unpin menu');
		$('#' + menuId +' .menuContainer').addClass('fixed');
		$('.menuFixToggle').addClass('fixed');
	}
	else {
		menuFixedButton.attr('title','pin menu');
		$('#' + menuId +' .menuContainer').removeClass('fixed');
		$('.menuFixToggle').removeClass('fixed');
	}

}

function TweepList(instanceIndex) {
	
	var menuId;
	var diffHeightForResize;
	var userName;
	var userId;
	var tweepMenuHTML;
	
	
	this.userStorage;
	
	
	
	//get storage object
	userId = $('.js-mini-current-user').attr('data-user-id');
	userName = $('.js-mini-current-user').attr('data-screen-name');
	this.userStorage = new TweepListStorage(this, userId, userName);
	
	menuId = 'tweepList_Menu_' + instanceIndex;
	
	
	
  tweepMenuHTML =
  		'<div class="module tweepList_Menu_Class css-1dbjc4n r-1uaug3w r-1uhd6vh r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x" id="'+menuId+'"><div class="flex-module">'
  	+		'<div class="menuContainer"><div class="inner">'
  	+		'<div class="css-1dbjc4n r-1ila09b r-rull8r r-qklmqi r-1wtj0ep r-1j3t67a r-1w50u8q"><h2 class="css-1dbjc4n r-1sp7lne r-1vr29t4 r-1b6yd1w r-jwli3a r-1qd0xha r-ad9z0x">Tweep list</h2> · <a class="btn-link about-link css-4rbku5 css-18t94o4 css-901oao r-111h2gw r-1loqt21 r-1qd0xha r-n6v787 r-16dba41 r-1sf4r6n r-hrzydr r-bcqeeo r-1qfoi16 r-qvutc0" href="http://serdar.work">About</a></div>'
  	+			'<div class="tweepAvatars"></div>'
  	+		'</div></div>'
  	+	'</div></div>'
  ;
	
	
	
	
	
	var self = this;
	
	//init
	TweepList.prototype.initTweepList = function (refreshFlag) {
		
		
		
		if (refreshFlag == false) {
		
			////////////
			
			
			
			
			
			
			var targetContainer = false;
			
			if ($('.dashboard-right').length) {
				targetContainer = $('.dashboard-right');
			}
			else if ($('.ProfileWTFAndTrends').length) {
				targetContainer = $('.ProfileWTFAndTrends');
			}
			else if ($('.ProfileSidebar .MoveableModule .SidebarCommonModules').length) {
				targetContainer = $('.ProfileSidebar .MoveableModule .SidebarCommonModules');
			}
      else if ($('.css-1dbjc4n.r-1l5qxre.r-m611by').length) {
        console.log('found');
        targetContainer = $('.css-1dbjc4n.r-1l5qxre.r-m611by');
      }
      
      
			if (targetContainer == false) {
				return false;
			}
			
      // r-1h3ijdo
      console.log(">>" + targetContainer.find('.css-1dbjc4n.r-1h3ijdo').length);
      var spacer = targetContainer.find('.r-1h3ijdo').eq(1);
      spacer.after(tweepMenuHTML);
      // targetContainer.prepend(tweepMenuHTML);
			
			
			
			////////////
		
			//setup initial layout
			
			//$("#page-container").wrapInner('<div class="tweepList_PageContainer" />');
			
			
			//var pageContainerWidth = $("#page-container").width();
			
			
			//$('#page-container').append(tweepMenuHTML);
			
			
			
		
		}
		
		diffHeightForResize = $('#' + menuId + ' .menuContainer .inner').height() - $('.tweepAvatars').height();
		
		setMenuFixedType(menuId, this.userStorage.menuFixedFlag);
	
		//$('.menuContainer .inner').height(this.userStorage.menuHeight);
		//$('.tweepAvatars').height($('.menuContainer .inner').height() - diffHeightForResize);
		
		
		
		$('#'+menuId+' .tweepAvatars').empty();
		generateListItems(this.userStorage.listItems, menuId);
		
		
	
		$('.tweepAvatars').scrollTop(this.userStorage.menuScrollTop);
		
		
		
		addSortableToList(menuId, this.userStorage);
		addEventsToAvatars();
		
		//js-nav links handler
		$('.js-nav').on('click',function(){
			
			
			clearTimeout(checkThingsInterval);
			
			
			
			checkThings('fast');
			
			
		});
		
		
		//fix menu button handler
		$('.menuFixToggle').on('click',function(){
			
			self.userStorage.menuFixedFlag = !self.userStorage.menuFixedFlag;
			
			setMenuFixedType(menuId, self.userStorage.menuFixedFlag);
			
			self.userStorage.saveToStorage();
			
			
		});
	
	
		//UP DOWN BUTTONS
		$('#' + menuId + ' .scrollArrow').bind('click', function(e){
			
			var direction = ( $(this).hasClass('up') ) ? 'up' : 'down';
			
			if (scrollListCheck(direction) == false) {
				return false;
			}
			
			var step;
			var currentScroll = $('.tweepAvatars').scrollTop();
			
			switch (direction) {
				case 'up':
					step = -LIST_ITEM_HEIGHT;
				break;
				
				case 'down':
					step = LIST_ITEM_HEIGHT;
				break;
			}
			
			$('.tweepAvatars').animate(
				{ scrollTop: currentScroll + step }
				,100
			);
			
			self.userStorage.menuScrollTop = currentScroll + step;
			self.userStorage.saveToStorage();
			
			return false;
		});
		
		
		//mousewheel
		$('#' + menuId + ' .menuContainer').bind('mousewheel', function(event, delta, deltaX, deltaY) {
			
			
			if (deltaY < 0) {
				if (scrollListCheck('down')) {
					scrollList('down');
				}
			}
			else {
				if (scrollListCheck('up')) {
					scrollList('up');
				}
			}
			
			//save scroll position after a little delay
			clearTimeout($.data(this, 'timer'));
			$.data(this, 'timer', setTimeout(function() {
				
				
				self.userStorage.menuScrollTop = $('.tweepAvatars').scrollTop();
				self.userStorage.saveToStorage();
				
				
			}, 500));		
			
			
			return false;
		});
		
		//resize handle
		$('#' + menuId + ' .menuContainer .inner').resizable({
			handles: { 's': '#menuResizeHandle' }
			,start: function( event, ui ) {
				
			}
			,resize: function( event, ui ) {
				$('.tweepAvatars').height(ui.size.height-diffHeightForResize);
			}
			,stop: function(e,ui) {
				
				self.userStorage.menuHeight = ui.size.height;
				self.userStorage.saveToStorage();
			
			}
		
		});	
	
	
	};
	
	
		
}


//no scroll validity checks made here
function scrollList(direction) {
	var step;
	
	
	
	switch (direction) {
		case 'up':
			step = -LIST_ITEM_HEIGHT;
		break;
		
		case 'down':
			step = LIST_ITEM_HEIGHT;
		break;
	}
	
	var currentScroll = $('.tweepAvatars').scrollTop();
	var newScroll = currentScroll + step;
	
	$('.tweepAvatars').scrollTop(newScroll);
	

	
	
	
}

function saveListScrollPosition(scrollPosition) {
	
	clearTimeout(saveListScrollPositionInterval);
	
	
	
}

function scrollListCheck(direction) {
	
	var currentScroll = $('.tweepAvatars').scrollTop();
	
	var listHeight = $('.tweepAvatars').height();
	var listItemCount = $('.tweepAvatars .tweepListItem').length;
	
	var allItemsHeight = listItemCount * LIST_ITEM_HEIGHT - LIST_ITEM_PADDING;
	
	if (allItemsHeight <= listHeight) {
		
		return false;
	}
	
	if (direction == 'up' && currentScroll == 0) {
		
		return false;
	}
	
	if (direction == 'down' && currentScroll + listHeight == allItemsHeight) {
		
		return false;
	}
	
	//a scroll is valid, return true
	return true;
	
}


function getDataFromAvatar(currentItem, ui) {
	
	var userId = false;
	var userName = false;
	var userAvatarUrl = false;
	
	//avatar url
	if (ui.item[0].src === undefined) {
		return false;
	}
	userAvatarUrl = ui.item[0].src;
	
	
	
	
	//avatar on profile header
	if (ui.sender.parent().parent().hasClass('profile-header-inner')) {
		
		userId = ui.sender.parent().parent().find('.profile-card-inner').attr('data-user-id');
		userName = ui.sender.parent().parent().find('.profile-card-inner').attr('data-screen-name');
		
		
		
	}
	else if(ui.sender.parent().attr('data-user-id') !== undefined) {
		userId = ui.sender.parent().attr('data-user-id');
		userName = ui.sender.parent().attr('href').substring(1);
	}
	else {
		userId = ui.sender.attr('data-user-id');
		userName = ui.sender.parent().attr('href').substring(1);
	}
	
	if (ui.sender.hasClass('ProfileCard-avatarImage')){
		userId = ui.sender.parent().parent().find('.ProfileCard-actions .user-actions').attr('data-user-id');
	}
	
	
	if (userId == false || userName == false || userId == '' || userName == '' || userId === undefined || userName === undefined) {
		return false;
	}
	
	return new TweepListItem(userName, userAvatarUrl, userId);
	
}



function addSortableToList(menuId, userStorage) {
	
	var startIndex = -1;
	
	$( '#'+menuId+' .tweepAvatars' ).sortable({
		appendTo: 'body'
		,start: function(e, ui) {
			startIndex = ui.item.index();
		}
		,receive: function( event, ui ) {
			
			sortableIn = 1;
			var userName = ui.sender.parent().find('.username b').html();
			var userAvatarUrl = ui.item[0].src;
			
			var currentItem = $(this).data().uiSortable.currentItem;
			
			
			
			var newTweepListItem = getDataFromAvatar(currentItem, ui);
			
			if (newTweepListItem == false) {
				
				currentItem.remove();
				return;
			}
			
			//check if this item exists
			var oldItemIndex = userStorage.getItemIndex(newTweepListItem.userId);
			if ( oldItemIndex !== false ) {
				
				
				//delete the old one
				$('.tweepAvatars .tweepListItem').eq(oldItemIndex).remove();
				
				deleteFromStorage(userStorage, oldItemIndex);
			}
			else {
				// check for max list items
				if (userStorage.getTotalListItems() == MAX_LIST_ITEMS) {
					
					currentItem.remove();
					return;
				}
			}
			
			//add new item
			var newElement = new generateItem(newTweepListItem);
			
			
			newElement.insertAfter(currentItem).hide();
			currentItem.remove();
			newElement.show();
			
			var newElementIndex = newElement.index();
			
			addToStorage(userStorage, newTweepListItem, newElementIndex);
			
		}
		,over: function(e, ui) { sortableIn = 1; }
		,out: function(e, ui) { sortableIn = 0; }
		,beforeStop: function(e, ui) {
			
			
			var currentItem = $(this).data().uiSortable.currentItem;
			var itemIndex = currentItem.index();
			
			
			if (currentItem.hasClass('tweepListItem') == false) {
				
				return;
			}
			
			
			
			if (sortableIn == 0) { 
				
				
				if (outFarEnoughToDelete(ui, $('.menuContainer .inner')) ) {
					
					
					
					
					deleteFromStorage(userStorage, itemIndex);
					
					currentItem.remove();
					
					
				}	
				
			}
			else if (startIndex != itemIndex) {
				
				userStorage.moveListItem(startIndex, itemIndex);
				
				
				
				//adjust scroll
				var currentScroll = $('.tweepAvatars').scrollTop();
				var newScroll = Math.floor(currentScroll/LIST_ITEM_HEIGHT)*LIST_ITEM_HEIGHT;
				$('.tweepAvatars').scrollTop(newScroll);
				
				
				
				
			}
			
		}
		
		
		
		
	});
	
	
	

}




function outFarEnoughToDelete(ui, container) {
	
	var objectLeft = ui.offset.left;
	var objectTop = ui.offset.top;
	var objectRight = objectLeft + ui.item.width();
	var objectBottom = objectTop + ui.item.width();
	
	var containerLeft = container.offset().left;
	var containerTop = container.offset().top;
	var containerRight = container.offset().left + container.width();
	var containerBottom = container.offset().top + container.height();
	
	
	if (objectLeft > containerRight+DELETE_DRAG_OFFSET || objectRight < containerLeft-DELETE_DRAG_OFFSET) {
		return true;
	}
	
	if (objectTop > containerBottom+DELETE_DRAG_OFFSET || objectBottom < containerTop-DELETE_DRAG_OFFSET) {
		return true;
	}
	
	return false;

}


function addAvatarEvents(container) {
	
	var thisAvatar = container;
	
	
	
	// if(!thisAvatar) {
//     return;
//   }
	
	if (thisAvatar.parent().hasClass('tweepListItem')) {
		return false;
	}
	
  
	var self = thisAvatar;
	
	
	thisAvatar.draggable({
		helper: 'clone'
		,appendTo: 'body'
		,connectToSortable: '#tweepList_Menu_0 .tweepAvatars'
		,stack: 'img'
		,revert: 'invalid'
		,scroll: true

		,stop: function( event, ui ) {
		
		}
		,start: function(e,ui) {
			
			
			
			ui.helper.removeClass('js-tooltip');
			ui.helper.css({
				zIndex: 9999,
				float: 'left',
        width: '49px',
        height: '49px'
				
			});
			
			self.addClass('menuItem avatar');
			
		}
		
	});
	
	thisAvatar.off('mouseover.tweepListDrag');
	
}


function addEventsToAvatars() {
	

  
	$('body').on('mouseover.tweepListDrag', '.css-1dbjc4n.r-18kxxzh.r-1wbh5a2.r-13qz1uu', function(e){
		
		addAvatarEvents($(this));
		
	});
	
	
	$('#page-container').on('mouseover.tweepListDrag', '.tweet, .UserSmallListItem', function(e){
		
		addAvatarEvents($(this));
		
	});
	
}


function checkThings(speed) {
	
	
	var checkInterval;
	
	if (speed=='fast') {
		checkInterval = 200;
	}
	else {
		checkInterval = CHECK_THINGS_DELAY;
	}
	
	if (!$('.tweepList_Menu_Class').length) {
		
		
		
		if ( $('.dashboard-right').length || $('.ProfileWTFAndTrends').length || $('.ProfileSidebar .MoveableModule .SidebarCommonModules').length ) {
			
			
			
			// TO DO
			// check if there is a #tweepList_Menu_0 to remove exists actually here
			
			
			$('#tweepList_Menu_0').remove();
		
			instancesArray[0]=new TweepList(instanceCount);
			speed = 'slow';
			
		}
		else {
			
		}
		
	}
	else if ($( '#tweepList_Menu_0'+' .tweepAvatars' ).data('uiSortable') === undefined) {
		
		
		
		instancesArray[0].initTweepList(true);
		
		speed = 'slow';
	}
	

	
	
	checkThingsInterval=setTimeout(function() {
		checkThings(speed);
	}, checkInterval);
	
}

	
//temp test function
function markArea(ui, container) {

	var objectLeft = ui.offset.left;
	var objectTop = ui.offset.top;
	var objectRight = objectLeft + ui.item.width();
	var objectBottom = objectTop + ui.item.width();
	
	var containerLeft = container.offset().left;
	var containerTop = container.offset().top;
	var containerRight = container.offset().left + container.width();
	var containerBottom = container.offset().top + container.height();
	
	

	$('#page-outer .markedArea').remove();
	var markedArea = $('<div class="markedArea" style="background:#f00; position:absolute; opacity:0.5;"></div>');
	
	
	
	markedArea.css({
	left: (containerLeft-DELETE_DRAG_OFFSET) + 'px'
	,top: (containerTop-DELETE_DRAG_OFFSET) + 'px'
	,width: (container.outerWidth()+DELETE_DRAG_OFFSET*2) + 'px'
	,height: (container.height()+DELETE_DRAG_OFFSET*2) + 'px'
	,zIndex: '-10'
	});
	
	
	markedArea.prependTo('#page-outer').hide().fadeIn();


}
	



