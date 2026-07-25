const fs = require('fs');
const content = fs.readFileSync('src/style.css', 'utf-8');
if (content.includes('--pgv-animation-duration: 300ms')) {
  console.log('OK: --pgv-animation-duration found');
} else {
  console.log('FAIL: --pgv-animation-duration not found');
}
if (content.includes('.pgv-pan-zoom-layer')) {
  console.log('OK: .pgv-pan-zoom-layer found');
} else {
  console.log('FAIL: .pgv-pan-zoom-layer not found');
}
if (content.includes('.pgv-graph-stage .exiting')) {
  console.log('OK: exiting classes found');
} else {
  console.log('FAIL: exiting classes not found');
}
