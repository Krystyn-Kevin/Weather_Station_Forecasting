const channelID = "3465974";
const readAPIKey = "O96LBWT2V5EP0O88"; // Paste your Read API Key here!

// Global variables to store the chart objects so we can destroy them later
let tempChartObj = null;
let humChartObj = null;
let preChartObj = null;

document.addEventListener("DOMContentLoaded", () => {
    // Fetch data immediately when the page loads
    fetchData();

    // Listen for the dropdown to change, and fetch new data when it does
    document.getElementById('timeRange').addEventListener('change', fetchData);
});

async function fetchData() {
    // Read how many minutes the user selected from the dropdown
    const minutes = document.getElementById('timeRange').value;
    
    // Dynamically insert the minutes into the ThingSpeak URL
    const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&minutes=${minutes}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        processData(data.feeds);
    } catch (error) {
        console.error("Error fetching data from ThingSpeak:", error);
    }
}

function processData(feeds) {
    if (!feeds || feeds.length === 0) return;

    const timestamps = [];
    const temperatures = [];
    const humidities = [];
    const pressures = [];

    feeds.forEach(feed => {
        const date = new Date(feed.created_at);
        timestamps.push(date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        temperatures.push(parseFloat(feed.field1) || null); 
        pressures.push(parseFloat(feed.field2) || null); 
        humidities.push(parseFloat(feed.field3) || null);
    });

    // Update Current Stats UI
    const latestFeed = feeds[feeds.length - 1];
    document.getElementById('current-temp').innerText = `${parseFloat(latestFeed.field1).toFixed(2)} °C`;
    document.getElementById('current-pre').innerText = `${parseFloat(latestFeed.field2).toFixed(2)} hPa`;
    document.getElementById('current-hum').innerText = `${parseFloat(latestFeed.field3).toFixed(2)} %`;

    // Generate Prediction
    const predictedTemp = calculateLinearRegressionPrediction(temperatures);
    document.getElementById('predicted-temp').innerText = `${predictedTemp} °C`;

    // Draw the three separate charts
    drawCharts(timestamps, temperatures, humidities, pressures);
}

function calculateLinearRegressionPrediction(dataArray) {
    // Filter out nulls for the math
    const cleanData = dataArray.filter(val => val !== null);
    let n = cleanData.length;
    if (n === 0) return "--";

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += cleanData[i];
        sumXY += (i * cleanData[i]);
        sumXX += (i * i);
    }

    let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    let intercept = (sumY - slope * sumX) / n;

    // Predict 288 steps ahead (24 hours at 5 min intervals)
    let predictedPosition = n + 288;
    let prediction = (slope * predictedPosition) + intercept;

    return prediction.toFixed(2);
}

function drawCharts(labels, tempData, humData, preData) {
    // 1. Destroy existing charts if they exist to prevent glitches
    if (tempChartObj) tempChartObj.destroy();
    if (humChartObj) humChartObj.destroy();
    if (preChartObj) preChartObj.destroy();

    // 2. Draw Temperature Chart
    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    tempChartObj = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Draw Humidity Chart
    const ctxHum = document.getElementById('humChart').getContext('2d');
    humChartObj = new Chart(ctxHum, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Humidity (%)',
                data: humData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 4. Draw Pressure Chart
    const ctxPre = document.getElementById('preChart').getContext('2d');
    preChartObj = new Chart(ctxPre, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pressure (hPa)',
                data: preData,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
