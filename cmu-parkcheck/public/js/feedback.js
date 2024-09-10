$(document).ready(async function() {
    // Initialize like and dislike counts from local storage if available
    const idInput = document.querySelector('#parkingId');
    const parkingId = idInput.value;
    
    const res = await fetch(`http://localhost:3000/api/feedback/${parkingId}`);
    const parkingStat = await res.json();
    console.log(parkingStat);

    let likeCount = parkingStat.likes ? parkingStat.likes : 0;
    let dislikeCount = parkingStat.dislikes ? parkingStat.dislikes : 0;
    let latestTimestamp = parkingStat.latestFeedbackTime ? parkingStat.latestFeedbackTime : null;

    const savedFeedback = localStorage.getItem('feedbacks');
    let feedbacks = savedFeedback ? JSON.parse(savedFeedback) : {};
    updateMeter();
    updateTimestampUI(latestTimestamp);
    // Ensure there's a structure for the current parking area
    if (!feedbacks[parkingId]) {
        feedbacks[parkingId] = [];
    }

    function getTimePeriods(timestamp){
        const date = new Date(timestamp);
        const hours = date.getHours();
        console.log('Timestamp: ', timestamp, 'Hours: ', hours)
        if (hours >= 7 && hours < 10) return '07:00 to 10:00';
        if (hours >= 10 && hours < 12) return '10:01 to 12:00';
        if (hours >= 12 && hours < 14) return '12.01 to 14.00';
        if (hours >= 14 && hours < 16) return '14:01 to 16:00';
        if (hours >= 16 && hours < 18) return '16:01 to 18:00';
        return 'Beyond 18:00';
    }

    function updateTimePeriodIcons() {
        const periods = {
            '07:00 to 10:00': { likes: 0, dislikes: 0 },
            '10:01 to 12:00': { likes: 0, dislikes: 0 },
            '12:01 to 14:00': { likes: 0, dislikes: 0 },
            '14:01 to 16:00': { likes: 0, dislikes: 0 },
            '16:01 to 18:00': { likes: 0, dislikes: 0 },
            'Beyond 18:00': { likes: 0, dislikes: 0 }
        };
    
        (feedbacks[parkingId] || []).forEach(feedback => {
            const period = getTimePeriods(feedback.timestamp);
            if (period in periods) {
                if (feedback.type === 'like') {
                    periods[period].likes++;
                } else {
                    periods[period].dislikes++;
                }
            }
        });
    
        $('.time-period').each(function() {
            const period = $(this).find('h3').text().trim();
            const { likes, dislikes } = periods[period] || { likes: 0, dislikes: 0 };
    
            if (likes === 0 && dislikes === 0) {
                // No feedback, show green
                $(this).find('.green-car').show();
                $(this).find('.red-car').hide();
                $(this).find('.yellow-car').hide();
            } else if (likes > dislikes) {
                // More likes than dislikes, show green
                $(this).find('.green-car').show();
                $(this).find('.red-car').hide();
                $(this).find('.yellow-car').hide();
            } else if (dislikes > likes) {
                // More dislikes than likes, show red
                $(this).find('.green-car').hide();
                $(this).find('.red-car').show();
                $(this).find('.yellow-car').hide();
            } else {
                // Likes and dislikes are equal, show yellow
                $(this).find('.green-car').hide();
                $(this).find('.red-car').hide();
                $(this).find('.yellow-car').show();
            }
        });
    }

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
        updateTimePeriodIcons(); // Update time-period icons based on current parking area
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
            if (feedback) {
                feedbackText = ` - <span style="color: ${feedback.color};">${feedback.text}</span>`;
                feedbackColor = 'black';
            }
            $('#timestamp').html(`Last feedback at: ${new Date(timestamp).toLocaleString()}${feedbackText}`);
        } else {
            $('#timestamp').text('No feedback yet.');
        }
    }

    function updateLocalStorage() {
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
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
        if (!feedbacks[parkingId]) {
            feedbacks[parkingId] = [];
        }
        feedbacks[parkingId].push(feedback);
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    }

    $('.like-icon').off('click').on('click', async function() {
        likeCount++;
        try {
            const payload = { parkingAreaId: parkingId, positiveFeedback: true };
            const request = await fetch('http://localhost:3000/api/feedback', {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify(payload)
            });
            const result = await request.json();
            console.log('Thumbs up positive feedback result:', result);
            latestTimestamp = result.timestamp;
            const feedback = { timestamp: latestTimestamp, type: 'like', color: 'green', text: 'THUMBS UP' };
            saveFeedbackToLocalStorage(feedback);
        } catch (e) {
            console.log('Error during thumbs up feedback:', e);
            alert("Error", e);
        }
        $(this).addClass('active-like');
        $('.dislike-icon').removeClass('active-dislike');
        updateMeter();
        updateLocalStorage();
        updateTimestampUI(latestTimestamp, { text: 'THUMBS UP', color: 'green' });
        showSaveParkingPrompt();
    });

    $('.dislike-icon').click(async function() {
        dislikeCount++;
        try {
            const payload = { parkingAreaId: parkingId, positiveFeedback: false };
            const request = await fetch('http://localhost:3000/api/feedback', {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify(payload)
            });
            const result = await request.json();
            console.log(result);
            latestTimestamp = result.timestamp;
            const feedback = { timestamp: latestTimestamp, type: 'dislike', color: 'red', text: 'THUMBS DOWN' };
            saveFeedbackToLocalStorage(feedback);
        } catch (e) {
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-dislike');
        $('.like-icon').removeClass('active-like');
        
        updateMeter();
        updateLocalStorage();
        updateTimestampUI(latestTimestamp, { text: 'THUMBS DOWN', color: 'red' });
        $('#alternative-prompt').show();
    });

    $("#toggleTime").click(function() {
        $(".time").slideToggle("slow", function() {
            if ($(this).is(":visible")) {
                    var scrollPosition = $(".time").offset().top + $(".time").outerHeight()-$(window).height() + 20;
                $('html, body').animate({
                    scrollTop: scrollPosition
                },800);
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

            try {
                const response = await fetch(`/api/nearby-parking?latitude=${latitude}&longitude=${longitude}`);
                const nearbyParking = await response.json();

                const uniqueParking = Array.from(new Map(nearbyParking.map(item => [item.id, item])).values());

                const parkingList = $('#parking-list');
                parkingList.empty();

                if (uniqueParking.length > 0) {
                    uniqueParking.forEach(parking => {
                        parkingList.append(`
                            <div class="parking-item">
                            <p><a href="/parking-details/${parking.id}">${parking.name}</a></p>
                            <p>${parking.distance.toFixed(2)} km away</p>
                            </div>
                        `);
                    });
                } else {
                    $('.alternative-box').append('<p>No nearby parking areas found.</p>');
                }
            } catch (error) {
                console.error('Error fetching nearby parking areas: ', error);
                $('.alternative-box').append('<p>Failed to load nearby parking areas.</p>');
            }
        }, function(error) {
            console.error("Error getting locations: ", error);
            $('.alternative-box').append('<p>Failed to get location</p>');
        });
    });

    $('#alternative-prompt .no').click(function() {
        window.location.href = '/';
    });

    $('#location-prompt .yes').click(function() {
        saveParkingLocation();
    });

    $('#location-prompt .no').click(function(){
        cancelSave();
    });
    $('.alternative-box .close-button').click(function() {
        $('.alternative-box').slideUp('slow');
    });
    $('.overlay-content .close-button').click(function() {
        $('.overlay-content').slideUp('slow');

    });
    $('.alternative-overlay-content .close-button').click(function(){
        $('.alternative-overlay-content').slideUp('slow');
    });

    updateMeter();
    updateTimestampUI(latestTimestamp);
});
