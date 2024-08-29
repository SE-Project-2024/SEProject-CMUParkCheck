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

        $('.time-period').each(function() {
            const periodLikePercentage = likePercentage;
            const periodDislikePercentage = dislikePercentage;
            if (periodLikePercentage > periodDislikePercentage) {
                $(this).find('.green-car').show();
                $(this).find('.red-car').hide();
                $(this).find('.yellow-car').hide();
            } else if (periodDislikePercentage > periodLikePercentage) {
                $(this).find('.green-car').hide();
                $(this).find('.red-car').show();
                $(this).find('.yellow-car').hide();
            } else {
                $(this).find('.green-car').hide();
                $(this).find('.red-car').hide();
                $(this).find('.yellow-car').show();
            }
        });
    }
    function updateStatusText(likePercentage, dislikePercentage){
        const statusText = $('#statusText');
        if (likePercentage > dislikePercentage){
            statusText.text('Possibility: AVAILABLE');
        } else if (dislikePercentage > likePercentage){
            statusText.text('Possibility: FULL');
        } else {
            statusText.text('Possibility: AVAILABLE');
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
        navigator.geolocation.getCurrentPosition(
            function(position){
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const parkingId = idInput.value;

            console.log('Vehicle Location: ', { latitude, longitude });
             $('#location-info').text(`Latitude: ${latitude}, Longitude: ${longitude}`);  
             $('#location-prompt').hide();
             localStorage.setItem('savedLocation', JSON.stringify({ latitude, longitude }));
             window.location.href = '/?parkingSaved=true';
            }, function(error){
                console.error('Error getting location:', error);
                alert('Failed to get location' + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
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
        navigator.geolocation.getCurrentPosition(async function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try{
                const response = await fetch(`/api/nearby-parking?latitude=${latitude}&longitude=${longitude}`);
                const nearbyParking = await response.json();

                const uniqueParking = Array.from(new Map(nearbyParking.map(item => [item.id, item])).values());

                const parkingList = $('#parking-list');
                parkingList.empty();

                if(uniqueParking.length > 0){
                    uniqueParking.forEach(parking => {
                        parkingList.append(`
                            <div class="parking-item">
                            <p><a href="/parking-details/${parking.id}">${parking.name}</a></p>
                            <p>${parking.distance.toFixed(2)} km away</p>
                            </div>
                        `);
                    });
                } else {
                    alternativeBox.append('<p>No nearby parking areas found. </p>');
                }
            } catch(error){
                console.error('Error fetching nearby parking areas: ', error);
                $('.alternative-box').append('<p>Failed to load nearby parking areas. </p>');
            }
        }, function(error){
            console.error("Error getting locations: ", error);
            $('.alternative-box').append('<p>Failed to get location</p>');
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

