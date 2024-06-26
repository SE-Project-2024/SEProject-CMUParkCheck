// $(document).ready(function() {
//     let likeCount = 0;
//     let dislikeCount = 0;

//     function updateMeter() {
//         const total = likeCount + dislikeCount;
//         let likePercentage = 50;
//         let dislikePercentage = 50;

//         if (total > 0) {
//             likePercentage = (likeCount / total) * 100;
//             dislikePercentage = (dislikeCount / total) * 100;
//         }

//         $('#green').css('width', `${likePercentage}%`);
//         $('#red').css('width', `${dislikePercentage}%`);
//     }

//     $('.like-icon').click(function() {
//         likeCount++;
//         updateMeter();
//     });

//     $('.dislike-icon').click(function() {
//         dislikeCount++;
//         updateMeter();
//     });

//     // Initial state
//     updateMeter();
// });
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
        updateMeter();
    });

    $('.dislike-icon').click(function() {
        dislikeCount++;
        updateMeter();
    });

    // Initial state
    updateMeter();
});
