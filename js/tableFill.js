var table = document.getElementById("resultTable");
fetch('http://localhost:5000/api/summary')
    .then(res => res.json())
    .then((out) => {
        for (var i=0; i<out.length; i++) {
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = out[i].name;
            cell2.innerHTML = out[i].votes;
        }
}).catch(err => console.error('Error:', err));