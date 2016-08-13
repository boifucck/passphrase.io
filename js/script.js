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

	$(document).ready(function(){

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
	            	$('#progressbar').width('0');
		   			hash = CryptoJS.SHA256(result);
					hash = hash.toString();
					hash = pad(hash, 64);
					$.ajax({
						url: 'gettext.php',
						type: 'post',
						data: {'hash': hash},
						success: function(data) {
							if (data == "") {
								quill.setHTML('');
							}
							else {
								var decrypted = CryptoJS.AES.decrypt(data,passphrase).toString(CryptoJS.enc.Utf8);
								quill.setHTML(decrypted.replace(/\n/g, "<br />"));
							}
							$('#button').html('loaded');
							$('#notepad').css('color','#000000');
							quill.editor.enable();
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
				var rawtext = quill.getHTML();

				rawtext = rawtext.substring(0,32768);

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

		var quill = new Quill('#notepad', {
			modules: {
			    'link-tooltip': true,
			    'image-tooltip': true,
			},
			styles: {
				'.ql-container': {
					'font-size': "16px"
			    }
			},
			theme: 'snow'
		});

  		quill.addModule('toolbar', { container: '#toolbar' });

  		quill.editor.disable();

		$('.hide').click(function(){
			if ($('#passphrase').attr('type') == 'text') {
				$('#hide-normal').html('show passphrase');
				$('#hide-mobile').html('show');
				$('#passphrase').attr('type', 'password');
			}
			else {
				$('#hide-normal').html('hide passphrase');
				$('#hide-mobile').html('hide');
				$('#passphrase').attr('type', 'text');
			}

		});

		$('#random').click(function(){
			var pk = secureRandom(32);
	        var seed = Crypto.util.bytesToHex(pk.slice(0,16));
	        //nb! electrum doesn't handle trailing zeros very well
	        if (seed.charAt(0) == '0') seed = seed.substr(1);
	        $('#passphrase').val(mn_encode(seed));
	        $('#button').html('load');
	        $('#button').css('color','#000000');
	        $('#notepad').css('color','#AAAAAA');
	        quill.setHTML('click load');
		});

		$('#passphrase').keypress(function(e) {
		    if(e.which == 13) { //enter
		    	var passphrase = $('#passphrase').val();
				passphrase = passphrase.toString();
				var label = $('#button').html();
				if (passphrase != "" && label != "loading") {
		        	$('#passphrase').blur();
		        	quill.setHTML('loading...');
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
			quill.setHTML('hit enter to load');
			$('#notepad').css('color','#AAAAAA');
			quill.editor.disable();
		});

		$('#notepad').keyup(function(){
			var label = $('#button').html();
			if (label == 'loaded' || label == 'saved' || label == 'error') {
				$('#button').html('save');
				$('#button').css('color','#000000');
			}
		});

		$('.ql-size, .ql-format-button').click(function(){
			var label = $('#button').html();
			if (label == 'loaded' || label == 'saved' || label == 'error') {
				$('#button').html('save');
				$('#button').css('color','#000000');
			}
		});

		$('.ql-font, .ql-size, .ql-color, .ql-background, .ql-align').change(function(){
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