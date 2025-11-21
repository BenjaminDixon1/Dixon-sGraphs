const chartTypeSelect = document.getElementById('chartType');
const dataInputs = document.getElementById('dataInputs');
const errorMessage = document.getElementById('errorMessage');
const drawChartBtn = document.getElementById('drawChartBtn');

chartTypeSelect.addEventListener('change', () => {
  updateInputForm();
  clearError();
  validateInputs();
});

function updateInputForm() {
  dataInputs.innerHTML = '';
  addDataPoint(); // Always show one input set
  validateInputs();
}

function addDataPoint() {
  const type = chartTypeSelect.value;
  const wrapper = document.createElement('div');
  wrapper.className = 'data-row';

  if (type === 'line') {
    wrapper.innerHTML = `
      <input type="number" placeholder="Days ago" class="x-val" aria-label="X value (Days ago)" />
      <input type="number" placeholder="Value" class="y-val" aria-label="Y value" />
    `;
  } else {
    wrapper.innerHTML = `
      <input type="text" placeholder="Label" class="x-val" aria-label="X value (Label)" />
      <input type="number" placeholder="Value" class="y-val" aria-label="Y value" />
    `;
  }

  dataInputs.appendChild(wrapper);
  attachInputListeners(wrapper);
  validateInputs();
}

function removeDataPoint() {
  if (dataInputs.lastChild) {
    dataInputs.removeChild(dataInputs.lastChild);
    validateInputs();
  }
}

function attachInputListeners(wrapper) {
  const inputs = wrapper.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      clearError();
      validateInputs();
    });
  });
}

const barColors = [
  '#5470C6', '#91CC75', '#EE6666', '#73C0DE',
  '#FAC858', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'
];

function validateInputs() {
  const xInputs = document.querySelectorAll('.x-val');
  const yInputs = document.querySelectorAll('.y-val');

  let hasValidData = false;

  for (let i = 0; i < xInputs.length; i++) {
    const xRaw = xInputs[i].value.trim();
    const yRaw = yInputs[i].value.trim();
    const y = parseFloat(yRaw);

    if (xRaw === '' || yRaw === '' || isNaN(y)) continue;

    if (chartTypeSelect.value === 'line') {
      const x = parseFloat(xRaw);
      if (isNaN(x)) continue;
    }

    hasValidData = true;
    break;
  }

  drawChartBtn.disabled = !hasValidData;
  return hasValidData;
}

function clearError() {
  errorMessage.textContent = '';
}

function showError(msg) {
  errorMessage.textContent = msg;
}

let resizeTimeout;
let chartCounter = 0;
let draggedElement = null;

function debounceResize(chart) {
  window.removeEventListener('resize', onResize);
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      chart.resize();
    }, 200);
  }
  window.addEventListener('resize', onResize);
}

function drawChart() {
  if (!validateInputs()) {
    showError('Please enter at least one valid data point.');
    return;
  }

  const xValues = [];
  const yValues = [];

  const xInputs = document.querySelectorAll('.x-val');
  const yInputs = document.querySelectorAll('.y-val');

  let xLabel = document.getElementById('xAxisLabel').value.trim();
  if (xLabel === '') {
    xLabel = chartTypeSelect.value === 'line' ? 'Days Ago' : 'X Axis';
  }

  let yLabel = document.getElementById('yAxisLabel').value.trim();
  if (yLabel === '') {
    yLabel = 'Y Axis';
  }

  for (let i = 0; i < xInputs.length; i++) {
    const xRaw = xInputs[i].value.trim();
    const y = parseFloat(yInputs[i].value);

    if (xRaw === '' || isNaN(y)) continue;

    if (chartTypeSelect.value === 'line') {
      const x = parseFloat(xRaw);
      if (isNaN(x)) continue;
      xValues.push(x);
    } else {
      xValues.push(xRaw);
    }
    yValues.push(y);
  }

  // Create a new chart container
  const chartContainer = document.getElementById('chartContainer');
  const chartItem = document.createElement('div');
  chartItem.className = 'chart-item';
  chartItem.id = `chart-${chartCounter++}`;
  chartItem.style.left = `${Math.random() * 200}px`;
  chartItem.style.top = `${Math.random() * 200}px`;

  // Add delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-chart-btn';
  deleteBtn.textContent = '×';
  deleteBtn.onclick = () => deleteChart(chartItem.id);
  chartItem.appendChild(deleteBtn);

  // Add chart div
  const chartDiv = document.createElement('div');
  chartDiv.style.width = '100%';
  chartDiv.style.height = '100%';
  chartItem.appendChild(chartDiv);

  chartContainer.appendChild(chartItem);

  const chart = echarts.init(chartDiv, null);

  const option = {
    title: { text: 'Your Custom Chart' },
    xAxis: {
      type: chartTypeSelect.value === 'line' ? 'value' : 'category',
      name: xLabel,
      nameLocation: 'middle',
      nameGap: 25,
      data: chartTypeSelect.value === 'bar' ? xValues : undefined
    },
    yAxis: {
      type: 'value',
      name: yLabel,
      nameLocation: 'middle',
      nameGap: 35
    },
    series: [{
      name: 'Data',
      type: chartTypeSelect.value,
      data: chartTypeSelect.value === 'line'
        ? xValues.map((x, i) => [x, yValues[i]])
        : yValues.map((y, i) => ({
          value: y,
          itemStyle: {
            color: barColors[i % barColors.length]
          }
        }))
    }]
  };

  // Configure tooltip
  option.tooltip = {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#ddd',
    textStyle: {
      color: '#333'
    },
    formatter: function(params) {
      return params[0].name + ': ' + params[0].value;
    }
  };

  chart.setOption(option);
  debounceResize(chart);

  // Make draggable
  makeDraggable(chartItem);
}

function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    // Prevent drag if clicking on delete button
    if (e.target.closest('.delete-chart-btn')) {
      return;
    }
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    element.classList.add('dragging');
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    element.classList.remove('dragging');
  }
}

function deleteChart(chartId) {
  const chartItem = document.getElementById(chartId);
  if (chartItem) {
    chartItem.remove();
  }
}

function deleteAllCharts() {
  const chartContainer = document.getElementById('chartContainer');
  chartContainer.innerHTML = '';
  chartCounter = 0;
}

// Initial load
updateInputForm();
