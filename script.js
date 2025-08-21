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

    meltdowns.forEach(meltdown => {
        const date = new Date(meltdown.dateTime);
        const dayIndex = date.getDay();
        const hour = date.getHours();

        let dataPoint = heatmapData.find(d => d.x === dayIndex && d.y === hour);
        
        if (dataPoint) {
            dataPoint.v += parseInt(meltdown.intensity);
        } else {
            heatmapData.push({
                x: dayIndex,
                y: hour,
                v: parseInt(meltdown.intensity)
            });
        }
    });

    return heatmapData;
};

let myChart = null;

const renderHeatmap = () => {
    const processedData = processDataForHeatmap();
    
    const colors = {
        mild: '#6a8d9e',
        moderate: '#f4c742',
        severe: '#d9534f'
    };

    const datasets = [{
        label: 'Meltdown Intensity',
        data: processedData.map(d => ({
            x: d.x,
            y: d.y,
            v: d.v,
            r: d.v * 10
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
    
    if (myChart) {
        myChart.data.datasets = datasets;
        myChart.update();
    } else {
        const ctx = document.getElementById('meltdown-heatmap').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: datasets },
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
                        grid: { display: false },
                        title: { display: true, text: 'Day of the Week' }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: 23.5,
                        reverse: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) { return `${value}:00`; }
                        },
                        grid: { display: false },
                        title: { display: true, text: 'Time of Day' }
                    }
                },
                elements: {
                    point: {
                        pointStyle: 'rect',
                        radius: ({raw}) => raw.v * 10,
                    }
                }
            }
        });
    }
};

document.getElementById('meltdown-form').addEventListener('submit', (event) => {
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
    renderHeatmap();
    event.target.reset();
});

window.onload = renderHeatmap;

document.getElementById('reset-button').addEventListener('click', () => {
    // Clear all data from localStorage
    localStorage.clear();
    
    // Reset the meltdowns array to be empty
    meltdowns = [];
    
    // Rerender the heatmap to show a blank state
    renderHeatmap();
    
    alert('App has been reset. All meltdown data has been cleared.');
});
