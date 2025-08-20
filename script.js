// A simple array to store meltdown data (simulating a database)
// We'll use localStorage to save and retrieve data, so it persists across sessions.
let meltdowns = JSON.parse(localStorage.getItem('meltdowns')) || [];

// Function to save data to localStorage
const saveMeltdowns = () => {
    localStorage.setItem('meltdowns', JSON.stringify(meltdowns));
};

// Function to process raw data into a heatmap-friendly format
const processDataForHeatmap = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const heatmapData = [];

    // Initialize all data points to 0 intensity
    days.forEach((day) => {
        hours.forEach((hour) => {
            heatmapData.push({
                x: day,
                y: hour,
                v: 0 // Intensity value
            });
        });
    });

    // Aggregate meltdown intensity for each day and hour
    meltdowns.forEach(meltdown => {
        const date = new Date(meltdown.dateTime);
        const day = days[date.getDay()];
        const hour = hours[date.getHours()];

        const dataPoint = heatmapData.find(d => d.x === day && d.y === hour);
        if (dataPoint) {
            dataPoint.v += parseInt(meltdown.intensity);
        }
    });

    return heatmapData;
};

// Function to create and render the heatmap
let myChart = null; // Variable to hold the chart instance

const renderHeatmap = () => {
    const ctx = document.getElementById('meltdown-heatmap').getContext('2d');
    const processedData = processDataForHeatmap();

    // If a chart already exists, destroy it before creating a new one
    if (myChart) {
        myChart.destroy();
    }

    const colors = ['#e0e6e9', '#6a8d9e', '#f4c742', '#d9534f'];

    myChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Meltdown Intensity',
                data: processedData,
                backgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    if (value > 2) return colors[3];
                    if (value === 2) return colors[2];
                    if (value === 1) return colors[1];
                    return colors[0];
                },
                borderColor: '#fff',
                borderWidth: 1,
                hoverBackgroundColor: '#333',
                width: ({ chart }) => (chart.chartArea.width / 7) - 2,
                height: ({ chart }) => (chart.chartArea.height / 24) - 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: () => '',
                        label: (context) => {
                            const dataPoint = context.dataset.data[context.dataIndex];
                            return `Day: ${dataPoint.x}, Hour: ${dataPoint.y}, Intensity: ${dataPoint.v}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
};

// Event listener for form submission
document.getElementById('meltdown-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const dateTime = document.getElementById('date-time').value;
    const intensity = document.getElementById('intensity').value;
    const triggers = document.getElementById('triggers').value;
    const behaviors = document.getElementById('behaviors').value;

    const newMeltdown = {
        id: Date.now(),
        dateTime: dateTime,
        intensity: intensity,
        triggers: triggers,
        behaviors: behaviors
    };

    meltdowns.push(newMeltdown);
    saveMeltdowns();

    // Rerender the heatmap with the new data
    renderHeatmap();

    // Reset the form for a new entry
    event.target.reset();
});

// Initial render of the heatmap when the page loads
window.onload = renderHeatmap;