$(document).ready(async function() {
    // Initialize like and dislike counts from local storage if available
    const idInput = document.querySelector('#parkingId')
    
    const res = await fetch(`http://localhost:3000/api/feedback/${idInput.value}`)
    const parkingStat = await res.json() 
    console.log(parkingStat);
    let likeCount = parkingStat.likes? parkingStat.likes: 0;
    let dislikeCount = parkingStat.dislikes? parkingStat.dislikes: 0;
    let latestTimestamp = parkingStat.latestFeedbackTime ? parkingStat.latestFeedbackTime : null;

    function updateMeter() {
        const total = likeCount + dislikeCount;
        let likePercentage = 50;
        let dislikePercentage = 50;

        if (total > 0) {
            likePercentage = (likeCount / total) * 100;
            dislikePercentage = (dislikeCount / total) * 100;
        }

        $('#green').css('width', `${likePercentage}%`);
        $('#red').css('width', `${dislikePercentage}%`);
    }

    function updateTimestampUI(timestamp) {
        if (timestamp) {
            $('#timestamp').text(`Last feedback at: ${new Date(timestamp).toLocaleString()}`);
        } else {
            $('#timestamp').text('No feedback yet.');
        }
    }

    function updateLocalStorage() {
        localStorage.setItem('likeCount', likeCount);
        localStorage.setItem('dislikeCount', dislikeCount);
    }

    function showSaveParkingPrompt(){
        $('#location-prompt').show();
    }

    async function saveParkingLocation(){
        navigator.geolocation.getCurrentPosition(async function(position){
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const parkingId = idInput.value;

            console.log('Vehicle Location: ', { parkingId, latitude, longitude});

            try{
                const payload = { parkingId, latitude, longitude };
                const response = await fetch('http://localhost:3000/api/save-parking-location',{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok){
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Parking location saved:', result);
                $('#location-prompt').hide();
            } catch(error){
                console.error('Error saving location:', error);
                alert('Failed to save Parking location.' + error.message);
            }
            }, function(error){
                console.error('Error getting location:', error);
                alert('Failed to get location' + error.message);
            });
    }

    function cancelSave(){
        $('#location-prompt').hide(); 
        window.location.href = '/';
    }

    $('.like-icon').click(async function() {
        likeCount++;
        try{
            const payload = { parkingAreaId: idInput.value, positiveFeedback: true }
            const request = await fetch('http://localhost:3000/api/feedback', {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify(payload)
            })
            const result = await request.json()
            console.log(result);
            latestTimestamp = result.timestamp;
        }catch(e){
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-like');
        $('.dislike-icon').removeClass('active-dislike');
        updateMeter();
        updateLocalStorage();
        updateTimestampUI(latestTimestamp);
        showSaveParkingPrompt();
    });

    $('.dislike-icon').click(async function() {
        dislikeCount++;
        try{
            const payload = { parkingAreaId: idInput.value, positiveFeedback: false }
            const request = await fetch('http://localhost:3000/api/feedback', {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify(payload)
            })
            const result = await request.json()
            console.log(result);
            latestTimestamp = result.timestamp;
        }catch(e){
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-dislike');
        $('.like-icon').removeClass('active-like');
        updateMeter();
        updateLocalStorage();
        updateTimestampUI(latestTimestamp);
    });
    $("#toggleTime").click(function() {
        $(".time").slideToggle("slow", function() {
            if ($(this).is(":visible")) {
                // Scroll smoothly to the time slots after they are shown
                $('html, body').animate({
                    scrollTop: $(".time").offset().top
                }, 800); // Adjust the speed of scrolling (800ms)
            }
        });
    });
    $(document).ready(function(){
        $('.dislike-icon').on('click', function(){
            $('.alternative-box').slideDown("slow");
            $('html, body').animate({
                scrollTop: $(".alternative-box").offset().top
            }, 800);
        });
    })

    $('#location-prompt .yes').click(function() {
        saveParkingLocation();
    });
    $('#location-prompt .no').click(function(){
        cancelSave();
    });
        

    // Initial state
    updateMeter();
    updateTimestampUI(latestTimestamp);
});

