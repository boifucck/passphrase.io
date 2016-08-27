// Copyright (c) 2016 Daniel Routman - passphrase.io
// Licensed under the MIT license

(function($){
	//scrypt parameters
	var logN = 18;
	var r = 8;
	var L = 32;
	var step = 2048;  //iterations per step
	var salt = "passphrase.io";
	var scryptkey;
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
	                progress = parseFloat(progress);
	                progress = progress.toFixed(0);
	                quill.setText('generating your secret key: ' + progress + '%');
	            },
	            function(result) {
	            	quill.setText('generating your secret key: 100%');
	            	$('#progressbar').width('0');
	            	scryptkey = result;
		   			hash = CryptoJS.SHA256(result);
					hash = hash.toString();
					hash = pad(hash, 64);
					$.ajax({
						url: 'gettext.php',
						type: 'post',
						data: {'hash': hash},
						dataType: 'json',
						success: function(data) {
							if (data['text'] == null) {
								quill.setText('');
							}
							else {
								var version = data['version'];
								if (version == 0) { //decrypt using passphrase
									var decrypted = CryptoJS.AES.decrypt(data['text'],passphrase).toString(CryptoJS.enc.Utf8);
									quill.pasteHTML(decrypted.replace(/\n/g, "<br />"));
								}
								if (version == 1) { //decrypt using scrypt key
									var decrypted = CryptoJS.AES.decrypt(data['text'],scryptkey).toString(CryptoJS.enc.Utf8);
									quill.pasteHTML(decrypted);
								}
								if (version == 2) { //decrypt using scrypt key, quill v1.0
									var decrypted = CryptoJS.AES.decrypt(data['text'],scryptkey).toString(CryptoJS.enc.Utf8);
									quill.setContents(JSON.parse(decrypted));
									quill.focus();
								}
							}
							$('#button').html('loaded');
							$('#notepad').css('color','#000000');
							quill.enable(true);
						},
						error: function (data) {       
							$('#button').html('error');
							$('#button').css('color','#FF0000');
							quill.setText("Error loading notepad. Please try again.");
						}
					});
				},
	        "hex");
		}

		function saveText() {
			var contents = quill.getContents();
			var rawtext = JSON.stringify(contents);
			var length = quill.getLength();

			if (length > 32768) {
				alert('Your notepad exceeds the maximum size.\nPlease reduce the size of your notepad and try again.')
			}
			else {
				var encrypted = CryptoJS.AES.encrypt(rawtext, scryptkey);
				encrypted = encrypted.toString();

				$('#button').html('saving');
				$.ajax({
					url: 'savetext.php',
					type: 'post',
					data: {'hash': hash, 'text': encrypted, 'version': 2},
					success: function(data) {
						$('#button').html('saved');

					},
					error: function () {       
						$('#button').html('error');
						$('#button').css('color','#FF0000');
					}
				});	
			}
		}

		function imageHandler() {
			var range = this.quill.getSelection();
			var value = prompt('Enter image URL:');
			this.quill.insertEmbed(range.index, 'image', value);
		}

		function videoHandler() {
			var range = this.quill.getSelection();
			var value = prompt('Enter video URL:');
			this.quill.insertEmbed(range.index, 'video', value);
		}

		var toolbarOptions = [
			[{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
			['bold', 'italic', 'underline', 'strike', { 'align': [] }],        // toggled buttons
			[{ 'color': [] }, { 'background': [] }],
			[{ 'list': 'ordered'}, { 'list': 'bullet' }],
			[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
			['link', 'image', 'code-block'],
		];

		var quill = new Quill('#notepad', {
			modules: {
				syntax: true,
		    	toolbar: { 
		    		container: toolbarOptions,
		    		handlers: {
		    			image: imageHandler,
		    			video: videoHandler 
		    			/*
		    			'link': function(value) {
					    	if (value) {
					    		var href = prompt('Enter link URL');
					        	this.quill.format('link', href);
					      	} else {
					        	this.quill.format('link', false);
					      	}
					    }
					    */
		    		}
		    	}
		    },
		    theme: 'snow'
		});

		quill.enable(false);

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
			$('#home').hide();
			$('#notepad').show();
			var pk = secureRandom(32);
	        var seed = Crypto.util.bytesToHex(pk.slice(0,16));
	        //nb! electrum doesn't handle trailing zeros very well
	        if (seed.charAt(0) == '0') seed = seed.substr(1);
	        $('#passphrase').val(mn_encode(seed));
	        $('#button').html('load');
	        $('#button').css('color','#000000');
	        $('#notepad').css('color','#AAAAAA');
	        quill.setText('click load');
		});

		$('#passphrase').keypress(function(e) {
		    if(e.which == 13) { //enter
		    	var passphrase = $('#passphrase').val();
				passphrase = passphrase.toString();
				var label = $('#button').html();
				if (passphrase != "" && label != "loading") {
		        	$('#passphrase').blur();
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
				$('#home').show();
				$('#notepad').hide();
			}
			else {
				$('#button').css('color','#000000');
				$('#home').hide();
				$('#notepad').show();
			}
			quill.setText('hit enter to load');
			$('#notepad').css('color','#AAAAAA');
			quill.enable(false);
		});
		
		$('.ql-editor').keyup(function(){
			var label = $('#button').html();
			if (label == 'loaded' || label == 'saved' || label == 'error') {
				$('#button').html('save');
				$('#button').css('color','#000000');
			}
		});

		$('.ql-formats').click(function(){
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