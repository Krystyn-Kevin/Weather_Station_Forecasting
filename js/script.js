// Your specific ThingSpeak Channel ID
const channelID = "3465974";
const readAPIKey = "O96LBWT2V5EP0O88";

// The updated URL that includes your API key
const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=288`;
// Ensure the page is loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        processData(data.feeds);
    } catch (error) {
        console.error("Error fetching data from ThingSpeak:", error);
        document.getElementById('current-temp').innerText = "Error loading";
    }
}

function processData(feeds) {
    if (feeds.length === 0) return;

    // Arrays to hold the data for the chart
    const timestamps = [];
    const temperatures = [];
    const humidities = [];

    // Parse the ThingSpeak JSON
    feeds.forEach(feed => {
        // Convert ThingSpeak timestamp to local time
        const date = new Date(feed.created_at);
        timestamps.push(date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        // Push data (checking if null, default to 0 to prevent chart breaks)
        temperatures.push(parseFloat(feed.field1) || 0); 
        humidities.push(parseFloat(feed.field3) || 0);
    });

    // 1. Update Current Stats UI with the absolute latest reading (last item in array)
    const latestFeed = feeds[feeds.length - 1];
    document.getElementById('current-temp').innerText = `${parseFloat(latestFeed.field1).toFixed(2)} °C`;
    document.getElementById('current-hum').innerText = `${parseFloat(latestFeed.field3).toFixed(2)} %`;
    document.getElementById('current-pre').innerText = `${parseFloat(latestFeed.field2).toFixed(2)} hPa`;

    // 2. Generate Prediction
    const predictedTemp = calculateLinearRegressionPrediction(temperatures);
    document.getElementById('predicted-temp').innerText = `${predictedTemp} °C`;

    // 3. Render Chart
    drawChart(timestamps, temperatures, humidities);
}

// Simple Linear Regression to find the trend line of the dataset
function calculateLinearRegressionPrediction(dataArray) {
    let n = dataArray.length;
    if (n === 0) return "--";

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    // X is time step (0 to n), Y is temperature
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dataArray[i];
        sumXY += (i * dataArray[i]);
        sumXX += (i * i);
    }

    // Calculate slope (m) and y-intercept (b)
    let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    let intercept = (sumY - slope * sumX) / n;

    // Predict the value a full day ahead 
    // If you log every 5 mins, there are 288 logs in a day. 
    // We want the value at position (n + 288)
    let predictedPosition = n + 288;
    let prediction = (slope * predictedPosition) + intercept;

    return prediction.toFixed(2);
}

function drawChart(labels, tempData, humData) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    yAxisID: 'y',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Humidity (%)',
                    data: humData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Temperature (°C)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Humidity (%)' },
                    grid: { drawOnChartArea: false } // Prevent grid line overlapping
                }
            }
        }
    });
}