document.getElementById('uploadForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  fetch('/api/upload', {
    method: 'POST',
    body: data
  })
  .then(res => res.json())
  .then(json => {
    if (json.error) {
      alert(json.error);
      return;
    }
    fillTable(json);
  })
  .catch(err => console.error(err));
});

document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/prices')
    .then(res => res.json())
    .then(fillTable)
    .catch(err => console.error(err));
});

function fillTable(data) {
  const tbody = document.querySelector('#pricesTable tbody');
  tbody.innerHTML = '';
  data.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.kalkis}</td>
      <td>${p.varis}</td>
      <td>${p.fiyat}</td>
    `;
    tbody.appendChild(tr);
  });
}
