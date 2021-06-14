/*********************************************
* Short Link using Bitly
*********************************************/
function ShortLinkBitly( pLongUrl ) { /*pLongUrl is the long URL*/
     
    /*Long URL must start with a protocol, bitly can't (and won't) figure out the right protocol.*/
    if ( !pLongUrl.match(/(ftp|http|https):\/\//i) ) {
        return "Error: Link must start with a protocol (e.g.: http or https).";
    }
 
    var apiKey = 'R_a4c2ace21cc44834b3b851963012fa47';
    var username = 'remotepixel';
     
    /*Ajax call*/
    
    $.ajax(
    {
        url: 'https://api-ssl.bitly.com/v3/shorten?login=' + username + '&apiKey=' + apiKey + '&format=json&longUrl=' + encodeURIComponent(pLongUrl),
        dataType: 'jsonp',
        success: function( response ) {
            if ( response.status_code == 500) {
                 
                /*500 status code means the link is malformed.*/
                return "Error: Invalid link.";
 
            } else if ( response.status_code != 200) {
                 
                /*If response is not 200 then an error ocurred. It can be a network issue or bitly is down.*/
                return "Error: Service unavailable.";
                 
                /*Uncomment the following line only for debugging purposes*/
                /*console.log('Response: ' + response.status_code + '-' + response.status_txt);*/
            }
            else
                return response.data.url; /* OK, return the short link */
        },
         
        contentType: 'application/json'
    });
}

function ShortLinkBitly_and_Tweet( pLongUrl ) { /*pLongUrl is the long URL*/
    
    /*Long URL must start with a protocol, bitly can't (and won't) figure out the right protocol.*/
    if ( !pLongUrl.match(/(ftp|http|https):\/\//i) ) {
        return "Error: Link must start with a protocol (e.g.: http or https).";
    }
 
    var apiKey = 'R_a4c2ace21cc44834b3b851963012fa47';
    var username = 'remotepixel';
     
    /*Ajax call*/
    
    $.ajax({
        url: 'https://api-ssl.bitly.com/v3/shorten?login=' + username + '&apiKey=' + apiKey + '&format=json&longUrl=' + encodeURIComponent(pLongUrl),
        dataType: 'jsonp',
        success: function( response ) {
            if ( response.status_code == 500) {
                 
                /*500 status code means the link is malformed.*/
                return "Error: Invalid link.";
 
            } else if ( response.status_code != 200) {
                 
                /*If response is not 200 then an error ocurred. It can be a network issue or bitly is down.*/
                return "Error: Service unavailable.";
                 
                /*Uncomment the following line only for debugging purposes*/
                /*console.log('Response: ' + response.status_code + '-' + response.status_txt);*/
            }
            else
 
                return response.data.url; /* OK, return the short link */
        },
         
        contentType: 'application/json'
    });
};

/* END: Short Link using Bitly */
