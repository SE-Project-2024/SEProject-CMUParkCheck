$(document).ready(async function() {
    // Initialize like and dislike counts from local storage if available
    const idInput = document.querySelector('#parkingId')
    
    const res = await fetch(`http://localhost:3000/api/feedback/${idInput.value}`)
    const parkingStat = await res.json() 
    console.log(parkingStat);
    let likeCount = parkingStat.likes? parkingStat.likes: 0;
    let dislikeCount = parkingStat.dislikes? parkingStat.dislikes: 0;
    let latestTimestamp = parkingStat.latestFeedbackTime ? parkingStat.latestFeedbackTime : null;

    const savedFeedback = localStorage.getItem('latestFeedback');
    let latestFeedback = savedFeedback ? JSON.parse(savedFeedback) : null;

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
        updateStatusText(likePercentage, dislikePercentage);
    }
    function updateStatusText(likePercentage, dislikePercentage){
        const statusText = $('#statusText');
        if (likePercentage > dislikePercentage){
            statusText.text('STATUS: Available');
        } else if (dislikePercentage > likePercentage){
            statusText.text('STATUS: Full');
        } else {
            statusText.text('STATUS: Available');
        }
    }
    function updateTimestampUI(timestamp, feedback) {
        let feedbackText = '';
        let feedbackColor = 'black';
        if (timestamp) {
            if (feedback){
                feedbackText = ` - <span style="color: ${feedback.color};">${feedback.text}</span>`;
                feedbackColor = 'black';
            }
            $('#timestamp').html(`Last feedback at: ${new Date(timestamp).toLocaleString()}${feedbackText}`);
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

    function saveFeedbackToLocalStorage(feedback){
        localStorage.setItem('latestFeedback', JSON.stringify(feedback));
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
            latestFeedback = { text: "THUMBS UP", color: "green"};
            saveFeedbackToLocalStorage(latestFeedback);
        }catch(e){
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-like');
        $('.dislike-icon').removeClass('active-dislike');
        updateMeter();
        updateLocalStorage();
        updateTimestampUI(latestTimestamp, latestFeedback);
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
            latestFeedback = { text: "THUMBS DOWN", color: "red"};
            saveFeedbackToLocalStorage(latestFeedback);
        }catch(e){
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-dislike');
        $('.like-icon').removeClass('active-like');
        
        updateMeter();
        updateLocalStorage();
        updateTimestampUI(latestTimestamp);
        $('#alternative-prompt').show();
        updateTimestampUI(latestTimestamp, latestFeedback);
    });
    $("#toggleTime").click(function() {
        $(".time").slideToggle("slow", function() {
            if ($(this).is(":visible")) {
                $('html, body').animate({
                    scrollTop: $(".time").offset().top
                }, 800); 
            }
        });
    });
    
    $('#alternative-prompt .yes').click(function() {
        $('#alternative-prompt').hide();
        $('.alternative-box').slideDown('slow', function() {
            $('html, body').animate({
                scrollTop: $('.alternative-box').offset().top
            }, 800);
        });
    });
    $('#alternative-prompt .no').click(function() {
        window.location.href= '/'
    })

    $('#location-prompt .yes').click(function() {
        saveParkingLocation();
    });
    $('#location-prompt .no').click(function(){
        cancelSave();
    });
        
    updateMeter();
    updateTimestampUI(latestTimestamp, latestFeedback);
});

