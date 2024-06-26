showTime();
function showTime(){
    let date = new Date;

    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();

    let session = 'AM';

    if (h >= 12){
        session = 'PM'
    }
    if (h == 0){
        h = 12
    }
    if (h > 12){
        h = h - 12
    }

    if (h < 10 ){
        h = "0" + h;
    }
    if (m < 10){
        m = "0" + m;
    }
    if (s < 10){
        s = "0" + s;
    }

    let time = h + ' : ' + m + ' : ' + s + " " + session;

    $('#myclock').html(time);
    setTimeout(showTime, 1000)
}

function searchBuilding(){
    const input = document.getElementById('destination-input').value.trim();

    if(!input){
        alert('Invalid building name or building code.');
        return;
    }
    fetch(`http://localhost:3000/api/buildings/${encodeURIComponent(input)}`)
        .then(response => {
            if (!response.ok){
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(building => {
            console.log('Fetched building: ', building);

            if(buildingMarker){
                buildingMarker.setMap(null);
            }

            buildingMarker = new google.maps.Marker({
                position: { lat: parseFloat(building.latitude), lng: parseFloat(building.longitude) },
                map: map,
                title: building.name,
                icon:{
                    url: '/img/marker_building.png',
                    scaledSize: new google.maps.Size(75, 75)
                }
            });
            buildingMarker.addListener('click', () => {
                console.log(`Clicked on marker: ${building.name}`);
            });

            map.setCenter(buildingMarker.getPosition());
            map.setZoom(18);

            const radius = 150;
            parkingMarkers.forEach(marker => {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    buildingMarker.getPosition(), marker.getPosition());
                    if(distance <= radius){
                        marker.setMap(map);
                    }else{
                        marker.setMap(null);
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching building: ', error);
                alert('Building not found or error fetching data');
            });
        }
        document.getElementById('destination-input').addEventListener('keydown', function (event){
            if (event.key === 'Enter'){
                event.preventDefault();
                searchBuilding();
            }
        });