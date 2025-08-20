// Data structure to hold our meltdown logs
let meltdowns = JSON.parse(localStorage.getItem('meltdowns')) || [];

// Function to save data to localStorage
const saveMeltdowns = () => {
    localStorage.setItem('meltdowns', JSON.stringify(meltdowns));
};

// Function to process raw data into a scatter plot-friendly format
const processDataForHeatmap = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmapData = [];

    // Aggregate meltdown intensity for each day and hour
    meltdowns.forEach(meltdown => {
        const date = new Date(meltdown.dateTime);
        const dayIndex = date.getDay();
        const hour = date.getHours();

        // Check if a data point for this day/hour already exists
        let dataPoint = heatmapData.find(d => d.x === dayIndex && d.y === hour);
        
        if (dataPoint) {
            // If it exists, sum the intensity values
            dataPoint.v += parseInt(meltdown.intensity);
        } else {
            // If it doesn't exist, create a new one
            heatmapData.push({
                x: dayIndex,
                y: hour,
                v: parseInt(meltdown.intensity)
            });
        }
    });

    return heatmapData;
};

// Initial chart instance, will be populated on window load
let myChart = null;

// Function to create and render the heatmap
const renderHeatmap = () => {
    const processedData = processDataForHeatmap();
    
    // Define the colors for the heatmap
    const colors = {
        mild: '#6a8d9e', // Mild
        moderate: '#f4c742', // Moderate
        severe: '#d9534f' // Severe
    };

    const datasets = [{
        label: 'Meltdown Intensity',
        data: processedData.map(d => ({
            x: d.x,
            y: d.y,
            v: d.v, // Add the intensity value to the data point
            r: d.v * 10 // Use intensity to control the size of the point
        })),
        backgroundColor: processedData.map(d => {
            if (d.v > 2) return colors.severe;
            if (d.v === 2) return colors.moderate;
            if (d.v === 1) return colors.mild;
            return '#e0e6e9';
        }),
        borderColor: '#fff',
        borderWidth: 1,
    }];
    
    // If a chart already exists, update its data
    if (myChart) {
        myChart.data.datasets = datasets;
        myChart.update();
    } else {
        // Otherwise, create a new chart
        const ctx = document.getElementById('meltdown-heatmap').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'scatter', // Use scatter plot as a robust alternative
            data: {
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: () => '',
                            label: (context) => {
                                const dataPoint = context.raw;
                                const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
                                return `Day: ${dayLabels[dataPoint.x]}, Hour: ${hourLabels[dataPoint.y]}, Intensity: ${dataPoint.v}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: -0.5,
                        max: 6.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                return dayLabels[value];
                            }
                        },
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Day of the Week'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: 23.5,
                        reverse: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return `${value}:00`;
                            }
                        },
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Time of Day'
                        }
                    }
                },
                elements: {
                    point: {
                        pointStyle: 'rect', // Make the points square to look like a heatmap
                        radius: ({raw}) => raw.v * 10, // Dynamic size based on intensity
                    }
                }
            }
        });
    }
};

// Event listener for form submission
document.getElementById('meltdown-form').addEventListener('submit', (event) => {
    // Prevent the form from submitting and refreshing the page
    event.preventDefault();

    const dateTime = document.getElementById('date-time').value;
    const intensity = document.getElementById('intensity').value;
    const triggers = document.getElementById('triggers').value;
    const behaviors = document.getElementById('behaviors').value;

    if (!dateTime || !intensity || !triggers || !behaviors) {
        alert('Please fill out all fields.');
        return;
    }

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
