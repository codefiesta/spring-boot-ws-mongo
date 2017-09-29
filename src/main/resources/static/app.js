
function DataBaseRef(path) {
  var path = null;
  var database = null;
  this.path = '';
};

DataBaseRef.prototype.child = function(path) {
    this.path = this.path + '/' + path;
    return this;
};

DataBaseRef.prototype.on = function(destination, callback) {

	this.destination = destination;
	var url = '/topic' + this.path + '/' + destination;
	
	console.log('🐳 Subscribing to ' + url)
	this.database.client.subscribe(url, function (message) {
		callback(message);
	});
  
	if (destination == 'list') {
		// Perform the loading
		url = '/db' + this.path + '/' + destination;
		
		console.log('📣 Initiating data [' + url + ']');
		this.database.client.send(url, {}, {});
	}
};

DataBaseRef.prototype.add = function(object) {
	
	var url = '/db' +  this.path + '/add';
	console.log('😀 Saving [' + object + ']: ' + url);
	this.database.client.send(url, {}, object);
}

DataBaseRef.prototype.remove = function(object) {
	
	var url = '/db' +  this.path + '/remove';
	console.log('😀 Removing [' + object + ']: ' + url);
	this.database.client.send(url, {}, object);
}


var Database = function(url) {

	var client = null;
	var endpoint = null;
	var connected = false;
	this.endpoint = url;
	
	return this;
};

Database.prototype.ref = function() {
	var ref = new DataBaseRef();
	ref.database = this;
	return ref;
};

Database.prototype.connect = function(callback) {
	
	if (!this.endpoint) {
		return
	}
	
    var socket = new SockJS(this.endpoint);
    this.client = Stomp.over(socket);
    
    this.client.connect({}, function (session) {
    	
		this.connected = true;
    		if (callback) {
    			console.log('📞');
        		callback(this.connected);
    		}
    });
};

Database.prototype.disconnect = function(callback) {
    if (this.client !== null) {
    		this.client.disconnect();
    }	
};

// Use the database
var database = null;
var users = null;

function addObservers() {

	users = database.ref().child('users');
	
	users.on('add', function(message) {
		console.log('📩 ADD: ' + message);
		var json = JSON.parse(message.body);
		addUser(json);
	});

	users.on('list', function(message) {
		console.log('📩 LIST: ' + message);
		var json = JSON.parse(message.body);
		for (var key in json) {
			addUser(json[key]);
		}
	});
	
	users.on('remove', function(message) {
		console.log('📩 REMOVE: ' + message);
		var json = JSON.parse(message.body);
		var selector = 'table#users-table tr#' + json.id;
		$(selector).remove();
	});

    $("#send").click(function() { 
    		var user = JSON.stringify({'name': $("#name").val()});
		users.add(user);
    });

}

function deleteUser(id) {
	
	var user = JSON.stringify({'id': id});
	users.remove(user);
}

function addUser(user) {
	var button = "<button onclick=\"deleteUser('" + user.id + "');\" class=\"btn btn-danger btn-delete\" type=\"submit\">Delete</button>";
	$("#user-rows").append("<tr id=\"" + user.id + "\"><td>" + user.id + "</td><td>" + user.name + "</td><td>" + button + "</td></tr>");
}

function setConnected(connected) {
	$("#connect").prop("disabled", connected);
	$("#disconnect").prop("disabled", !connected);
	if (connected) {
		$("#users-table").show();
	} else {
		$("#users-table").hide();
	}
	$("#user-rows").html("");
}


$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $("#connect").click(function() { 
    	
    });
    $("#disconnect").click(function() { 
    	
    });
        
    database = new Database('/example-ws');
    database.connect(function(connected) {
	    	if (connected) {
	    		addObservers();
	    	} else {
	    		console.log('Unable to connect!');
	    	}
    });
    
    
});


