// Copyright (c) 2016 Daniel Routman - passphrase.io
// Licensed under the MIT license

(function($){
	//scrypt parameters
	var logN = 18;
	var r = 8;
	var L = 32;
	var step = 2048;  //iterations per step
	var salt = "passphrase.io";
	var hash;

	function pad(s, size) {
		while(s.length < size) s = "0" + s;
		return s;
	}

	function getText() {
		$('#button').html('loading');
		$('#button').css('color','#AAAAAA');
		var passphrase = $('#passphrase').val();
		passphrase = passphrase.toString();

		scrypt(passphrase, salt, logN, r, L, step,
      		function(progress) {
                $('#progressbar').width(progress +'%');
            },
            function(result) {
            	$('#progressbar').width('100%');
	   			hash = CryptoJS.SHA256(result);
				hash = hash.toString();
				hash = pad(hash, 64);
				$.ajax({
					url: 'gettext.php',
					type: 'post',
					data: {'hash': hash},
					success: function(data) {
						if (data == "") {
							$('#notepad').val('');
						}
						else {
							var decrypted = CryptoJS.AES.decrypt(data,passphrase).toString(CryptoJS.enc.Utf8);
							$('#notepad').val(decrypted);
						}
						$('#button').html('loaded');
						$('#notepad').css('color','#000000');
						$("#notepad").prop("readonly", false);
					},
					error: function () {       
						$('#button').html('error');
					}
				});
			},
        "hex");
	}

	function saveText() {
		var passphrase = $('#passphrase').val();
		passphrase = passphrase.toString();

		if (passphrase != "") {
			var rawtext = $('#notepad').val();
			rawtext = rawtext.toString();
			rawtext = rawtext.substring(0,10000);
			var encrypted = CryptoJS.AES.encrypt(rawtext, passphrase);
			encrypted = encrypted.toString();
			$('#button').html('saving');
			$.ajax({
				url: 'savetext.php',
				type: 'post',
				data: {'hash': hash, 'text': encrypted},
				success: function(data) {
					console.log('save successful');
					$('#button').html('saved');

				},
				error: function () {       
					$('#button').html('error');
				}
			});	
		} 
	}

	$(document).ready(function(){

		$('#hide').click(function(){
			if ($('#passphrase').attr('type') == 'text') {
				$('#hide').html('[show passphrase]');
				$('#passphrase').attr('type', 'password');
			}
			else {
				$('#hide').html('[hide passphrase]');
				$('#passphrase').attr('type', 'text');
			}

		});

		$('#passphrase').keypress(function(e) {
		    if(e.which == 13) { //enter
		    	var passphrase = $('#passphrase').val();
				passphrase = passphrase.toString();
				var label = $('#button').html();
				if (passphrase != "" && label != "loading") {
		        	$('#passphrase').blur();
		        	$('#notepad').val('loading...');
		        	getText();
		        }
		    }
		});

		$('#passphrase').keyup(function(){
			var passphrase = $('#passphrase').val();
			passphrase = passphrase.toString();
			var label = $('#button').html();
			if (label != "loading") {
				$('#button').html('load');
			}
			if (passphrase == "") {
				$('#button').css('color','#AAAAAA');
			}
			else {
				$('#button').css('color','#000000');
			}
			$('#notepad').val('hit enter to load');
			$('#notepad').css('color','#AAAAAA');
			$("#notepad").prop("readonly", true);
		});

		$('#notepad').keyup(function(){
			var label = $('#button').html();
			if (label == 'loaded' || label == 'saved' || label == 'error') {
				$('#button').html('save');
				$('#button').css('color','#000000');
			}
		});

		$('#button').click(function(){
			var passphrase = $('#passphrase').val();
			passphrase = passphrase.toString();
			var label = $('#button').html();
			label = label.toString();
			if (label == "load" && passphrase != "") {
				getText();
			}
			if (label == "save") {
				saveText();
			}
		});	

	});
})(jQuery);