$(function(){

    // this file is only for the UI and creating the cookies
    // the real logic is in the game.js where we extract the data from the cookies. 
    var settings = [
        'Timer',
        'Mistake Limit',
        'Mistakes Checker',
        'Hide Numbers',
        'Highlight Duplicates',
        'Highlight Area',
        'Highlight Identical',
    ]

// this creates the default styling for each button
    $('.setting_btn').each(function (i,obj){
        var val = getCookie(settings[i])

        // null is the default value --- so when cookies are not created the default is going to be "ON"
        if(val === 'on' || val === null){
            $(this).text('ON');
            $(this).css('background-color','rgb(32, 123, 255)');
            $(this).css('box-shadow','0 5px 15px 1px rgb(32, 123, 255)');
        }
        else{
            $(this).text('OFF');
            $(this).css('background-color','rgb(252, 78, 78)');
            $(this).css('box-shadow','0 5px 15px 1px rgb(252, 78, 78)');
        }
    });

// this part updates the settings and cookies based on the selection
    $('.setting_btn').on('click', function() {
        var caller = $(this);
        var d = new Date();
        d.setDate(d.getDate() + 7);

        // here we create cookies based on what's written between the html tag as text
        if(caller.text() === 'ON'){
            caller.text('OFF');
            caller.css('background-color','rgb(252, 78, 78)');
            caller.css('box-shadow','0 5px 15px 1px rgb(252, 78, 78)');
            setCookie(caller.val(), 'off', d.toUTCString());
        }
        else{
            caller.text('ON');
            caller.css('background-color','rgb(32, 123, 255)');
            caller.css('box-shadow','0 5px 15px 1px rgb(32, 123, 255)');
            setCookie(caller.val(), 'on', d.toUTCString());
        }
    });
})

/*



* */