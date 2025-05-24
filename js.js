const chartTypeSelect = document.getElementById('chartType');
const dataInputs = document.getElementById('dataInputs');

chartTypeSelect.addEventListener('change', () => {
  updateInputForm();
});

function updateInputForm() {
  dataInputs.innerHTML = '';
  addDataPoint(); // Always show one input set
}

function addDataPoint() {
  const type = chartTypeSelect.value;
  const wrapper = document.createElement('div');
  wrapper.className = 'data-row';

  if (type === 'line') {
    wrapper.innerHTML = `
      <input type="number" placeholder="Days ago" class="x-val" />
      <input type="number" placeholder="Value" class="y-val" />
    `;
  } else {
    wrapper.innerHTML = `
      <input type="text" placeholder="Label" class="x-val" />
      <input type="number" placeholder="Value" class="y-val" />
    `;
  }

  dataInputs.appendChild(wrapper);
}

const barColors = [
'#5470C6', '#91CC75', '#EE6666', '#73C0DE',
'#FAC858', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'
];


function drawChart() {
const xValues = [];
const yValues = [];

const xInputs = document.querySelectorAll('.x-val');
const yInputs = document.querySelectorAll('.y-val');

const xLabel = document.getElementById('xAxisLabel').value.trim();

if (xLabel === '') {
  if (chartTypeSelect.value === 'line') {
    xLabel = 'Days Ago';
  } else {
    xLabel = 'X Axis';
  }
};


const yLabel = document.getElementById('yAxisLabel').value.trim();

if (yLabel === '') {
  yLabel = 'Y Axis';
};


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

if (xValues.length === 0 || yValues.length === 0) {
alert('Please enter at least one valid data point.');
return;
}

const chart = echarts.init(document.getElementById('main'));

const option = {
title: { text: 'Your Custom Chart' },
tooltip: {},
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

chart.setOption(option);
window.addEventListener('resize', () => chart.resize());
}

// Initial load
updateInputForm();
