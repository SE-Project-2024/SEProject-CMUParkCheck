$(document).ready(function() {
    let likeCount = 1;
    let dislikeCount = 1;

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

    $('.like-icon').click(function() {
        likeCount++;
        $(this).addClass('active-like');
        $('.dislike-icon').removeClass('active-dislike');
        updateMeter();
    });

    $('.dislike-icon').click(function() {
        dislikeCount++;
        $(this).addClass('active-dislike');
        $('.like-icon').removeClass('active-like'); 
        updateMeter();
    });

    // Initial state
    updateMeter();
});
