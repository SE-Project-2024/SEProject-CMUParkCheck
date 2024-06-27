$(document).ready(async function() {
    // Initialize like and dislike counts from local storage if available
    const idInput = document.querySelector('#parkingId')
    
    const res = await fetch(`http://localhost:3000/api/feedback/${idInput.value}`)
    const parkingStat = await res.json() 
    console.log(parkingStat);
    let likeCount = parkingStat.likes? parkingStat.likes: 0;
    let dislikeCount = parkingStat.dislikes? parkingStat.dislikes: 0;

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

    function updateLocalStorage() {
        localStorage.setItem('likeCount', likeCount);
        localStorage.setItem('dislikeCount', dislikeCount);
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
        }catch(e){
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-like');
        $('.dislike-icon').removeClass('active-dislike');
        updateMeter();
        updateLocalStorage();
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
        }catch(e){
            console.log(e);
            alert("Error", e);
        }
        $(this).addClass('active-dislike');
        $('.like-icon').removeClass('active-like');
        updateMeter();
        updateLocalStorage();
    });

    // Initial state
    updateMeter();

});
