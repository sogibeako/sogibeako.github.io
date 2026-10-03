export function renderResult(htmlContent) {
  const resultArea = document.getElementById('result-area');
  
  const block = document.createElement('div');
  block.innerHTML = htmlContent;
  
  resultArea.innerHTML = '';
  resultArea.appendChild(block);

  // Trigger MathJax typesetting if available
  if (window.MathJax) {
    MathJax.typesetPromise([resultArea]).catch((err) => console.log(err));
  }
}

export function renderError(message) {
  renderResult(`<div class="error-msg"><b>エラー:</b><br>${message}</div>`);
}

export function buildResultBlock(title, mathTex, explanation = '') {
  let html = `<div class="result-block">
    <div class="def-label">${title}</div>
    <div class="math-display">$$${mathTex}$$</div>`;
  
  if (explanation) {
    html += `<div class="explanation-block">${explanation}</div>`;
  }
  
  html += `</div>`;
  return html;
}

export function buildFactorizationTex(factors, ringType) {
  if (factors.length === 0) return "(1)"; // unit ideal
  if (factors.length === 1 && factors[0].isZero) return "(0)";
  
  let texParts = [];
  for (let f of factors) {
    // Generate tex string for the prime factor
    let primeStr = "";
    if (ringType === 'Z') {
      primeStr = f.prime;
    } else if (ringType === 'Fp[x]') {
      // Need access to ring formatter... let's just assume factors pass their formatted TeX.
      // We will handle formatting in main.js and pass formatted string here.
      primeStr = f.tex; 
    }
    
    let part = `(${primeStr})`;
    if (f.exponent > 1) {
      part += `^{${f.exponent}}`;
    }
    texParts.push(part);
  }
  return texParts.join(" \\cdot ");
}
