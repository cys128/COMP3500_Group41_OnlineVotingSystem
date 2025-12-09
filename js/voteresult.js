let candidates = [];
let totalVotes = 0;
let currentSort = 'vote-desc';

function initVoteResults() {
    loadCandidatesData();
    updateStats();
    renderResults();
    renderVoteChart();
}

function loadCandidatesData() {
    try {
        const storedCandidates = localStorage.getItem('candidates');
        if (storedCandidates) {
            candidates = JSON.parse(storedCandidates);
        } else {
            candidates = [];
        }
        
        if (!Array.isArray(candidates)) {
            candidates = [];
        }
        
        totalVotes = candidates.reduce((sum, candidate) => {
            return sum + (parseInt(candidate.vote) || 0);
        }, 0);
    } catch (error) {
        console.error('Failed to load candidate data:', error);
        candidates = [];
        totalVotes = 0;
    }
}

function updateStats() {
    if (candidates.length === 0) {
        document.getElementById('totalVotes').textContent = '0';
        document.getElementById('totalCandidates').textContent = '0';
        document.getElementById('maxVotes').textContent = '0';
        document.getElementById('avgVotes').textContent = '0';
        return;
    }
    
    const total = totalVotes;
    const count = candidates.length;
    const maxVote = Math.max(...candidates.map(c => parseInt(c.vote) || 0));
    const avgVote = total > 0 ? (total / count).toFixed(1) : '0';
    
    document.getElementById('totalVotes').textContent = total;
    document.getElementById('totalCandidates').textContent = count;
    document.getElementById('maxVotes').textContent = maxVote;
    document.getElementById('avgVotes').textContent = avgVote;
}

function renderResults() {
    const tbody = document.getElementById('resultsBody');
    const noResults = document.getElementById('noResults');
    
    tbody.innerHTML = '';
    
    if (candidates.length === 0) {
        tbody.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    tbody.style.display = 'table-row-group';
    noResults.style.display = 'none';
    
    let sortedCandidates = [...candidates];
    
    switch(currentSort) {
        case 'id':
            sortedCandidates.sort((a, b) => (a.id || 0) - (b.id || 0));
            break;
        case 'vote-asc':
            sortedCandidates.sort((a, b) => (a.vote || 0) - (b.vote || 0));
            break;
        case 'vote-desc':
        default:
            sortedCandidates.sort((a, b) => (b.vote || 0) - (a.vote || 0));
            break;
    }
    
    sortedCandidates.forEach((candidate, index) => {
        const voteCount = parseInt(candidate.vote) || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
        
        let rankClass = 'rank-other';
        let rankText = index + 1;
        
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${rankText}</span></td>
            <td>
                <div class="candidate-info">
                    <div class="candidate-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div>
                        <strong>${candidate.name || 'Unnamed'}</strong>
                    </div>
                </div>
            </td>
            <td>${candidate.college || 'Unknown College'}</td>
            <td class="vote-progress-container">
                <div class="vote-info">
                    <span>${voteCount} votes</span>
                    <span>${percentage}%</span>
                </div>
                <div class="vote-progress">
                    <div class="vote-fill" style="width: ${percentage}%"></div>
                </div>
            </td>
            <td><strong>${voteCount}</strong></td>
            <td><strong>${percentage}%</strong></td>
        `;
        
        tbody.appendChild(row);
    });
    
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.vote-fill');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 100);
}

function renderVoteChart() {
    const chartContainer = document.getElementById('voteChart');
    
    if (candidates.length === 0) {
        chartContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-bar"></i>
                <p>No data available for chart generation</p>
            </div>
        `;
        return;
    }
    
    const topCandidates = [...candidates]
        .sort((a, b) => (b.vote || 0) - (a.vote || 0))
        .slice(0, 8);
    
    const labels = topCandidates.map(c => c.name);
    const data = topCandidates.map(c => c.vote || 0);
    const colors = [
        '#4a00e0', '#8e2de2', '#36A2EB', '#FF6384',
        '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
    ];
    
    chartContainer.innerHTML = `
        <div style="height: 350px; position: relative; padding: 20px;">
            <div style="display: flex; height: 300px; align-items: flex-end; gap: 10px;">
                ${data.map((value, index) => {
                    const height = totalVotes > 0 ? (value / Math.max(...data) * 250) : 0;
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 40px; height: ${height}px; background: ${colors[index]}; border-radius: 5px 5px 0 0; transition: height 1s ease;"></div>
                            <div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: #666; text-align: center; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${labels[index]}
                            </div>
                            <div style="margin-top: 5px; font-size: 14px; font-weight: 700; color: #333;">
                                ${value}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #e0e0e0;"></div>
        </div>
    `;
    
    setTimeout(() => {
        const bars = chartContainer.querySelectorAll('div[style*="height: 0px"]');
        bars.forEach(bar => {
            const originalStyle = bar.getAttribute('style');
            const heightMatch = originalStyle.match(/height: (\d+)px/);
            if (heightMatch) {
                const targetHeight = heightMatch[1];
                bar.style.height = '0px';
                setTimeout(() => {
                    bar.style.height = `${targetHeight}px`;
                }, 100);
            }
        });
    }, 100);
}

function sortBy(sortType) {
    currentSort = sortType;
    
    document.querySelectorAll('.results-controls .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    let activeButton = null;
    if (sortType === 'id') {
        activeButton = document.querySelector('button[onclick*="sortBy(\'id\')"]');
    } else if (sortType === 'vote-asc') {
        activeButton = document.querySelector('button[onclick*="sortBy(\'vote-asc\')"]');
    } else if (sortType === 'vote-desc') {
        activeButton = document.querySelector('button[onclick*="sortBy(\'vote-desc\')"]');
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    renderResults();
}

function exportToCSV() {
    if (candidates.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    let csv = 'Rank,Name,College,Votes,Percentage\n';
    
    const sortedCandidates = [...candidates].sort((a, b) => (b.vote || 0) - (a.vote || 0));
    
    sortedCandidates.forEach((candidate, index) => {
        const voteCount = parseInt(candidate.vote) || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : 0;
        
        csv += `${index + 1},${candidate.name},${candidate.college},${voteCount},${percentage}%\n`;
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Voting_Results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Voting results exported as CSV file', 'success');
}

document.addEventListener('DOMContentLoaded', function() {
    const defaultButton = document.querySelector('button[onclick*="sortBy(\'vote-desc\')"]');
    if (defaultButton) {
        defaultButton.classList.add('active');
    }
});

window.initVoteResults = initVoteResults;
window.sortBy = sortBy;
window.exportToCSV = exportToCSV;