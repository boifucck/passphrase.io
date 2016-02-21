// Copyright (c) 2016 Daniel Routman - passphrase.io
// Licensed under the MIT license

(function($){
	function hex2a(hexx) {
	    var hex = hexx.toString();
	    var str = '';
	    for (var i = 0; i < hex.length; i += 2)
	        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	    return str;
	}

	function getText() {
		var passphrase = $('#phrasetext').val();
		passphrase = passphrase.toString();

		//home page
		if (passphrase == "") {
			$('#save').css('color','#AAAAAA');
		}
		else {
			$('#save').css('color','#000000');
		}

		//run sha256 hash on passphrase
		var hash = CryptoJS.SHA256(passphrase);
		hash = hash.toString();

		//send data to server
		$.ajax({
			url: 'gettext.php',
			type: 'post',
			data: {'hash': hash},
			success: function(data) {
				if (data == "") {
					$('#notepadtext').val('');
				}
				else {
					var decrypted = CryptoJS.AES.decrypt(data, passphrase);
					decrypted = decrypted.toString();
					decrypted = hex2a(decrypted);
					$('#notepadtext').val(decrypted);
				}
				$('#save').val('save');
			},
			error: function () {
				$('#save').val('error');
			}
		});
	}

	$(document).ready(function(){
		var timer = null;

		$("#phrase").submit(function(event){
			event.preventDefault();
			$('#phrasetext').blur();
			getText();

		});	
		$("#phrase").keyup(function(){
			clearTimeout(timer);
			$('#save').val('loading...');
			var target = $(this);

			timer = setTimeout(function() {
				getText();	
			}, 200);
		});

		$("#notepad").submit(function(event){
			event.preventDefault();	

			var passphrase = $('#phrasetext').val();

			if (passphrase != "") {

				//get text
				var rawtext = $('#notepadtext').val();
				rawtext = rawtext.toString();

				//encrypt the text
				var encrypted = CryptoJS.AES.encrypt(rawtext, passphrase);
				encrypted = encrypted.toString();

				$('#save').val('saving...');

				//run sha256 hash on passphrase
				var hash = CryptoJS.SHA256(passphrase);
				hash = hash.toString();

				//send data to server
				$.ajax({
					url: 'savetext.php',
					type: 'post',
					data: {'hash': hash, 'text': encrypted},
					success: function(data) {
						console.log('save successful');
						$('#save').val('saved');

					},
					error: function () {
						$('#save').val('error');
					}
				});	
			} 

		});

		$("#notepad").keyup(function(){
			$('#save').val('save');
		});

		//initialize: show text for blank passphrase
		getText();
	});
})(jQuery);